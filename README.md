# VoiceDraw — AI 语音绘图工具

> 🎤 纯语音控制的绘图工具。全程零键盘零鼠标，说句话就能画。

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

## 🏗 架构

```
浏览器 (Chrome)
├── MediaRecorder → 录音 + VAD 静音检测
├── 智谱 GLM-4V-Plus → 云端语音识别（中文）
├── CommandParser → 本地规则匹配（<1ms）
├── Fabric.js → Canvas 绘图引擎
└── Web Speech API → TTS 语音反馈
```

后端 Express 服务提供 `/api/asr` 路由，调用智谱 API 转写音频。

## 🚀 快速开始

```bash
cd server
cp .env.example .env   # 编辑填入智谱 API Key
npm install
npm start
# 打开 http://localhost:3000
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

1. 点击 🎤 按钮开始聆听
2. 说出绘图指令（如"画一个红色的圆"）
3. 系统自动识别、执行、语音反馈
4. 点击画布下方 ⬇ PNG / ⬇ SVG 下载作品

## 📋 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 语音识别 | 智谱 GLM-4V-Plus | 中文识别率高、支持音频直传 |
| 语音合成 | Web Speech API | 免费、中文自然 |
| 绘图引擎 | Fabric.js 5.x | Canvas 封装完善 |
| 指令解析 | 规则匹配 | 本地极速（<1ms） |
| 后端 | Express | 静态文件 + ASR 代理 |
| 测试 | Jest | 前后端全覆盖 |

## 💰 成本

- 智谱 GLM-4V-Plus：按 token 计费，单次识别约 ¥0.01
- 其余全部免费（浏览器本地计算）

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
│   │   ├── server.js       # Express 服务 + /api/asr
│   │   ├── asrService.js   # 智谱 GLM-4V-Plus 转写
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
