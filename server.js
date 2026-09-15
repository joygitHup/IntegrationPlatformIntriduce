/**
 * 集成中台官网服务端
 * - 静态服务：托管 index.html 及静态资源
 * - 邮件接口：POST /api/contact  表单提交 → 通过 163 SMTP 自动发送到 shanenservice@163.com
 *
 * 环境变量（必需）：
 *   SMTP_HOST       SMTP 服务器地址，默认 smtp.163.com
 *   SMTP_PORT       SMTP 端口，默认 465 (SSL)
 *   SMTP_USER       发件邮箱，例如 shanenservice@163.com
 *   SMTP_PASS       SMTP 授权码（注意：不是登录密码，是 163 的"客户端授权密码"）
 *   CONTACT_TO      收件邮箱，默认 shanenservice@163.com
 *   DEPLOY_RUN_PORT 服务监听端口，默认 5000
 */

const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.DEPLOY_RUN_PORT || 5000;

// 解析 JSON 请求体
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 简单速率限制（防刷）
const rateMap = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const window = 60 * 1000; // 1 分钟窗口
  const max = 5;            // 每 IP 每窗口最多 5 次
  const arr = rateMap.get(ip) || [];
  const fresh = arr.filter(t => now - t < window);
  if (fresh.length >= max) return false;
  fresh.push(now);
  rateMap.set(ip, fresh);
  return true;
}

// ========== 邮件接口 ==========
app.post('/api/contact', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!rateLimit(ip)) {
    return res.status(429).json({ success: false, error: '提交过于频繁，请稍后再试' });
  }

  const { company, email, phone, scale, message } = req.body || {};

  // 校验必填
  if (!company || !email) {
    return res.status(400).json({ success: false, error: '公司名称和邮箱为必填项' });
  }
  // 简单邮箱格式校验
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: '邮箱格式不正确' });
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.163.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const to = process.env.CONTACT_TO || 'shanenservice@163.com';

  // 如果没配置 SMTP，返回友好提示（开发阶段友好降级）
  if (!smtpUser || !smtpPass) {
    console.warn('[contact] SMTP 未配置，邮件未发送。收到的表单数据：', { company, email, phone, scale });
    return res.json({
      success: true,
      delivered: false,
      message: '表单已收到，但邮件服务暂未配置，请联系管理员设置 SMTP 授权码。'
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // 465 端口使用 SSL
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = `[预约演示] 集成中台 - ${company}`;
    const html = `
      <div style="font-family:-apple-system,PingFang SC,Microsoft YaHei,sans-serif;color:#1e293b;line-height:1.8;padding:24px;max-width:600px;">
        <h2 style="margin:0 0 16px;color:#0f172a;border-bottom:2px solid #3b82f6;padding-bottom:8px;">🔔 集成中台 - 新的预约演示请求</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 12px;background:#f1f5f9;width:120px;font-weight:600;">公司名称</td><td style="padding:8px 12px;">${escapeHtml(company)}</td></tr>
          <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">联系邮箱</td><td style="padding:8px 12px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">联系电话</td><td style="padding:8px 12px;">${escapeHtml(phone)}</td></tr>` : ''}
          ${scale ? `<tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">企业规模</td><td style="padding:8px 12px;">${escapeHtml(scale)}</td></tr>` : ''}
          ${message ? `<tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;vertical-align:top;">需求描述</td><td style="padding:8px 12px;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>` : ''}
        </table>
        <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
          此邮件由集成中台官网自动发送 · ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"集成中台官网" <${smtpUser}>`,
      to: to,
      replyTo: email,
      subject: subject,
      html: html,
    });

    console.log(`[contact] 邮件已发送 → ${to} (messageId: ${info.messageId})`);
    res.json({ success: true, delivered: true, message: '预约提交成功，我们的工程师会在 30 分钟内联系您' });
  } catch (err) {
    console.error('[contact] 邮件发送失败：', err.message);
    res.status(500).json({ success: false, error: '邮件发送失败，请稍后重试或直接发邮件到 ' + to });
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ========== 静态文件 ==========
app.use(express.static(__dirname, {
  index: 'index.html',
  maxAge: '1h',
}));

// SPA fallback：所有未知路径返回首页
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 集成中台官网服务已启动`);
  console.log(`   端口：${PORT}`);
  console.log(`   SMTP：${process.env.SMTP_USER ? '已配置' : '未配置（需设置 SMTP_USER / SMTP_PASS 环境变量）'}`);
  console.log(`   收件箱：${process.env.CONTACT_TO || 'shanenservice@163.com'}`);
});
