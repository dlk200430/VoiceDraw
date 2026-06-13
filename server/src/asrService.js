const https = require('https');
const crypto = require('crypto');

// 阿里云智能语音交互 - 一句话识别
// 文档: https://help.aliyun.com/document_detail/90772.html
const ACCESS_KEY_ID = process.env.ALI_AK_ID || '';
const ACCESS_KEY_SECRET = process.env.ALI_AK_SECRET || '';
const APP_KEY = process.env.ALI_ASR_APP_KEY || '';

const agent = new https.Agent({ keepAlive: false });

function sign(method, accept, contentType, date, body) {
  const headers = {
    'X-NLS-Token': '',
    'Date': date
  };
  return headers;
}

/**
 * 使用阿里云一句话识别（16k采样率）
 * 需要先设置环境变量 ALI_AK_ID, ALI_AK_SECRET, ALI_ASR_APP_KEY
 * 
 * 免费获取: https://nls-portal.console.aliyun.com/
 * 一句话识别免费额度: 5000次/天
 */
async function asrTranscribe(audioBase64) {
  // 如果没有阿里云密钥，回退到智谱
  if (!ACCESS_KEY_ID) {
    return asrViaZhipu(audioBase64);
  }
  return asrViaAliyun(audioBase64);
}

async function asrViaZhipu(audioBase64) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'glm-4v-plus',
      messages: [{
        role: 'user',
        content: [
          { type: 'audio_url', audio_url: { url: `data:audio/webm;base64,${audioBase64}` } },
          { type: 'text', text: '转写为中文文字，只输出转写结果，不要解释。无语音则输出空。' }
        ]
      }],
      max_tokens: 200, temperature: 0, stream: false
    });

    const req = https.request({
      hostname: 'open.bigmodel.cn',
      path: '/api/paas/v4/chat/completions',
      method: 'POST', agent,
      headers: {
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY || '888312a4a9294843ad4656a3ca9932d5.CLzzZsBCDL2Lvcab'}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 20000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.socket) res.socket.destroy();
        try {
          const json = JSON.parse(data);
          console.log('[ASR-Zhipu]', data.substring(0, 200));
          const text = (json.choices?.[0]?.message?.content || '')
            .replace(/^(空字符串|抱歉|无法处理|转写结果[：:]?\s*)/gi, '').trim();
          resolve(text);
        } catch (e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', e => { if (req.socket) req.socket.destroy(); reject(e); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body); req.end();
  });
}

// 阿里云一句话识别
async function asrViaAliyun(audioBase64) {
  const audioBuf = Buffer.from(audioBase64, 'base64');
  
  // 构建请求
  const body = audioBuf.toString('base64');
  const date = new Date().toUTCString();
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'nls-gateway.cn-shanghai.aliyuncs.com',
      path: `/stream/v1/asr?appkey=${APP_KEY}&format=webm&sample_rate=16000`,
      method: 'POST', agent,
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Length': Buffer.byteLength(body),
        'X-NLS-Token': generateAliToken(),
        'Date': date
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.socket) res.socket.destroy();
        try {
          const json = JSON.parse(data);
          console.log('[ASR-Aliyun]', data.substring(0, 200));
          resolve(json.result || '');
        } catch (e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', e => { if (req.socket) req.socket.destroy(); reject(e); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body); req.end();
  });
}

// 阿里云 Token 生成（HMAC-SHA1）
function generateAliToken() {
  // 简化版 token 生成
  const id = ACCESS_KEY_ID;
  const secret = ACCESS_KEY_SECRET;
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const message = JSON.stringify({ accessKeyId: id, expireTime: expires });
  const hmac = crypto.createHmac('sha1', secret).update(message).digest();
  return Buffer.from(JSON.stringify({
    userId: id,
    expireTime: expires,
    signature: hmac.toString('base64')
  })).toString('base64');
}

module.exports = { asrTranscribe };
