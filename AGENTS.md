# AGENTS.md

## 项目概览
集成中台 (IntegrationPlatform) 官网落地页 —— 单页纯 HTML 项目，深色科技风，展示企业级数据集成中台产品。

## 技术栈
- **模板**: native-static（原生静态）
- **样式**: Tailwind CSS (CDN 版本) + 原生 CSS
- **交互**: 原生 JavaScript（无框架、无外部动画库）
- **服务**: Python http.server（开发环境）

## 项目结构
```
.
├── index.html        # 主页面（单文件，包含所有 HTML/CSS/JS）
├── DESIGN.md         # 设计规范文档
├── AGENTS.md         # 本文件
└── .coze             # Coze CLI 配置
```

## 页面组成（从上到下）
1. **顶部导航** - 固定定位，滚动时添加磨砂玻璃背景 + 缩小内边距
2. **Hero 首屏** - 大标题 + 渐变文字 + 数据粒子背景 + 流水线示意卡片 + 浮动状态卡
3. **客户 Logo 滚动** - 无缝横向滚动的品牌名称
4. **产品演示** - 视频占位 + 控制台 UI 示意 + 4 个亮点卡片
5. **核心能力** - 6 张能力卡片（多源汇流/可视化编排/稳健调度/可观测性/数据安全/开放集成）
6. **连接器生态** - 20 个分类色块连接器卡片（分类用 CSS 变量控制颜色）
7. **工作流** - 4 步流水线图示（连接→配置→调度→观测）
8. **定价 & 套餐** - 4 档定价 + 年/月付切换 + 功能对比表
9. **应用场景** - 8 个行业场景卡片
10. **数字指标** - 4 个数字（带滚动计数动画）
11. **客户证言** - 3 条客户评价
12. **FAQ** - 5 个常见问题（平滑展开手风琴效果）
13. **CTA** - 行动召唤区 + 邮箱输入表单
14. **Footer** - 产品/资源/公司链接 + 版权
15. **回到顶部** - 右下角悬浮按钮（滚动超过一屏后出现）

## 关键 CSS 类速查
| 类名 | 作用 |
|------|------|
| `.hero-bg` | Hero 区背景渐变 + 光斑 |
| `.grid-bg` | 网格背景（径向渐变遮罩） |
| `.glass` / `.glass-strong` / `.glass-light` | 三级玻璃拟态 |
| `.grad-text` / `.grad-text-blue` | 渐变文字 |
| `.card-hover` | 卡片悬停动效（上移 + 发光 + 内阴影） |
| `.reveal` | 滚动进入动画（配合 IntersectionObserver） |
| `.pipe` | 数据管道流光动效 |
| `.connector-card` + `.conn-db/nation/...` | 连接器卡片 + 分类颜色变量 |
| `.faq-item` / `.faq-content` | FAQ 平滑展开（grid-template-rows 技巧） |
| `.stat-num` | 数字等宽显示 |

## JavaScript 功能
- `onScroll()`: 导航栏滚动效果 + 回到顶部按钮显隐
- `IntersectionObserver for .reveal`: 滚动进入动画（替代 AOS 库）
- `animateCount()`: 数字计数动画（easeOutCubic）
- 价格年/月付切换（带淡入过渡）
- FAQ 手风琴展开
- 平滑锚点跳转

## 性能优化点
- 去掉 AOS 外部动画库，用原生 IntersectionObserver 替代
- 字体使用 Google Fonts CN 域名
- 所有图标为内联 SVG，无图片请求
- 动画全部使用 transform/opacity，避免重排
- 支持 `prefers-reduced-motion` 减少动画

## 构建与运行
- **开发**: `coze dev`（自动启动 python http.server）
- **端口**: 通过 `${DEPLOY_RUN_PORT}` 环境变量读取
- **无构建步骤**: 纯静态 HTML，直接部署

## 修改指南
- 修改文案：直接在对应 section 内修改文字
- 新增 section：在已有 section 之间插入，遵循 `reveal` 类加滚动动画
- 修改颜色：修改 `<style>` 块中的 CSS 变量或 Tailwind 配置
- 新增连接器：在连接器网格中复制一个 div，调整 `.conn-xxx` 类名和文字
- 注意：全部内容在单个 HTML 文件中，分段读取编辑
