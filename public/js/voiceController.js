/**
 * VoiceController — 语音识别与合成
 * 前端录音 → 后端智谱 ASR，高精度识别
 */
class VoiceController {
  constructor() {
    this.isListening = false;
    this.onResult = null;
    this.onStatus = null;
    this.onInterim = null;
    this._mediaRecorder = null;
    this._audioChunks = [];
    this._silenceTimer = null;
    this._silenceThreshold = 1500;
    this._lastSpeech = 0;
    this._audioCtx = null;
    this._analyser = null;
    this._vadInterval = null;
    this._isSpeaking = false;
    this._processing = false;
  }

  _initVAD() {
    try {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 256;
      this._vadInterval = setInterval(() => {
        if (!this.isListening || this._isSpeaking || this._processing) return;
        const data = new Uint8Array(this._analyser.frequencyBinCount);
        this._analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 15) {
          this._lastSpeech = Date.now();
        }
        const elapsed = Date.now() - this._lastSpeech;
        if (this._audioChunks.length > 0 && elapsed > this._silenceThreshold) {
          this._sendAudio();
        }
      }, 200);
    } catch (e) {
      console.warn('VAD 初始化失败:', e);
    }
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._initVAD();

      // 连接 AudioContext
      if (this._audioCtx) {
        const source = this._audioCtx.createMediaStreamSource(stream);
        source.connect(this._analyser);
      }

      this._mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      });

      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this._audioChunks.push(e.data);
        }
      };

      // 每 2 秒收集一段
      this._mediaRecorder.start(2000);

      this.isListening = true;
      this._lastSpeech = Date.now();
      this._setStatus('listening', '正在聆听...');
      return true;
    } catch (e) {
      console.error('麦克风启动失败:', e);
      this._setStatus('error', '麦克风权限未授予');
      this.speak('请允许麦克风权限');
      return false;
    }
  }

  async _sendAudio() {
    if (this._audioChunks.length === 0 || this._processing) return;
    this._processing = true;

    const blob = new Blob(this._audioChunks, { type: 'audio/webm' });
    this._audioChunks = [];

    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const resp = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64 })
      });

      const data = await resp.json();
      if (data.text && data.text.trim()) {
        const text = data.text.trim();
        this._setStatus('success', text);
        if (this.onResult) this.onResult(text);
      }
    } catch (e) {
      console.error('ASR 请求失败:', e);
    }

    this._processing = false;
  }

  stop() {
    this.isListening = false;
    if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
      this._mediaRecorder.stop();
      this._mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    this._audioChunks = [];
    this._setStatus('idle', '就绪');
  }

  toggle() {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    this._isSpeaking = true;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.1;
    utterance.volume = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh')) || voices[0];
    if (zhVoice) utterance.voice = zhVoice;

    utterance.onend = () => {
      this._isSpeaking = false;
      this._lastSpeech = Date.now();
    };
    utterance.onerror = () => {
      this._isSpeaking = false;
      this._lastSpeech = Date.now();
    };

    window.speechSynthesis.speak(utterance);
  }

  _setStatus(state, text) {
    if (this.onStatus) this.onStatus(state, text);
  }
}
