const express = require('express');
const path = require('path');
const { asrTranscribe } = require('./asrService');
const { parseNaturalLanguage } = require('./nlpService');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件路径：优先用环境变量，其次本地开发路径
const staticPath = process.env.STATIC_PATH || path.join(__dirname, '..', '..', 'public');
console.log('[Server] 静态文件路径:', staticPath);
app.use(express.static(staticPath));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'VoiceDraw', timestamp: new Date().toISOString() });
});

app.post('/api/asr', async (req, res) => {
  try {
    const { audio } = req.body;
    if (!audio) return res.status(400).json({ error: 'no audio' });

    const text = await asrTranscribe(audio);
    res.json({ text });
  } catch (e) {
    console.error('ASR error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/nlp', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'no text' });

    console.log('[NLP] 输入:', text);
    const command = await parseNaturalLanguage(text);
    console.log('[NLP] 输出:', JSON.stringify(command));
    res.json({ command });
  } catch (e) {
    console.error('NLP error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`VoiceDraw running at http://localhost:${PORT}`);
});
