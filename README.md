# VoiceDraw — AI 语音绘图工具

> 🎤 纯语音控制的绘图工具。全程零键盘零鼠标，说句话就能画。

## ✨ 功能

| 类别 | 支持指令 |
|------|----------|
| 画布 | 新建画布、清空画布、撤销、重做 |
| 绘制 | 画圆、正方形、矩形、三角形、直线、五角星、六边形 |
| 颜色 | 红/绿/蓝/黄/紫/橙/粉/黑/白/灰/青/棕，支持全部变色 |
| 大小 | 大一点、小一点、放大两倍、缩小一半、半径设为X |
| 位置 | 移到左上/右上/左下/右下/中间，向左/右/上/下移动 |
| 线条 | 粗细设为X、虚线、实线 |
| 填充 | 填充红色、无填充 |
| 文本 | 添加文字"XXX" |
| 选择 | 选择圆形、全选、取消选择 |
| 删除 | 删除、删除圆形 |
| 保存 | 保存PNG、导出JPG |

## 🏗 架构

```
浏览器 (Chrome)
├── Web Speech API → 语音识别（中文）
├── CommandParser → 本地规则匹配（<1ms）
├── Fabric.js → Canvas 绘图引擎
└── Web Speech API → TTS 语音反馈
```

**零后端依赖，纯前端运行。**

## 🚀 快速开始

```bash
cd server
npm install
npm start
# 打开 http://localhost:3000
```

或直接运行：

```bash
start.bat    # Windows
./start.sh   # macOS / Linux
```

## 🎮 使用方式

1. 点击 🎤 按钮开始聆听
2. 说出绘图指令（如"画一个红色的圆"）
3. 系统自动识别、执行、语音反馈

## 📋 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 语音识别 | Web Speech API | 免费、低延迟（200-500ms） |
| 语音合成 | Web Speech API | 免费、中文自然 |
| 绘图引擎 | Fabric.js 5.x | Canvas 封装完善 |
| 指令解析 | 规则匹配 | 本地极速（<1ms） |
| 后端 | Express | 静态文件服务 |

## 💰 成本

**完全免费。** 不调用任何付费 API，所有计算在浏览器本地完成。

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
│   └── src/server.js       # Express 静态服务
├── start.bat / start.sh    # 一键启动
└── README.md
```

## 📄 许可

MIT
