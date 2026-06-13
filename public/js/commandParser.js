/**
 * CommandParser — 语音指令解析器
 * 本地规则匹配，极速响应
 */
class CommandParser {
  constructor() {
    this.shapes = {
      '圆': 'circle', '圆形': 'circle',
      '正方形': 'square', '方形': 'square', '方块': 'square',
      '矩形': 'rectangle', '长方形': 'rectangle',
      '三角形': 'triangle', '三角': 'triangle',
      '直线': 'line', '线': 'line',
      '五角星': 'star', '星形': 'star',
      '六边形': 'hexagon',
      '箭头': 'arrow', '心形': 'heart',
    };

    this.colors = {
      '红色': '#ef4444', '红': '#ef4444',
      '绿色': '#22c55e', '绿': '#22c55e',
      '蓝色': '#3b82f6', '蓝': '#3b82f6',
      '黄色': '#eab308', '黄': '#eab308',
      '紫色': '#a855f7', '紫': '#a855f7',
      '橙色': '#f97316', '橙': '#f97316',
      '粉色': '#ec4899', '粉': '#ec4899',
      '黑色': '#111111', '黑': '#111111',
      '白色': '#ffffff', '白': '#ffffff',
      '灰色': '#6b7280', '灰': '#6b7280',
      '青色': '#06b6d4', '青': '#06b6d4',
      '棕色': '#92400e', '棕': '#92400e',
    };

    this.positions = {
      '左上角': 'top-left', '左上': 'top-left',
      '右上角': 'top-right', '右上': 'top-right',
      '左下角': 'bottom-left', '左下': 'bottom-left',
      '右下角': 'bottom-right', '右下': 'bottom-right',
      '中间': 'center', '居中': 'center', '中央': 'center',
      '左边': 'left', '右边': 'right',
      '上边': 'top', '下边': 'bottom',
    };

    this.colorNamesReverse = {};
    for (const [name, hex] of Object.entries(this.colors)) {
      if (name.length > 1) this.colorNamesReverse[hex] = name;
    }
  }

  parse(text) {
    if (!text || !text.trim()) return null;
    const t = text.trim();

    // ============ 画布操作 ============
    if (t.includes('新建画布') || t.includes('新画布')) return { action: 'newCanvas' };
    if (t.includes('清除画布') || t.includes('清空画布') || t.includes('全部清除') || t === '清除') return { action: 'clear' };
    if (t.includes('撤销') || t.includes('回退') || t.includes('返回上一步')) return { action: 'undo' };
    if (t.includes('重做') || t.includes('恢复')) return { action: 'redo' };

    // ============ 保存 ============
    if (t.includes('保存') || t.includes('导出')) {
      const fmt = t.includes('jpg') || t.includes('jpeg') ? 'jpg' : 'png';
      return { action: 'save', format: fmt };
    }

    // ============ 画笔模式 ============
    if (t.includes('画笔') || t.includes('自由绘制') || t.includes('自由画') || t.includes('开始画') || t.includes('铅笔')) {
      return { action: 'brushMode', enable: true };
    }
    if (t.includes('停止画笔') || t.includes('结束画笔') || t.includes('退出画笔') || t.includes('停止绘制')) {
      return { action: 'brushMode', enable: false };
    }

    // ============ 旋转 ============
    const rotMatch = t.match(/旋转\s*(\d+)/);
    if (rotMatch) return { action: 'rotate', angle: parseInt(rotMatch[1]) };
    if (t.includes('顺时针旋转') || t.includes('向右旋转')) return { action: 'rotate', angle: 90 };
    if (t.includes('逆时针旋转') || t.includes('向左旋转')) return { action: 'rotate', angle: -90 };

    // ============ 翻转 ============
    if (t.includes('水平翻转') || t.includes('左右翻转') || t.includes('镜像翻转')) return { action: 'flip', direction: 'horizontal' };
    if (t.includes('垂直翻转') || t.includes('上下翻转')) return { action: 'flip', direction: 'vertical' };

    // ============ 图层 ============
    if (t.includes('置顶') || t.includes('移到最上面') || t.includes('放到最上面')) return { action: 'layer', op: 'bringToFront' };
    if (t.includes('置底') || t.includes('移到最下面') || t.includes('放到最下面')) return { action: 'layer', op: 'sendToBack' };
    if (t.includes('上移一层') || t.includes('向上一层') || t.includes('往上移一层')) return { action: 'layer', op: 'bringForward' };
    if (t.includes('下移一层') || t.includes('向下一层') || t.includes('往下移一层')) return { action: 'layer', op: 'sendBackwards' };

    // ============ 复制粘贴 ============
    if (t === '复制' || t === '拷贝') return { action: 'copy' };
    if (t === '粘贴') return { action: 'paste' };
    if (t.includes('再画一个') || t.includes('再来一个') || t.includes('复制一个')) return { action: 'duplicate' };

    // ============ 锁定 ============
    if (t.includes('锁定')) return { action: 'lock', locked: true };
    if (t.includes('解锁')) return { action: 'lock', locked: false };

    // ============ 透明度 ============
    const opacityMatch = t.match(/透明度\s*(\d+)/);
    if (opacityMatch) return { action: 'setOpacity', value: parseInt(opacityMatch[1]) / 100 };
    if (t.includes('半透明')) return { action: 'setOpacity', value: 0.5 };
    if (t.includes('不透明')) return { action: 'setOpacity', value: 1 };

    // ============ 对齐 ============
    if (t.includes('左对齐')) return { action: 'align', direction: 'left' };
    if (t.includes('右对齐')) return { action: 'align', direction: 'right' };
    if (t.includes('水平居中') || t.includes('横向居中')) return { action: 'align', direction: 'centerH' };
    if (t.includes('垂直居中') || t.includes('纵向居中')) return { action: 'align', direction: 'centerV' };
    if (t.includes('顶部对齐') || t.includes('上对齐')) return { action: 'align', direction: 'top' };
    if (t.includes('底部对齐') || t.includes('下对齐')) return { action: 'align', direction: 'bottom' };

    // ============ 背景色 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('背景' + name) || t.includes('背景改成' + name) || t.includes('背景变成' + name) || t.includes('画布' + name)) {
        return { action: 'setBackground', color: hex, colorName: name };
      }
    }
    if (t.includes('白色背景') || t.includes('背景白色')) return { action: 'setBackground', color: '#ffffff', colorName: '白色' };

    // ============ 全部颜色 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('全部' + name) || t.includes('全部变成' + name) || t.includes('全部改成' + name)) {
        return { action: 'changeAllColor', color: hex, colorName: name };
      }
      if (t.match(new RegExp(`所有.*${name}`))) return { action: 'changeAllColor', color: hex, colorName: name };
    }

    // ============ 删除 ============
    if (t.includes('删除') || t.includes('移除')) {
      for (const [name, shape] of Object.entries(this.shapes)) {
        if (t.includes('删除' + name) || t.includes('移除' + name)) return { action: 'deleteShape', shape: shape };
      }
      return { action: 'deleteSelected' };
    }

    // ============ 选择 ============
    if (t.includes('全选') || t.includes('选择所有') || t.includes('选择全部')) return { action: 'selectAll' };
    if (t.includes('取消选择') || t.includes('取消选中')) return { action: 'deselectAll' };
    for (const [name, shape] of Object.entries(this.shapes)) {
      if (t.includes('选择' + name)) return { action: 'selectShape', shape: shape };
    }

    // ============ 移动 ============
    for (const [name, pos] of Object.entries(this.positions)) {
      if (t.includes('移到' + name) || t.includes('移动到' + name)) return { action: 'move', position: pos };
    }
    const moveMatch = t.match(/(向[左右上下])移(?:动)?(\d+)?/);
    if (moveMatch) {
      const dir = moveMatch[1];
      const dist = parseInt(moveMatch[2]) || 50;
      const dm = { '向左': { dx: -dist, dy: 0 }, '向右': { dx: dist, dy: 0 }, '向上': { dx: 0, dy: -dist }, '向下': { dx: 0, dy: dist } };
      return { action: 'moveRelative', ...dm[dir] };
    }

    // ============ 大小调整 ============
    const radiusMatch = t.match(/半径(\d+)/);
    if (radiusMatch) return { action: 'setSize', value: parseInt(radiusMatch[1]), type: 'radius' };
    if (t.includes('放大两倍') || t.includes('放大一倍') || t.includes('大一倍')) return { action: 'resize', scale: 2 };
    if (t.includes('缩小一半') || t.includes('小一半')) return { action: 'resize', scale: 0.5 };
    if (t.includes('大一点') || t.includes('放大一点') || t.includes('变大')) return { action: 'resize', delta: 15 };
    if (t.includes('小一点') || t.includes('缩小一点') || t.includes('变小')) return { action: 'resize', delta: -15 };

    // ============ 边框 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('边框' + name) || t.includes('描边' + name)) return { action: 'setStrokeColor', color: hex, colorName: name };
    }
    const strokeMatch = t.match(/(?:粗细|线宽|线条|边框宽度|描边宽度).*?(\d+)/);
    if (strokeMatch) return { action: 'setStrokeWidth', value: parseInt(strokeMatch[1]) };
    if (t.includes('虚线')) return { action: 'setStrokeDash', dash: [10, 5] };
    if (t.includes('实线')) return { action: 'setStrokeDash', dash: [] };
    if (t.includes('无边框') || t.includes('去掉边框') || t.includes('取消边框')) return { action: 'setStrokeWidth', value: 0 };

    // ============ 填充 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('填充' + name)) return { action: 'fillColor', color: hex, colorName: name };
    }
    if (t.includes('无填充') || t.includes('取消填充') || t.includes('去掉填充')) return { action: 'fillColor', color: 'transparent' };

    // ============ 绘制图形 ============
    // 空间关系短语预处理："在X里面画Y" → "画Y"
    let drawText = t;
    const spatialMatch = t.match(/(?:在|于).*(?:里面|上面|旁边|中间|内部|之上|之下).*(?:画|添加|新建|创建|覆盖|放)(.+)/);
    if (spatialMatch) {
      drawText = '画' + spatialMatch[1];
    }
    // "覆盖X" → "画X"
    if (t.includes('覆盖') && !drawText.includes('画')) {
      const coverMatch = t.match(/覆盖(.+)/);
      if (coverMatch) drawText = '画' + coverMatch[1];
    }

    // 先检查是否有绘制意图
    const hasDrawIntent = drawText.includes('画') || drawText.includes('添加') || drawText.includes('新建') || drawText.includes('创建');
    if (hasDrawIntent) {
      // 按关键词长度降序匹配
      const sortedShapes = Object.entries(this.shapes).sort((a, b) => b[0].length - a[0].length);
      for (const [keyword, shape] of sortedShapes) {
        if (drawText.includes(keyword)) {
          return this._parseDrawCommand(drawText, shape);
        }
      }
    }
    // 颜色+形状简写（如"红圆""蓝方块"），不需要"画"字
    for (const [cname, chex] of Object.entries(this.colors)) {
      for (const [sname, sshape] of Object.entries(this.shapes)) {
        if (t.includes(cname + sname) || t === cname + sname) return { action: 'draw', shape: sshape, color: chex, colorName: cname };
      }
    }

    // ============ 颜色修改 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('改成' + name) || t.includes('变成' + name) || t.includes('换成' + name)) return { action: 'changeColor', color: hex, colorName: name };
      if (t.includes('颜色' + name) || t.includes('涂' + name)) return { action: 'changeColor', color: hex, colorName: name };
    }

    // ============ 文本 ============
    const textMatch = t.match(/(?:添加文字|写字|文字|文本)['"'"'""]?(.+?)['"'"'""]?$/);
    if (textMatch) return { action: 'addText', text: textMatch[1] };

    // ============ 组合/取消组合 ============
    if (t.includes('组合') || t.includes('群组') || t.includes('编组')) return { action: 'group' };
    if (t.includes('取消组合') || t.includes('取消群组') || t.includes('解组') || t.includes('解散')) return { action: 'ungroup' };

    return null;
  }

  _parseDrawCommand(text, shape) {
    const cmd = { action: 'draw', shape: shape };
    for (const [name, hex] of Object.entries(this.colors)) {
      if (text.includes(name)) { cmd.color = hex; cmd.colorName = name; break; }
    }
    if (!cmd.color) cmd.color = '#6b7280';
    const sizeMatch = text.match(/(\d+)\s*(?:像素|px|大小|尺寸)?/);
    if (sizeMatch) cmd.size = parseInt(sizeMatch[1]);
    return cmd;
  }

  getColorName(hex) {
    return this.colorNamesReverse[hex] || '彩色';
  }
}
