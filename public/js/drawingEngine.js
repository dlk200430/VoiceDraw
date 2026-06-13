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
    this.brushMode = false;
    this.clipboard = null;
    this._initCanvas();
    this._initBrush();
  }

  _initCanvas() {
    const w = Math.min(window.innerWidth - 300, 900);
    const h = Math.min(window.innerHeight - 140, 600);
    this.canvas.setWidth(w);
    this.canvas.setHeight(h);
    this.canvas.setBackgroundColor('#ffffff', this.canvas.renderAll.bind(this.canvas));
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = '#111111';
    this.canvas.freeDrawingBrush.width = 3;
    this.canvas.isDrawingMode = false;
    this._saveState();

    // Free drawing path created callback
    this.canvas.on('path:created', () => {
      if (this.brushMode) this._saveState();
    });
  }

  _saveState() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.stringify(this.canvas.toJSON()));
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  // ============ 画笔模式 ============
  _initBrush() {
    this.canvas.on('mouse:down', () => {
      if (this.brushMode && !this.canvas.isDrawingMode) {
        this.canvas.isDrawingMode = true;
      }
    });
  }

  setBrushMode(enable) {
    this.brushMode = enable;
    this.canvas.isDrawingMode = enable;
    if (!enable) this._saveState();
    return enable;
  }

  // ============ 撤销/重做 ============
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
        obj = new fabric.Circle({ radius: s / 2, fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
        break;
      case 'square':
        obj = new fabric.Rect({ width: s, height: s, fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
        break;
      case 'rectangle':
        obj = new fabric.Rect({ width: s * 1.5, height: s, fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
        break;
      case 'triangle':
        obj = new fabric.Triangle({ width: s, height: s, fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
        break;
      case 'line':
        obj = new fabric.Line([pos.left, pos.top + s / 2, pos.left + s, pos.top + s / 2], { stroke: color, strokeWidth: 3 });
        break;
      case 'star': {
        const pts = this._starPoints(s / 2, s / 2, s / 2, s / 4, 5);
        obj = new fabric.Polygon(pts, { fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
        break;
      }
      case 'hexagon': {
        const pts = this._polygonPoints(s / 2, s / 2, s / 2, 6);
        obj = new fabric.Polygon(pts, { fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
        break;
      }
      case 'arrow': {
        const headLen = s * 0.3;
        const pts = [
          { x: 0, y: s / 4 },
          { x: s - headLen, y: s / 4 },
          { x: s - headLen, y: 0 },
          { x: s, y: s / 2 },
          { x: s - headLen, y: s },
          { x: s - headLen, y: s * 3 / 4 },
          { x: 0, y: s * 3 / 4 },
        ];
        obj = new fabric.Polygon(pts, { fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
        break;
      }
      case 'heart': {
        // Heart shape using path
        const r = s / 2;
        const path = `M ${r} ${s * 0.8} C ${r} ${s * 0.8} 0 ${s * 0.4} 0 ${r * 0.3} C 0 ${r * 0.05} ${r * 0.4} 0 ${r} ${r * 0.4} C ${r * 1.6} 0 ${s} ${r * 0.05} ${s} ${r * 0.3} C ${s} ${s * 0.4} ${r} ${s * 0.8} ${r} ${s * 0.8} Z`;
        obj = new fabric.Path(path, { fill: color, left: pos.left, top: pos.top, stroke: null, strokeWidth: 0 });
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
    this.brushMode = false;
    this.canvas.isDrawingMode = false;
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

  setBackground(color) {
    this.canvas.setBackgroundColor(color, this.canvas.renderAll.bind(this.canvas));
    this._saveState();
    return true;
  }

  // ============ 颜色 ============
  changeColor(color) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    if (obj.type === 'line' || obj.type === 'path') {
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
      if (obj.type === 'line' || obj.type === 'path') {
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
    const ow = (obj.width || 0) * (obj.scaleX || 1);
    const oh = (obj.height || 0) * (obj.scaleY || 1);

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
    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  moveRelative(dx, dy) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set({ left: obj.left + dx, top: obj.top + dy });
    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 旋转 ============
  rotate(angle) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set('angle', (obj.angle || 0) + angle);
    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 翻转 ============
  flip(direction) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    if (direction === 'horizontal') obj.set('flipX', !obj.flipX);
    else obj.set('flipY', !obj.flipY);
    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 图层 ============
  layer(op) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    switch (op) {
      case 'bringToFront': this.canvas.bringToFront(obj); break;
      case 'sendToBack': this.canvas.sendToBack(obj); break;
      case 'bringForward': this.canvas.bringForward(obj); break;
      case 'sendBackwards': this.canvas.sendBackwards(obj); break;
    }
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 复制粘贴 ============
  copy() {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    this.clipboard = obj;
    return true;
  }

  paste() {
    if (!this.clipboard) return false;
    const obj = fabric.util.object.clone(this.clipboard);
    obj.set({ left: obj.left + 20, top: obj.top + 20 });
    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  duplicate() {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    const cloned = fabric.util.object.clone(obj);
    cloned.set({ left: obj.left + 20, top: obj.top + 20 });
    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 锁定 ============
  lock(locked) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      selectable: !locked,
    });
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 透明度 ============
  setOpacity(value) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set('opacity', Math.max(0, Math.min(1, value)));
    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 对齐 ============
  align(direction) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ow = (obj.width || 0) * (obj.scaleX || 1);
    const oh = (obj.height || 0) * (obj.scaleY || 1);

    switch (direction) {
      case 'left': obj.set('left', 10); break;
      case 'right': obj.set('left', w - ow - 10); break;
      case 'centerH': obj.set('left', (w - ow) / 2); break;
      case 'top': obj.set('top', 10); break;
      case 'bottom': obj.set('top', h - oh - 10); break;
      case 'centerV': obj.set('top', (h - oh) / 2); break;
    }
    obj.setCoords();
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  // ============ 组合 ============
  group() {
    const active = this.canvas.getActiveObject();
    if (!active) {
      // Try multi-select
      const objects = this.canvas.getObjects();
      if (objects.length < 2) return false;
      const sel = new fabric.ActiveSelection(objects, { canvas: this.canvas });
      this.canvas.setActiveObject(sel);
      const group = sel.toGroup();
      this.canvas.renderAll();
      this._saveState();
      return true;
    }
    if (active.type === 'activeselection') {
      const group = active.toGroup();
      this.canvas.renderAll();
      this._saveState();
      return true;
    }
    return false;
  }

  ungroup() {
    const obj = this.canvas.getActiveObject();
    if (!obj || obj.type !== 'group') return false;
    const items = obj._objects;
    obj._restoreObjectsState();
    this.canvas.remove(obj);
    items.forEach(i => this.canvas.add(i));
    if (items.length > 0) this.canvas.setActiveObject(items[items.length - 1]);
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
          width: Math.max(10, (obj.width || 80) * (obj.scaleX || 1) + delta),
          height: Math.max(10, (obj.height || 80) * (obj.scaleY || 1) + delta),
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
      arrow: 'polygon', heart: 'path',
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
      triangle: 'triangle', line: 'line', star: 'polygon', hexagon: 'polygon',
      arrow: 'polygon', heart: 'path',
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
  setStrokeColor(color) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set('stroke', color);
    if (!obj.strokeWidth || obj.strokeWidth === 0) obj.set('strokeWidth', 2);
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  setStrokeWidth(value) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set('strokeWidth', value);
    if (value === 0) obj.set('stroke', null);
    else if (!obj.stroke) obj.set('stroke', '#111111');
    this.canvas.renderAll();
    this._saveState();
    return true;
  }

  setStrokeDash(dash) {
    const obj = this.canvas.getActiveObject();
    if (!obj) return false;
    obj.set('strokeDashArray', dash);
    if (dash.length && (!obj.strokeWidth || obj.strokeWidth === 0)) obj.set('strokeWidth', 2);
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
