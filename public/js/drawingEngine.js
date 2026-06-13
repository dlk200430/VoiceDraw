/**
 * DrawingEngine — Fabric.js 绘图引擎封装
 */
class DrawingEngine {
  constructor(canvasElement) {
    this.canvas = new fabric.Canvas(canvasElement);
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.defaultSize = 80;
    this._initCanvas();
  }

  _initCanvas() {
    const w = Math.min(window.innerWidth - 300, 900);
    const h = Math.min(window.innerHeight - 140, 600);
    this.canvas.setWidth(w);
    this.canvas.setHeight(h);
    this.canvas.setBackgroundColor('#ffffff', this.canvas.renderAll.bind(this.canvas));
    this._saveState();
  }

  _saveState() {
    // 截断后续历史（如果撤销后又操作）
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.stringify(this.canvas.toJSON()));
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
        this.canvas.renderAll();
      });
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
        this.canvas.renderAll();
      });
      return true;
    }
    return false;
  }

  _center() {
    return {
      left: (this.canvas.width - this.defaultSize) / 2,
      top: (this.canvas.height - this.defaultSize) / 2,
    };
  }

  // ============ 绘制 ============
  draw(shape, color, size) {
    const s = size || this.defaultSize;
    const pos = this._center();
    let obj;

    switch (shape) {
      case 'circle':
        obj = new fabric.Circle({ radius: s / 2, fill: color, left: pos.left, top: pos.top });
        break;
      case 'square':
        obj = new fabric.Rect({ width: s, height: s, fill: color, left: pos.left, top: pos.top });
        break;
      case 'rectangle':
        obj = new fabric.Rect({ width: s * 1.5, height: s, fill: color, left: pos.left, top: pos.top });
        break;
      case 'triangle':
        obj = new fabric.Triangle({ width: s, height: s, fill: color, left: pos.left, top: pos.top });
        break;
      case 'line':
        obj = new fabric.Line([pos.left, pos.top + s / 2, pos.left + s, pos.top + s / 2], {
          stroke: color, strokeWidth: 3,
        });
        break;
      case 'star': {
        const pts = this._starPoints(s / 2, s / 2, s / 2, s / 4, 5);
        obj = new fabric.Polygon(pts, { fill: color, left: pos.left, top: pos.top });
        break;
      }
      case 'hexagon': {
        const pts = this._polygonPoints(s / 2, s / 2, s / 2, 6);
        obj = new fabric.Polygon(pts, { fill: color, left: pos.left, top: pos.top });
        break;
      }
      default:
        return null;
    }

    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
    this._saveState();
    return obj;
  }

  _starPoints(cx, cy, outerR, innerR, points) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    return pts;
  }

  _polygonPoints(cx, cy, r, sides) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
      pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    return pts;
  }

  // ============ 画布操作 ============
  newCanvas() {
    this.canvas.clear();
    this.canvas.setBackgroundColor('#ffffff', this.canvas.renderAll.bind(this.canvas));
    this.history = [];
    this.historyIndex = -1;
    this._saveState();
  }

  clear() {
    const objects = this.canvas.getObjects();
    if (objects.length === 0) return false;
    objects.forEach(o => this.canvas.remove(o));
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 颜色 ============
  changeColor(color) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    if (obj.type === 'line') {
      obj.set('stroke', color);
    } else {
      obj.set('fill', color);
    }
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  changeAllColor(color) {
    const objects = this.canvas.getObjects();
    if (objects.length === 0) return false;
    objects.forEach(obj => {
      if (obj.type === 'line') {
        obj.set('stroke', color);
      } else if (obj.fill && obj.fill !== '#ffffff') {
        obj.set('fill', color);
      }
    });
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  fillColor(color) {
    const obj = this.canvas.getActiveObject();
    if (!obj || obj.type === 'line') return false;
    obj.set('fill', color === 'transparent' ? '' : color);
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 移动 ============
  moveTo(position) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ow = obj.width * (obj.scaleX || 1);
    const oh = obj.height * (obj.scaleY || 1);

    const positions = {
      'top-left': { left: 10, top: 10 },
      'top-right': { left: w - ow - 10, top: 10 },
      'bottom-left': { left: 10, top: h - oh - 10 },
      'bottom-right': { left: w - ow - 10, top: h - oh - 10 },
      'center': { left: (w - ow) / 2, top: (h - oh) / 2 },
      'left': { left: 10, top: obj.top },
      'right': { left: w - ow - 10, top: obj.top },
      'top': { left: obj.left, top: 10 },
      'bottom': { left: obj.left, top: h - oh - 10 },
    };

    const pos = positions[position];
    if (!pos) return false;
    obj.set(pos);
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  moveRelative(dx, dy) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set({ left: obj.left + dx, top: obj.top + dy });
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 大小 ============
  resize(delta, scale) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;

    if (delta) {
      if (obj.radius !== undefined) {
        obj.set('radius', Math.max(10, obj.radius + delta));
      } else {
        obj.set({
          width: Math.max(10, obj.width * obj.scaleX + delta),
          height: Math.max(10, obj.height * obj.scaleY + delta),
          scaleX: 1, scaleY: 1,
        });
      }
    } else if (scale) {
      obj.scale(scale);
    }

    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  setSize(value, type) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    if (type === 'radius' && obj.radius !== undefined) {
      obj.set('radius', value);
    }
    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 选择 ============
  selectAll() {
    const objects = this.canvas.getObjects();
    if (objects.length === 0) return false;
    const sel = new fabric.ActiveSelection(objects, { canvas: this.canvas });
    this.canvas.setActiveObject(sel);
    this.canvas.renderAll();
    return true;
  }

  deselectAll() {
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
    return true;
  }

  selectShape(shape) {
    const shapeMap = {
      circle: 'circle', square: 'rect', rectangle: 'rect',
      triangle: 'triangle', line: 'line', star: 'polygon', hexagon: 'polygon',
    };
    const type = shapeMap[shape];
    const objects = this.canvas.getObjects().filter(o => o.type === type);
    if (objects.length === 0) return false;
    this.canvas.setActiveObject(objects[objects.length - 1]);
    this.canvas.renderAll();
    return true;
  }

  // ============ 删除 ============
  deleteSelected() {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    this.canvas.remove(obj);
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  deleteShape(shape) {
    const shapeMap = {
      circle: 'circle', square: 'rect', rectangle: 'rect',
      triangle: 'triangle', line: 'line',
    };
    const type = shapeMap[shape];
    if (!type) return false;
    const objects = this.canvas.getObjects().filter(o => o.type === type);
    if (objects.length === 0) return false;
    objects.forEach(o => this.canvas.remove(o));
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 线条 ============
  setStrokeWidth(value) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set('strokeWidth', value);
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  setStrokeDash(dash) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set('strokeDashArray', dash);
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 文本 ============
  addText(text) {
    const pos = this._center();
    const obj = new fabric.Text(text, {
      left: pos.left, top: pos.top,
      fontSize: 32, fill: '#111111',
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
    });
    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
    this._saveState();
    return obj;
  }

  // ============ 保存 ============
  saveImage(format) {
    const dataURL = this.canvas.toDataURL({ format: format, quality: 1 });
    const link = document.createElement('a');
    link.download = `voicedraw.${format}`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}
