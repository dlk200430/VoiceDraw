const https = require('https');

const API_KEY = process.env.ZHIPU_API_KEY || '888312a4a9294843ad4656a3ca9932d5.CLzzZsBCDL2Lvcab';
const BASE_URL = 'open.bigmodel.cn';

// 创建不启用 keep-alive 的 agent，每次请求用完立即释放 socket
const agent = new https.Agent({ keepAlive: false });

async function asrTranscribe(audioBase64) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'glm-4v-plus',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'audio_url',
              audio_url: {
                url: `data:audio/webm;base64,${audioBase64}`
              }
            },
            {
              type: 'text',
              text: '请将这段语音转写为文字，只输出转写结果，不要加任何解释、标点或额外内容。如果听不清或没有语音，输出空字符串。'
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.1,
      stream: false
    });

    const req = https.request({
      hostname: BASE_URL,
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      agent,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // 立即销毁 socket，防止 TLSWRAP 泄漏
        if (res.socket) res.socket.destroy();
        try {
          const json = JSON.parse(data);
          const text = json.choices?.[0]?.message?.content || '';
          resolve(text.trim());
        } catch (e) {
          reject(new Error('Parse error: ' + data.substring(0, 200)));
        }
      });
      res.on('error', (e) => {
        if (res.socket) res.socket.destroy();
        reject(e);
      });
    });

    req.on('error', (e) => {
      if (req.socket) req.socket.destroy();
      reject(e);
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ASR timeout'));
    });
    req.write(body);
    req.end();
  });
}

module.exports = { asrTranscribe };
