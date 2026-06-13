/**
 * VoiceDraw 自动演示脚本
 * 在浏览器控制台粘贴运行，自动执行一系列绘图操作
 * 配合录屏软件使用
 */

(async function demo() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  
  // 直接调用 drawingEngine 和 commandParser
  const engine = window.drawingEngine;
  const parser = new CommandParser();
  
  console.log('🎬 VoiceDraw 演示开始');
  
  // 1. 画红色圆
  console.log('1. 画一个红色的圆');
  engine.draw('circle', { fill: '#ef4444', radius: 80, left: 200, top: 200 });
  await sleep(1500);
  
  // 2. 画蓝色正方形
  console.log('2. 画蓝色正方形');
  engine.draw('square', { fill: '#3b82f6', width: 120, height: 120, left: 400, top: 200 });
  await sleep(1500);
  
  // 3. 画黄色五角星
  console.log('3. 画黄色的五角星');
  engine.draw('star', { fill: '#eab308', radius: 60, left: 600, top: 200 });
  await sleep(1500);
  
  // 4. 画绿色三角形
  console.log('4. 画绿色三角形');
  engine.draw('triangle', { fill: '#22c55e', width: 120, height: 100, left: 300, top: 350 });
  await sleep(1500);
  
  // 5. 撤销
  console.log('5. 撤销');
  engine.undo();
  await sleep(1000);
  
  // 6. 重做
  console.log('6. 重做');
  engine.redo();
  await sleep(1000);
  
  // 7. 全选 → 全部变成紫色
  console.log('7. 全部变成紫色');
  engine.selectAll();
  await sleep(500);
  engine.changeAllColor('#a855f7');
  await sleep(1500);
  
  // 8. 撤销颜色变化
  console.log('8. 撤销');
  engine.undo();
  await sleep(1000);
  
  // 9. 清除画布
  console.log('9. 清除画布');
  engine.clear();
  await sleep(1000);
  
  // 10. 画心形
  console.log('10. 画粉色心形');
  engine.draw('heart', { fill: '#ec4899', width: 100, height: 100, left: 350, top: 250 });
  await sleep(1500);
  
  // 11. 复制
  console.log('11. 复制一个');
  engine.duplicate();
  await sleep(1000);
  
  // 12. 旋转
  console.log('12. 旋转45度');
  engine.rotate(45);
  await sleep(1000);
  
  // 13. 半透明
  console.log('13. 半透明');
  engine.setOpacity(0.5);
  await sleep(1000);
  
  // 14. 新建画布
  console.log('14. 新建画布');
  engine.newCanvas();
  await sleep(1000);
  
  // 15. 最终演示：画一个完整的图
  console.log('15. 最终演示');
  engine.draw('circle', { fill: '#ef4444', radius: 100, left: 400, top: 300 });
  await sleep(800);
  engine.draw('star', { fill: '#eab308', radius: 50, left: 400, top: 200 });
  await sleep(800);
  engine.draw('square', { fill: '#3b82f6', width: 80, height: 80, left: 300, top: 400 });
  await sleep(800);
  engine.draw('square', { fill: '#22c55e', width: 80, height: 80, left: 500, top: 400 });
  
  console.log('🎬 演示完成！');
})();
