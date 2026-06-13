// 快速测试 commandParser
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('C:\\Users\\yh\\aionclaw\\project\\VoiceDraw\\public\\js\\commandParser.js', 'utf8');

const sandbox = { console, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const CommandParser = sandbox.CommandParser || sandbox.module.exports;
const parser = new CommandParser();

console.log('=== 测试 ===');
const tests = [
  '画一个五角星',
  '画一个黄色的五角星',
  '画五角星',
  '画一个红色的圆',
  '画蓝色正方形',
];

for (const t of tests) {
  const result = parser.parse(t);
  console.log(`"${t}" →`, JSON.stringify(result));
}
