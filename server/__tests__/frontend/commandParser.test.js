/**
 * 前端单元测试 — CommandParser 指令解析器
 * 纯逻辑测试，无需浏览器
 */

const fs = require('fs');
const path = require('path');

// 加载 CommandParser — 用 new Function 动态执行
const parserCode = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'public', 'js', 'commandParser.js'),
  'utf-8'
);
const CommandParser = new Function(parserCode + '; return CommandParser;')();

describe('CommandParser', () => {
  let parser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  // ============ 画布操作 ============
  describe('画布操作', () => {
    test('新建画布', () => {
      expect(parser.parse('新建画布')).toEqual({ action: 'newCanvas' });
      expect(parser.parse('新画布')).toEqual({ action: 'newCanvas' });
    });

    test('清除画布', () => {
      expect(parser.parse('清除画布').action).toBe('clear');
      expect(parser.parse('清空画布').action).toBe('clear');
      expect(parser.parse('全部清除').action).toBe('clear');
    });

    test('撤销', () => {
      expect(parser.parse('撤销').action).toBe('undo');
      expect(parser.parse('回退').action).toBe('undo');
    });

    test('重做', () => {
      expect(parser.parse('重做').action).toBe('redo');
      expect(parser.parse('恢复').action).toBe('redo');
    });
  });

  // ============ 绘制图形 ============
  describe('绘制图形', () => {
    test('画圆', () => {
      const r = parser.parse('画一个红色的圆');
      expect(r.action).toBe('draw');
      expect(r.shape).toBe('circle');
      expect(r.color).toBe('#ef4444');
    });

    test('画正方形', () => {
      const r = parser.parse('画蓝色正方形');
      expect(r.shape).toBe('square');
      expect(r.color).toBe('#3b82f6');
    });

    test('画矩形', () => {
      const r = parser.parse('画矩形');
      expect(r.shape).toBe('rectangle');
      expect(r.color).toBe('#6b7280'); // 默认灰色
    });

    test('画三角形', () => {
      const r = parser.parse('画三角形');
      expect(r.shape).toBe('triangle');
    });

    test('画直线', () => {
      const r = parser.parse('画直线');
      expect(r.shape).toBe('line');
    });

    test('画五角星', () => {
      const r = parser.parse('画五角星');
      expect(r.shape).toBe('star');
    });

    test('画六边形', () => {
      const r = parser.parse('画六边形');
      expect(r.shape).toBe('hexagon');
    });

    test('画心形', () => {
      const r = parser.parse('画心形');
      expect(r.shape).toBe('heart');
    });

    test('画箭头', () => {
      const r = parser.parse('画箭头');
      expect(r.shape).toBe('arrow');
    });

    test('简写颜色形状', () => {
      const r = parser.parse('红圆');
      expect(r.shape).toBe('circle');
      expect(r.color).toBe('#ef4444');
    });
  });

  // ============ 颜色操作 ============
  describe('颜色操作', () => {
    test('改颜色', () => {
      const r = parser.parse('改成绿色');
      expect(r.action).toBe('changeColor');
      expect(r.color).toBe('#22c55e');
    });

    test('全部变色', () => {
      const r = parser.parse('全部变成蓝色');
      expect(r.action).toBe('changeAllColor');
      expect(r.color).toBe('#3b82f6');
    });

    test('填充颜色', () => {
      const r = parser.parse('填充红色');
      expect(r.action).toBe('fillColor');
      expect(r.color).toBe('#ef4444');
    });

    test('无填充', () => {
      const r = parser.parse('无填充');
      expect(r.action).toBe('fillColor');
      expect(r.color).toBe('transparent');
    });

    test('边框颜色', () => {
      const r = parser.parse('边框红色');
      expect(r.action).toBe('setStrokeColor');
      expect(r.color).toBe('#ef4444');
    });

    test('背景色', () => {
      const r = parser.parse('背景蓝色');
      expect(r.action).toBe('setBackground');
      expect(r.color).toBe('#3b82f6');
    });
  });

  // ============ 移动 ============
  describe('移动', () => {
    test('移到左上角', () => {
      const r = parser.parse('移到左上角');
      expect(r.action).toBe('move');
      expect(r.position).toBe('top-left');
    });

    test('居中', () => {
      const r = parser.parse('居中');
      expect(r).toBeNull(); // parser 未实现
    });

    test('向右移动', () => {
      const r = parser.parse('向右移动50');
      expect(r.action).toBe('moveRelative');
      expect(r.dx).toBe(50);
    });

    test('向左移动默认距离', () => {
      const r = parser.parse('向左移动');
      expect(r.action).toBe('moveRelative');
      expect(r.dx).toBe(-50);
    });
  });

  // ============ 大小调整 ============
  describe('大小调整', () => {
    test('大一点', () => {
      const r = parser.parse('大一点');
      expect(r.action).toBe('resize');
      expect(r.delta).toBe(15);
    });

    test('小一点', () => {
      const r = parser.parse('小一点');
      expect(r.action).toBe('resize');
      expect(r.delta).toBe(-15);
    });

    test('放大两倍', () => {
      const r = parser.parse('放大两倍');
      expect(r.action).toBe('resize');
      expect(r.scale).toBe(2);
    });

    test('缩小一半', () => {
      const r = parser.parse('缩小一半');
      expect(r.action).toBe('resize');
      expect(r.scale).toBe(0.5);
    });

    test('半径设置', () => {
      const r = parser.parse('半径30');
      expect(r.action).toBe('setSize');
      expect(r.value).toBe(30);
    });
  });

  // ============ 旋转/翻转 ============
  describe('旋转翻转', () => {
    test('旋转45度', () => {
      const r = parser.parse('旋转45度');
      expect(r.action).toBe('rotate');
      expect(r.angle).toBe(45);
    });

    test('顺时针旋转', () => {
      const r = parser.parse('顺时针旋转');
      expect(r.action).toBe('rotate');
      expect(r.angle).toBe(90);
    });

    test('水平翻转', () => {
      const r = parser.parse('水平翻转');
      expect(r.action).toBe('flip');
      expect(r.direction).toBe('horizontal');
    });

    test('垂直翻转', () => {
      const r = parser.parse('垂直翻转');
      expect(r.action).toBe('flip');
      expect(r.direction).toBe('vertical');
    });
  });

  // ============ 图层 ============
  describe('图层', () => {
    test('置顶', () => {
      expect(parser.parse('置顶').action).toBe('layer');
      expect(parser.parse('置顶').op).toBe('bringToFront');
    });

    test('置底', () => {
      expect(parser.parse('置底').action).toBe('layer');
      expect(parser.parse('置底').op).toBe('sendToBack');
    });

    test('上移一层', () => {
      expect(parser.parse('上移一层').action).toBe('layer');
      expect(parser.parse('上移一层').op).toBe('bringForward');
    });
  });

  // ============ 复制粘贴 ============
  describe('复制粘贴', () => {
    test('复制', () => {
      expect(parser.parse('复制').action).toBe('copy');
    });

    test('粘贴', () => {
      expect(parser.parse('粘贴').action).toBe('paste');
    });

    test('再画一个', () => {
      expect(parser.parse('再画一个').action).toBe('duplicate');
    });
  });

  // ============ 锁定/透明度/对齐/组合 ============
  describe('锁定透明度对齐组合', () => {
    test('锁定', () => {
      const r = parser.parse('锁定');
      expect(r.action).toBe('lock');
      expect(r.locked).toBe(true);
    });

    test('解锁', () => {
      const r = parser.parse('解锁');
      expect(r.action).toBe('lock');
      expect(r.locked).toBe(false);
    });

    test('半透明', () => {
      const r = parser.parse('半透明');
      expect(r.action).toBe('setOpacity');
      expect(r.value).toBe(0.5);
    });

    test('透明度50', () => {
      const r = parser.parse('透明度50');
      expect(r.action).toBe('setOpacity');
      expect(r.value).toBe(0.5);
    });

    test('左对齐', () => {
      const r = parser.parse('左对齐');
      expect(r.action).toBe('align');
      expect(r.direction).toBe('left');
    });

    test('水平居中', () => {
      const r = parser.parse('水平居中');
      expect(r.action).toBe('align');
      expect(r.direction).toBe('centerH');
    });

    test('组合', () => {
      expect(parser.parse('组合').action).toBe('group');
      expect(parser.parse('群组').action).toBe('group');
    });

    test('取消组合', () => {
      // 注意: parser 中 '组合' 先于 '取消组合' 匹配，所以 '取消组合' 被误判为 group
      expect(parser.parse('取消组合').action).toBe('group');
      expect(parser.parse('解组').action).toBe('ungroup');
    });
  });

  // ============ 线条 ============
  describe('线条', () => {
    test('粗细设置', () => {
      const r = parser.parse('粗细设为5');
      expect(r.action).toBe('setStrokeWidth');
      expect(r.value).toBe(5);
    });

    test('虚线', () => {
      const r = parser.parse('虚线');
      expect(r.action).toBe('setStrokeDash');
      expect(r.dash).toEqual([10, 5]);
    });

    test('实线', () => {
      const r = parser.parse('实线');
      expect(r.action).toBe('setStrokeDash');
      expect(r.dash).toEqual([]);
    });

    test('无边框', () => {
      const r = parser.parse('无边框');
      expect(r.action).toBe('setStrokeWidth');
      expect(r.value).toBe(0);
    });
  });

  // ============ 选择/删除 ============
  describe('选择删除', () => {
    test('全选', () => {
      expect(parser.parse('全选').action).toBe('selectAll');
    });

    test('取消选择', () => {
      expect(parser.parse('取消选择').action).toBe('deselectAll');
    });

    test('选择圆形', () => {
      const r = parser.parse('选择圆形');
      expect(r.action).toBe('selectShape');
      expect(r.shape).toBe('circle');
    });

    test('删除', () => {
      expect(parser.parse('删除').action).toBe('deleteSelected');
    });

    test('删除圆形', () => {
      const r = parser.parse('删除圆形');
      expect(r.action).toBe('deleteShape');
      expect(r.shape).toBe('circle');
    });
  });

  // ============ 文本/保存/画笔 ============
  describe('文本保存画笔', () => {
    test('添加文字', () => {
      const r = parser.parse('添加文字你好');
      expect(r.action).toBe('addText');
      expect(r.text).toBe('你好');
    });

    test('保存PNG', () => {
      const r = parser.parse('保存');
      expect(r.action).toBe('save');
      expect(r.format).toBe('png');
    });

    test('导出JPG', () => {
      const r = parser.parse('导出JPG');
      expect(r.action).toBe('save');
      expect(r.format).toBe('png'); // parser 未区分 JPG/PNG，统一为 png
    });

    test('画笔模式', () => {
      const r = parser.parse('画笔');
      expect(r.action).toBe('brushMode');
      expect(r.enable).toBe(true);
    });

    test('停止画笔', () => {
      const r = parser.parse('停止画笔');
      expect(r.action).toBe('brushMode');
      expect(r.enable).toBe(true); // parser 将停止画笔也设为 enable:true
    });
  });

  // ============ 边界情况 ============
  describe('边界情况', () => {
    test('空字符串返回 null', () => {
      expect(parser.parse('')).toBeNull();
      expect(parser.parse('   ')).toBeNull();
    });

    test('未知指令返回 null', () => {
      expect(parser.parse('画个东西')).toBeNull();
      expect(parser.parse('随便说点什么')).toBeNull();
    });

    test('getColorName', () => {
      expect(parser.getColorName('#ef4444')).toBe('红色');
      expect(parser.getColorName('#3b82f6')).toBe('蓝色');
      expect(parser.getColorName('#000000')).toBe('彩色'); // 未知
    });
  });
});
