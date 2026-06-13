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
    if (t.includes('新建画布') || t.includes('新画布')) {
      return { action: 'newCanvas' };
    }
    if (t.includes('清除画布') || t.includes('清空画布') || t.includes('全部清除') || t === '清除') {
      return { action: 'clear' };
    }
    if (t.includes('撤销') || t.includes('回退') || t.includes('返回上一步')) {
      return { action: 'undo' };
    }
    if (t.includes('重做') || t.includes('恢复')) {
      return { action: 'redo' };
    }

    // ============ 保存 ============
    if (t.includes('保存') || t.includes('导出')) {
      const fmt = t.includes('jpg') || t.includes('jpeg') ? 'jpg' : 'png';
      return { action: 'save', format: fmt };
    }

    // ============ 全部颜色 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('全部' + name) || t.includes('全部变成' + name) || t.includes('全部改成' + name)) {
        return { action: 'changeAllColor', color: hex, colorName: name };
      }
      if (t.match(new RegExp(`所有.*${name}`))) {
        return { action: 'changeAllColor', color: hex, colorName: name };
      }
    }

    // ============ 删除 ============
    if (t.includes('删除') || t.includes('移除')) {
      for (const [name, shape] of Object.entries(this.shapes)) {
        if (t.includes('删除' + name) || t.includes('移除' + name)) {
          return { action: 'deleteShape', shape: shape };
        }
      }
      return { action: 'deleteSelected' };
    }

    // ============ 选择 ============
    if (t.includes('全选') || t.includes('选择所有') || t.includes('选择全部')) {
      return { action: 'selectAll' };
    }
    if (t.includes('取消选择') || t.includes('取消选中')) {
      return { action: 'deselectAll' };
    }
    for (const [name, shape] of Object.entries(this.shapes)) {
      if (t.includes('选择' + name)) {
        return { action: 'selectShape', shape: shape };
      }
    }

    // ============ 移动 ============
    for (const [name, pos] of Object.entries(this.positions)) {
      if (t.includes('移到' + name) || t.includes('移动到' + name)) {
        return { action: 'move', position: pos };
      }
    }
    // 相对移动
    const moveMatch = t.match(/(向[左右上下])移(?:动)?(\d+)?/);
    if (moveMatch) {
      const dir = moveMatch[1];
      const dist = parseInt(moveMatch[2]) || 50;
      const dirMap = { '向左': { dx: -dist, dy: 0 }, '向右': { dx: dist, dy: 0 }, '向上': { dx: 0, dy: -dist }, '向下': { dx: 0, dy: dist } };
      return { action: 'moveRelative', ...dirMap[dir] };
    }

    // ============ 大小调整 ============
    const radiusMatch = t.match(/半径(\d+)/);
    if (radiusMatch) {
      return { action: 'setSize', value: parseInt(radiusMatch[1]), type: 'radius' };
    }
    if (t.includes('放大两倍') || t.includes('放大一倍') || t.includes('大一倍')) {
      return { action: 'resize', scale: 2 };
    }
    if (t.includes('缩小一半') || t.includes('小一半')) {
      return { action: 'resize', scale: 0.5 };
    }
    if (t.includes('大一点') || t.includes('放大一点') || t.includes('变大')) {
      return { action: 'resize', delta: 15 };
    }
    if (t.includes('小一点') || t.includes('缩小一点') || t.includes('变小')) {
      return { action: 'resize', delta: -15 };
    }

    // ============ 线条粗细 ============
    const strokeMatch = t.match(/(?:粗细|线宽|线条).*?(\d+)/);
    if (strokeMatch) {
      return { action: 'setStrokeWidth', value: parseInt(strokeMatch[1]) };
    }
    if (t.includes('虚线')) return { action: 'setStrokeDash', dash: [10, 5] };
    if (t.includes('实线')) return { action: 'setStrokeDash', dash: [] };

    // ============ 填充 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('填充' + name)) {
        return { action: 'fillColor', color: hex, colorName: name };
      }
    }
    if (t.includes('无填充') || t.includes('取消填充') || t.includes('去掉填充')) {
      return { action: 'fillColor', color: 'transparent' };
    }

    // ============ 绘制图形 ============
    for (const [keyword, shape] of Object.entries(this.shapes)) {
      if (t.includes(keyword) && (t.includes('画') || t.includes('添加') || t.includes('新建') || t.includes('创建') || t.startsWith(keyword))) {
        return this._parseDrawCommand(t, shape);
      }
    }
    // 简写："红圆" "蓝方块"
    for (const [cname, chex] of Object.entries(this.colors)) {
      for (const [sname, sshape] of Object.entries(this.shapes)) {
        if (t.includes(cname + sname) || t === cname + sname) {
          return { action: 'draw', shape: sshape, color: chex, colorName: cname };
        }
      }
    }

    // ============ 颜色修改 ============
    for (const [name, hex] of Object.entries(this.colors)) {
      if (t.includes('改成' + name) || t.includes('变成' + name) || t.includes('换成' + name)) {
        return { action: 'changeColor', color: hex, colorName: name };
      }
      if (t.includes('颜色' + name) || t.includes('涂' + name)) {
        return { action: 'changeColor', color: hex, colorName: name };
      }
    }

    // ============ 文本 ============
    const textMatch = t.match(/(?:添加文字|写字|文字|文本)['"'"'""]?(.+?)['"'"'""]?$/);
    if (textMatch) {
      return { action: 'addText', text: textMatch[1] };
    }

    return null;
  }

  _parseDrawCommand(text, shape) {
    const cmd = { action: 'draw', shape: shape };

    for (const [name, hex] of Object.entries(this.colors)) {
      if (text.includes(name)) {
        cmd.color = hex;
        cmd.colorName = name;
        break;
      }
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
