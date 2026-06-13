const express = require('express');
const path = require('path');
const { asrTranscribe } = require('./asrService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', '..', 'public')));
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

app.listen(PORT, () => {
  console.log(`VoiceDraw running at http://localhost:${PORT}`);
});
