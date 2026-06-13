/**
 * 后端单元测试 — VoiceDraw Server
 */
const http = require('http');
const path = require('path');
const express = require('express');

let server;
let sockets = new Set();

beforeAll((done) => {
  const testApp = express();
  testApp.use(express.json({ limit: '10mb' }));
  testApp.use(express.static(path.join(__dirname, '..', '..', 'public')));
  
  testApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'VoiceDraw', timestamp: new Date().toISOString() });
  });

  testApp.post('/api/asr', async (req, res) => {
    const { asrTranscribe } = require('../src/asrService');
    try {
      const { audio } = req.body;
      if (!audio) return res.status(400).json({ error: 'no audio' });
      const text = await asrTranscribe(audio);
      res.json({ text });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  server = testApp.listen(3099, () => done());
  // 追踪所有打开的 socket，确保 afterAll 能彻底关闭
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
}, 10000);

afterAll((done) => {
  // 先销毁所有活跃连接，再关闭 server
  for (const s of sockets) s.destroy();
  sockets.clear();
  if (server) {
    server.close(() => done());
  } else {
    done();
  }
});

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3099, path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        // 消费完响应体后销毁 socket，释放连接
        res.destroy();
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch (e) { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

describe('API Routes', () => {
  test('GET /api/health', async () => {
    const res = await request('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.name).toBe('VoiceDraw');
  });

  test('GET / returns HTML', async () => {
    const res = await request('GET', '/');
    expect(res.status).toBe(200);
    expect(res.body).toContain('<!DOCTYPE html>');
  });

  test('POST /api/asr without audio returns 400', async () => {
    const res = await request('POST', '/api/asr', {});
    expect(res.status).toBe(400);
  });

  test('POST /api/asr with empty audio returns 200', async () => {
    const res = await request('POST', '/api/asr', { audio: 'dGVzdA==' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
  });
});

describe('Static Files', () => {
  test('index.html accessible', async () => {
    const res = await request('GET', '/');
    expect(res.status).toBe(200);
  });

  test('CSS accessible', async () => {
    const res = await request('GET', '/css/style.css');
    expect(res.status).toBe(200);
  });

  test('JS files accessible', async () => {
    for (const f of ['/js/commandParser.js', '/js/drawingEngine.js', '/js/voiceController.js', '/js/app.js']) {
      const res = await request('GET', f);
      expect(res.status).toBe(200);
    }
  });

  test('404 for unknown path', async () => {
    const res = await request('GET', '/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('ASR Service', () => {
  const { asrTranscribe } = require('../src/asrService');

  test('asrTranscribe is function', () => {
    expect(typeof asrTranscribe).toBe('function');
  });

  test('asrTranscribe empty audio returns string', async () => {
    const result = await asrTranscribe('AAAA');
    expect(typeof result).toBe('string');
  }, 15000);
});
