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
    this._silenceThreshold = 2000; // 2 秒静音后发送
    this._lastSpeech = 0;
    this._audioCtx = null;
    this._analyser = null;
    this._vadInterval = null;
    this._isSpeaking = false;
    this._processing = false;
    this._stream = null;
  }

  async start() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Voice] 麦克风已获取');

      // 先初始化 AudioContext 和 VAD
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 256;
      this._analyser.smoothingTimeConstant = 0.3;

      const source = this._audioCtx.createMediaStreamSource(this._stream);
      source.connect(this._analyser);

      // 启动 VAD
      this._lastSpeech = Date.now();
      this._vadInterval = setInterval(() => this._checkVAD(), 300);
      console.log('[Voice] VAD 已启动');

      // 启动录音
      this._mediaRecorder = new MediaRecorder(this._stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus' : 'audio/webm'
      });

      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this._audioChunks.push(e.data);
          console.log('[Voice] 音频片段:', e.data.size, 'bytes');
        }
      };

      this._mediaRecorder.start(1000); // 每秒收集一次
      this.isListening = true;
      this._setStatus('listening', '正在聆听...');
      console.log('[Voice] 录音已开始');

      // 兜底：每 5 秒强制发送一次（防止 VAD 漏检）
      this._forceSendInterval = setInterval(() => {
        if (this.isListening && this._audioChunks.length > 0 && !this._processing) {
          console.log('[Voice] 强制发送（兜底）');
          this._sendAudio();
        }
      }, 5000);

      return true;
    } catch (e) {
      console.error('[Voice] 麦克风启动失败:', e);
      this._setStatus('error', '麦克风权限未授予');
      this.speak('请允许麦克风权限');
      return false;
    }
  }

  _checkVAD() {
    if (!this.isListening || this._processing || !this._analyser) return;

    const data = new Uint8Array(this._analyser.frequencyBinCount);
    this._analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;

    // 音量超过阈值 → 有人在说话
    if (avg > 20) {
      this._lastSpeech = Date.now();
    }

    const elapsed = Date.now() - this._lastSpeech;
    // 静音超过阈值且有录音数据 → 发送识别
    if (this._audioChunks.length > 0 && elapsed > this._silenceThreshold) {
      console.log('[Voice] 静音 ' + (elapsed / 1000).toFixed(1) + 's，发送识别');
      this._sendAudio();
    }
  }

  async _sendAudio() {
    if (this._audioChunks.length === 0 || this._processing) return;
    this._processing = true;
    this._setStatus('recognizing', '识别中...');

    const blob = new Blob(this._audioChunks, { type: 'audio/webm' });
    this._audioChunks = [];
    console.log('[Voice] 发送音频，大小:', (blob.size / 1024).toFixed(1), 'KB');

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
      console.log('[Voice] ASR 结果:', data.text || '(空)');

      if (data.text && data.text.trim()) {
        const text = data.text.trim();
        this._setStatus('success', text);
        if (this.onResult) this.onResult(text);
      }
    } catch (e) {
      console.error('[Voice] ASR 请求失败:', e);
    }

    this._processing = false;
  }

  stop() {
    console.log('[Voice] 停止录音');
    this.isListening = false;

    if (this._vadInterval) {
      clearInterval(this._vadInterval);
      this._vadInterval = null;
    }

    if (this._forceSendInterval) {
      clearInterval(this._forceSendInterval);
      this._forceSendInterval = null;
    }

    if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
      this._mediaRecorder.stop();
    }

    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }

    if (this._audioCtx && this._audioCtx.state !== 'closed') {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }

    this._audioChunks = [];
    this._processing = false;
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
      this._lastSpeech = Date.now(); // 重置静音计时
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
