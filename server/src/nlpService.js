/**
 * nlpService — 智谱 GLM 语义理解
 * 将任意自然语言转为 VoiceDraw 结构化指令
 */
const https = require('https');

const API_KEY = process.env.ZHIPU_API_KEY || '888312a4a9294843ad4656a3ca9932d5.CLzzZsBCDL2Lvcab';
const BASE_URL = 'open.bigmodel.cn';
const agent = new https.Agent({ keepAlive: false });

const SYSTEM_PROMPT = `你是一个语音绘图指令解析器。将用户的任意自然语言转换为 JSON 指令。

## 可用指令格式

画布操作:
- {"action":"newCanvas"}  新建画布
- {"action":"clear"}  清空画布
- {"action":"undo"}  撤销
- {"action":"redo"}  重做
- {"action":"setBackground","color":"#颜色","colorName":"颜色名"}  设置背景色

绘制图形:
- {"action":"draw","shape":"形状","color":"#颜色","colorName":"颜色名","size":数字}
  形状: circle(圆), square(正方形), rectangle(矩形), triangle(三角形), line(直线), star(五角星), hexagon(六边形), arrow(箭头), heart(心形)

画笔:
- {"action":"brushMode","enable":true/false}  开启/关闭自由画笔

颜色操作:
- {"action":"changeColor","color":"#颜色","colorName":"颜色名"}  修改选中图形颜色
- {"action":"changeAllColor","color":"#颜色","colorName":"颜色名"}  修改所有图形颜色
- {"action":"fillColor","color":"#颜色","colorName":"颜色名"}  填充颜色
- {"action":"fillColor","color":"transparent"}  无填充
- {"action":"setStrokeColor","color":"#颜色","colorName":"颜色名"}  设置边框颜色

移动:
- {"action":"move","position":"位置"}  位置: top-left, top-right, bottom-left, bottom-right, center
- {"action":"moveRelative","dx":数字,"dy":数字}  相对移动

大小:
- {"action":"resize","delta":数字}  正数放大，负数缩小
- {"action":"resize","scale":数字}  倍数缩放
- {"action":"setSize","value":数字,"type":"radius"}  设置半径

旋转翻转:
- {"action":"rotate","angle":数字}  旋转角度
- {"action":"flip","direction":"horizontal/vertical"}  翻转

图层:
- {"action":"layer","op":"bringToFront/sendToBack/bringForward/sendBackwards"}  图层操作

复制粘贴:
- {"action":"copy"}  复制
- {"action":"paste"}  粘贴
- {"action":"duplicate"}  再画一个

锁定透明度:
- {"action":"lock","locked":true/false}  锁定/解锁
- {"action":"setOpacity","value":0-1的数字}  透明度

对齐:
- {"action":"align","direction":"left/right/centerH/centerV/top/bottom"}  对齐

组合:
- {"action":"group"}  组合
- {"action":"ungroup"}  取消组合

线条:
- {"action":"setStrokeWidth","value":数字}  线宽，0=无边框
- {"action":"setStrokeDash","dash":[10,5]}  虚线
- {"action":"setStrokeDash","dash":[]}  实线

选择删除:
- {"action":"selectAll"}  全选
- {"action":"deselectAll"}  取消选择
- {"action":"selectShape","shape":"形状"}  按形状选择
- {"action":"deleteSelected"}  删除选中
- {"action":"deleteShape","shape":"形状"}  按形状删除

文本:
- {"action":"addText","text":"文字内容"}  添加文字

保存:
- {"action":"save","format":"png/jpg"}  保存导出

颜色列表(HEX):
红色:#ef4444 绿色:#22c55e 蓝色:#3b82f6 黄色:#eab308 紫色:#a855f7
橙色:#f97316 粉色:#ec4899 黑色:#111111 白色:#ffffff 灰色:#6b7280
青色:#06b6d4 棕色:#92400e

## 规则
1. 只输出 JSON，不要任何解释
2. 如果用户说的不是绘图指令，返回 {"action":"unknown"}
3. 如果用户说"画个太阳"，理解为画黄色的圆
4. 如果用户说"来个蓝色的方块"，理解为画蓝色正方形
5. 根据语义合理推断参数，没有明确颜色时默认灰色 #6b7280
6. 大小默认为 80
7. **重要**：如果用户说"在X的里面/上面/旁边画Y"，理解为画Y。忽略空间修饰，只提取核心绘图指令。
8. **重要**：如果用户说"覆盖""替换""改成"，理解为修改颜色或重新绘制。
9. 如果用户说"在红色圆的里面覆盖蓝色正方形"，理解为 {"action":"draw","shape":"square","color":"#3b82f6","colorName":"蓝色"}`;

async function parseNaturalLanguage(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      max_tokens: 200,
      temperature: 0,
      stream: false
    });

    const req = https.request({
      hostname: BASE_URL,
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      agent,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.socket) res.socket.destroy();
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.message?.content || '{"action":"unknown"}';
          // 提取 JSON（可能被 markdown 包裹）
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const cmd = jsonMatch ? JSON.parse(jsonMatch[0]) : { action: 'unknown' };
          resolve(cmd);
        } catch (e) {
          resolve({ action: 'unknown' });
        }
      });
      res.on('error', (e) => {
        if (res.socket) res.socket.destroy();
        resolve({ action: 'unknown' });
      });
    });

    req.on('error', (e) => {
      if (req.socket) req.socket.destroy();
      resolve({ action: 'unknown' });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ action: 'unknown' });
    });
    req.write(body);
    req.end();
  });
}

module.exports = { parseNaturalLanguage };
