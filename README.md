# VoiceDraw — AI 语音绘图工具

> 🎤 纯语音控制的绘图工具。全程零键盘零鼠标，说句话就能画。

**Demo 视频**: [B站观看](https://www.bilibili.com/video/BV1PyJH6HEa7/)

**设计文档**: [DESIGN.md](DESIGN.md) — 含用户故事、架构选型、成本策略

**检测报告**: [TEST_REPORT.md](TEST_REPORT.md) — 含 74 项检测结果、修改记录

## ⚠️ 重要：浏览器要求

**本项目必须使用 Microsoft Edge 浏览器打开，否则语音识别功能无法使用！**

原因：Web Speech API 在国内环境下，Chrome 浏览器走的是 Google 服务器（被墙），无法进行语音识别。Edge 浏览器走的是微软 Azure 语音服务，国内直连可用。

- ✅ **推荐：Microsoft Edge**（语音识别正常）
- ❌ **不可用：Chrome / Firefox / 360 等**（语音识别被墙）

## ⚠️ 已知问题

**语音识别准确率受限：** 语音识别模型训练难度大、训练数据不足，目前仅能稳定识别清晰发音的标准中文指令。设备录音质量差异也会影响识别效果。复杂自然语言指令的语义理解仍在优化中。

## ✨ 功能

| 类别 | 支持指令 |
|------|----------|
| 画布 | 新建画布、清空画布、撤销、重做、背景色 |
| 绘制 | 圆、正方形、矩形、三角形、直线、五角星、六边形、箭头、心形 |
| 画笔 | 自由画笔模式（语音开启，鼠标/触摸绘制） |
| 颜色 | 12种颜色，支持变色/全部变色/填充/边框色 |
| 大小 | 大一点、小一点、放大两倍、缩小一半、半径设为X |
| 位置 | 移到左上/右上/左下/右下/中间，向左/右/上/下移动 |
| 旋转 | 旋转N度、顺时针/逆时针旋转 |
| 翻转 | 水平翻转、垂直翻转 |
| 图层 | 置顶、置底、上移一层、下移一层 |
| 复制 | 复制、粘贴、再画一个 |
| 锁定 | 锁定、解锁 |
| 透明度 | 半透明、透明度N |
| 对齐 | 左对齐、右对齐、水平居中、垂直居中、顶部/底部对齐 |
| 组合 | 组合/群组、取消组合/解组 |
| 线条 | 粗细设为X、虚线、实线、无边框 |
| 填充 | 填充红色、无填充 |
| 文本 | 添加文字"XXX" |
| 选择 | 选择圆形、全选、取消选择 |
| 删除 | 删除、删除圆形 |
| 保存 | 保存PNG、导出JPG |
| 下载 | 画布下方 ⬇ PNG / ⬇ SVG 一键导出 |
| 自然语言 | 关键词精准匹配 + 空间关系预处理 + 云端 NLP 兜底 |

## 🏗 架构

```
浏览器 (Edge 推荐)
├── Web Speech API → 浏览器内置语音识别（优先，Edge 可用）
├── MediaRecorder → 录音（云端兜底时启用）
├── CommandParser → 本地规则匹配（<1ms，关键词 + 空间关系预处理）
├── 智谱 GLM-4-Flash → 云端 NLP 语义兜底
├── Fabric.js → Canvas 绘图引擎
└── Web Speech API → TTS 语音反馈
```

后端 Express 服务提供 `/api/asr`（语音转文字）和 `/api/nlp`（语义理解）路由。

**指令解析策略：** 本地规则优先（<1ms，关键词精准匹配 + 空间关系预处理），未命中时走云端 NLP（智谱 GLM-4-Flash），闲聊话自动忽略。

## 🚀 快速开始

```bash
cd server
cp .env.example .env   # 编辑填入智谱 API Key
npm install
npm start
# 用 Edge 打开 http://localhost:3000
```

或直接运行：

```bash
start.bat    # Windows
./start.sh   # macOS / Linux
```

## 🧪 单元测试

```bash
cd server
npm test
```

覆盖范围：
- **后端** — API 路由、静态文件、ASR Service（10 tests）
- **前端** — CommandParser 指令解析器全覆盖（64 tests）

## 🎮 使用方式

1. 用 **Edge 浏览器** 打开 http://localhost:3000
2. 点击 🎤 按钮开始聆听
3. 说清晰的标准中文指令（如"画一个红色的圆"）
4. 系统自动识别、执行、语音反馈
5. 点击画布下方 ⬇ PNG / ⬇ SVG 下载作品

## 📋 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 语音识别 | Web Speech API（优先）/ 智谱 ASR（兜底） | Edge 可用，国内直连 |
| 语音合成 | Web Speech API | 免费、中文自然 |
| 绘图引擎 | Fabric.js 5.x | Canvas 封装完善 |
| 指令解析 | 规则匹配 + 空间关系预处理 + 智谱 NLP 兜底 | 本地 <1ms + 云端语义理解 |
| 后端 | Express | 静态文件 + ASR/NLP 代理 |
| 测试 | Jest | 前后端全覆盖 |

## 📁 目录结构

```
VoiceDraw/
├── public/
│   ├── index.html          # 主页面
│   ├── css/style.css       # 直角极简纯白 UI
│   └── js/
│       ├── commandParser.js # 指令解析器
│       ├── drawingEngine.js # Fabric.js 绘图引擎
│       ├── voiceController.js # 语音识别与合成
│       └── app.js           # 主控制器
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js       # Express 服务 + /api/asr + /api/nlp
│   │   ├── asrService.js   # 智谱 ASR 转写
│   │   ├── nlpService.js   # 智谱 GLM-4-Flash 语义理解
│   │   └── ...
│   └── __tests__/
│       ├── server.test.js           # 后端测试
│       └── frontend/
│           └── commandParser.test.js # 前端测试
├── start.bat / start.sh    # 一键启动
├── README.md
├── DESIGN.md
└── TEST_REPORT.md
```

## 📄 许可

MIT
