/**
 * VoiceController — 语音识别与合成
 * 使用浏览器内置 Web Speech API（Edge 可用，无需翻墙）
 * 持续录音 + 定时切片发送云端兜底
 */
class VoiceController {
  constructor() {
    this.isListening = false;
    this.onResult = null;
    this.onStatus = null;
    this._recognition = null;
    this._mediaRecorder = null;
    this._audioChunks = [];
    this._processing = false;
    this._stream = null;
    this._sendInterval = null;
    this._lastText = '';
    this._restartTimer = null;
  }

  async start() {
    try {
      // 先试试 Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this._recognition = new SpeechRecognition();
        this._recognition.lang = 'zh-CN';
        this._recognition.interimResults = false;
        this._recognition.continuous = true;
        this._recognition.maxAlternatives = 1;

        this._recognition.onresult = (event) => {
          const text = event.results[event.results.length - 1][0].transcript.trim();
          console.log('[Voice] WebSpeech:', text);
          if (text && text !== this._lastText) {
            this._lastText = text;
            this._setStatus('success', text);
            if (this.onResult) this.onResult(text);
          }
        };

        this._recognition.onerror = (e) => {
          console.warn('[Voice] WebSpeech error:', e.error);
          if (e.error === 'network') {
            console.log('[Voice] WebSpeech 不可用，切换到云端 ASR');
            this._recognition = null;
            this._startCloudASR();
          }
        };

        this._recognition.onend = () => {
          console.log('[Voice] WebSpeech ended, 自动重启');
          if (this.isListening && this._recognition) {
            this._restartTimer = setTimeout(() => {
              try { this._recognition.start(); } catch (e) {}
            }, 300);
          }
        };

        this._recognition.start();
        this.isListening = true;
        this._setStatus('listening', '正在聆听...');
        console.log('[Voice] WebSpeech 已启动');
        return true;
      } else {
        console.log('[Voice] WebSpeech 不可用');
        await this._startCloudASR();
        return true;
      }
    } catch (e) {
      console.error('[Voice] 启动失败:', e);
      this._setStatus('error', '麦克风权限未授予');
      return false;
    }
  }

  async _startCloudASR() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Voice] 麦克风已获取');

      this._mediaRecorder = new MediaRecorder(this._stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this._audioChunks.push(e.data);
      };

      this._mediaRecorder.start(1000);
      this.isListening = true;
      this._setStatus('listening', '正在聆听...');
      console.log('[Voice] 云端 ASR 已启动');

      this._sendInterval = setInterval(() => {
        if (this._audioChunks.length > 0 && !this._processing) {
          this._sendAudio();
        }
      }, 4000);
    } catch (e) {
      console.error('[Voice] 云端 ASR 启动失败:', e);
      this._setStatus('error', '麦克风权限未授予');
    }
  }

  async _sendAudio() {
    this._processing = true;
    this._setStatus('recognizing', '识别中...');

    const blob = new Blob(this._audioChunks, { type: 'audio/webm' });
    this._audioChunks = [];
    console.log('[Voice] 发送音频:', (blob.size / 1024).toFixed(1), 'KB');

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
      console.log('[Voice] ASR:', data.text || '(空)');

      if (data.text && data.text.trim() && data.text.trim() !== this._lastText) {
        this._lastText = data.text.trim();
        this._setStatus('success', data.text.trim());
        if (this.onResult) this.onResult(data.text.trim());
      } else {
        this._setStatus('listening', '正在聆听...');
      }
    } catch (e) {
      console.error('[Voice] ASR 失败:', e);
      this._setStatus('listening', '正在聆听...');
    }

    this._processing = false;
  }

  stop() {
    console.log('[Voice] 停止');
    this.isListening = false;

    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }

    if (this._recognition) {
      try { this._recognition.stop(); } catch (e) {}
      this._recognition = null;
    }

    if (this._sendInterval) {
      clearInterval(this._sendInterval);
      this._sendInterval = null;
    }

    if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
      this._mediaRecorder.stop();
    }

    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }

    this._audioChunks = [];
    this._processing = false;
    this._lastText = '';
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
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 1.1; u.volume = 0.85;
    window.speechSynthesis.speak(u);
  }

  _setStatus(state, text) {
    if (this.onStatus) this.onStatus(state, text);
  }
}
