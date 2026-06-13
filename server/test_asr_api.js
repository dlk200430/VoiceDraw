const https = require('https');

const boundary = '----VoiceDrawBoundary';
const body = [
  '--' + boundary,
  'Content-Disposition: form-data; name="model"',
  '',
  'whisper-1',
  '--' + boundary,
  'Content-Disposition: form-data; name="language"',
  '',
  'zh',
  '--' + boundary,
  'Content-Disposition: form-data; name="file"; filename="audio.webm"',
  'Content-Type: audio/webm',
  '',
  'dGVzdA==',
  '--' + boundary + '--'
].join('\r\n');

console.log('Sending...');
const req = https.request({
  hostname: 'open.bigmodel.cn',
  path: '/api/paas/v4/audio/transcriptions',
  method: 'POST',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer 888312a4a9294843ad4656a3ca9932d5.CLzzZsBCDL2Lvcab',
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(body)
  }
}, r => {
  console.log('STATUS:', r.statusCode);
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => console.log('BODY:', d));
});
req.on('error', e => console.error('ERR:', e.message));
req.on('timeout', () => { console.log('TIMEOUT'); req.destroy(); });
req.write(body);
req.end();
