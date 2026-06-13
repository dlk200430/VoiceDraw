/**
 * VoiceDraw App — 主控制器
 */
class VoiceDrawApp {
  constructor() {
    this.parser = new CommandParser();
    this.engine = new DrawingEngine(document.getElementById('drawingCanvas'));
    this.voice = new VoiceController();
    this.commandHistory = [];
    this._bindUI();
    this._bindVoice();
  }

  _bindUI() {
    const micBtn = document.getElementById('micBtn');
    micBtn.addEventListener('click', () => {
      const active = this.voice.toggle();
      micBtn.classList.toggle('active', active);
      micBtn.textContent = active ? '🔴 聆听中' : '🎤 开始聆听';
      document.getElementById('waveContainer').classList.toggle('active', active);
      document.getElementById('footerText').textContent = active ? '请说出绘图指令...' : '点击 🎤 开始语音绘图';
    });

    document.querySelectorAll('.quick-commands span').forEach(el => {
      el.addEventListener('click', () => {
        this._execute(el.textContent);
      });
    });
  }

  _bindVoice() {
    this.voice.onResult = (text) => {
      this._execute(text);
    };

    this.voice.onStatus = (state, text) => {
      const statusEl = document.getElementById('statusText');
      const hintEl = document.getElementById('statusHint');
      statusEl.className = 'status-text ' + state;

      switch (state) {
        case 'listening': statusEl.textContent = '🎤 聆听中'; hintEl.textContent = '请说出指令'; break;
        case 'recognizing': statusEl.textContent = '🔍 识别中'; hintEl.textContent = text; break;
        case 'success': statusEl.textContent = '✅ 已识别'; hintEl.textContent = text; break;
        case 'error': statusEl.textContent = '❌ 错误'; hintEl.textContent = text; break;
        default: statusEl.textContent = '就绪'; hintEl.textContent = '点击麦克风开始'; break;
      }
    };
  }

  _execute(text) {
    document.getElementById('lastCommand').textContent = text;

    const command = this.parser.parse(text);

    if (!command) {
      this._addHistory(text, '❌ 未识别');
      this.voice.speak('没听懂这个指令，请再说一遍');
      return;
    }

    let success = true;
    let feedback = '';

    switch (command.action) {
      // ===== 画布 =====
      case 'newCanvas':
        this.engine.newCanvas();
        feedback = '新建画布';
        break;
      case 'clear':
        success = this.engine.clear();
        feedback = success ? '画布已清空' : '画布已经是空的';
        break;
      case 'undo':
        success = this.engine.undo();
        feedback = success ? '已撤销' : '没有可撤销的操作';
        break;
      case 'redo':
        success = this.engine.redo();
        feedback = success ? '已重做' : '没有可重做的操作';
        break;
      case 'setBackground':
        this.engine.setBackground(command.color);
        feedback = `背景已改为${command.colorName}`;
        break;

      // ===== 绘制 =====
      case 'draw':
        this.engine.draw(command.shape, command.color, command.size);
        feedback = `画了一个${command.colorName || this.parser.getColorName(command.color)}的${this._shapeName(command.shape)}`;
        break;

      // ===== 画笔 =====
      case 'brushMode':
        success = this.engine.setBrushMode(command.enable);
        feedback = command.enable ? '画笔模式已开启，可以在画布上自由绘制' : '画笔模式已关闭';
        break;

      // ===== 颜色 =====
      case 'changeColor':
        success = this.engine.changeColor(command.color);
        feedback = success ? `颜色已改为${command.colorName}` : '请先选择一个图形';
        break;
      case 'changeAllColor':
        success = this.engine.changeAllColor(command.color);
        feedback = success ? `全部改为${command.colorName}` : '画布上没有图形';
        break;
      case 'fillColor':
        success = this.engine.fillColor(command.color);
        feedback = success ? `已填充${command.colorName || '透明'}` : '请先选择一个图形';
        break;

      // ===== 旋转 =====
      case 'rotate':
        success = this.engine.rotate(command.angle);
        feedback = success ? `已旋转${command.angle}度` : '请先选择一个图形';
        break;

      // ===== 翻转 =====
      case 'flip':
        success = this.engine.flip(command.direction);
        feedback = success ? `已${command.direction === 'horizontal' ? '水平' : '垂直'}翻转` : '请先选择一个图形';
        break;

      // ===== 图层 =====
      case 'layer':
        const layerNames = { bringToFront: '置顶', sendToBack: '置底', bringForward: '上移一层', sendBackwards: '下移一层' };
        success = this.engine.layer(command.op);
        feedback = success ? `已${layerNames[command.op]}` : '请先选择一个图形';
        break;

      // ===== 复制粘贴 =====
      case 'copy':
        success = this.engine.copy();
        feedback = success ? '已复制' : '请先选择一个图形';
        break;
      case 'paste':
        success = this.engine.paste();
        feedback = success ? '已粘贴' : '没有可粘贴的内容，请先复制';
        break;
      case 'duplicate':
        success = this.engine.duplicate();
        feedback = success ? '已复制一个' : '请先选择一个图形';
        break;

      // ===== 锁定 =====
      case 'lock':
        success = this.engine.lock(command.locked);
        feedback = success ? (command.locked ? '已锁定' : '已解锁') : '请先选择一个图形';
        break;

      // ===== 透明度 =====
      case 'setOpacity':
        success = this.engine.setOpacity(command.value);
        feedback = success ? `透明度已设为${Math.round(command.value * 100)}%` : '请先选择一个图形';
        break;

      // ===== 对齐 =====
      case 'align':
        const alignNames = { left: '左对齐', right: '右对齐', centerH: '水平居中', top: '顶部对齐', bottom: '底部对齐', centerV: '垂直居中' };
        success = this.engine.align(command.direction);
        feedback = success ? `已${alignNames[command.direction]}` : '请先选择一个图形';
        break;

      // ===== 组合 =====
      case 'group':
        success = this.engine.group();
        feedback = success ? '已组合' : '请先选择多个图形';
        break;
      case 'ungroup':
        success = this.engine.ungroup();
        feedback = success ? '已取消组合' : '请先选择一个组合';
        break;

      // ===== 移动 =====
      case 'move':
        success = this.engine.moveTo(command.position);
        feedback = success ? '已移动' : '请先选择一个图形';
        break;
      case 'moveRelative':
        success = this.engine.moveRelative(command.dx, command.dy);
        feedback = success ? '已移动' : '请先选择一个图形';
        break;

      // ===== 大小 =====
      case 'resize':
        success = this.engine.resize(command.delta, command.scale);
        feedback = success ? '已调整大小' : '请先选择一个图形';
        break;
      case 'setSize':
        success = this.engine.setSize(command.value, command.type);
        feedback = success ? `半径已设为${command.value}` : '请先选择一个圆形';
        break;

      // ===== 选择 =====
      case 'selectAll':
        success = this.engine.selectAll();
        feedback = success ? '已全选' : '画布上没有图形';
        break;
      case 'deselectAll':
        this.engine.deselectAll();
        feedback = '已取消选择';
        break;
      case 'selectShape':
        success = this.engine.selectShape(command.shape);
        feedback = success ? `已选择${this._shapeName(command.shape)}` : `没有找到${this._shapeName(command.shape)}`;
        break;

      // ===== 删除 =====
      case 'deleteSelected':
        success = this.engine.deleteSelected();
        feedback = success ? '已删除' : '请先选择一个图形';
        break;
      case 'deleteShape':
        success = this.engine.deleteShape(command.shape);
        feedback = success ? `已删除所有${this._shapeName(command.shape)}` : `没有${this._shapeName(command.shape)}`;
        break;

      // ===== 线条/边框 =====
      case 'setStrokeColor':
        success = this.engine.setStrokeColor(command.color);
        feedback = success ? `边框已改为${command.colorName}` : '请先选择一个图形';
        break;
      case 'setStrokeWidth':
        success = this.engine.setStrokeWidth(command.value);
        feedback = success ? (command.value === 0 ? '已去掉边框' : `线宽已设为${command.value}`) : '请先选择一个图形';
        break;
      case 'setStrokeDash':
        success = this.engine.setStrokeDash(command.dash);
        feedback = success ? (command.dash.length ? '已设为虚线' : '已设为实线') : '请先选择一个图形';
        break;

      // ===== 文本 =====
      case 'addText':
        this.engine.addText(command.text);
        feedback = `已添加文字"${command.text}"`;
        break;

      // ===== 保存 =====
      case 'save':
        this.engine.saveImage(command.format);
        feedback = `已保存为 ${command.format.toUpperCase()}`;
        break;

      default:
        success = false;
        feedback = '无法执行此指令';
    }

    this._addHistory(text, feedback);
    this.voice.speak(feedback);
  }

  _addHistory(cmd, result) {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' +
                 now.getMinutes().toString().padStart(2, '0') + ':' +
                 now.getSeconds().toString().padStart(2, '0');

    this.commandHistory.unshift({ cmd, result, time });
    if (this.commandHistory.length > 50) this.commandHistory.pop();

    const container = document.getElementById('commandHistory');
    container.innerHTML = this.commandHistory.slice(0, 20).map(h =>
      `<div class="history-item"><span class="cmd">${h.result}</span><span class="time">${h.time}</span></div>`
    ).join('');
  }

  _shapeName(shape) {
    const map = {
      circle: '圆', square: '正方形', rectangle: '矩形',
      triangle: '三角形', line: '直线', star: '五角星', hexagon: '六边形',
      arrow: '箭头', heart: '心形',
    };
    return map[shape] || shape;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new VoiceDrawApp();
});
