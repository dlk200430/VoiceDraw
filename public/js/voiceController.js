/**
 * VoiceController — 语音识别与合成
 * Web Speech API，零成本零延迟
 */
class VoiceController {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onStatus = null;
    this._restartTimer = null;
    this._init();
  }

  _init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('浏览器不支持 SpeechRecognition');
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'zh-CN';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (interim) {
        this._setStatus('recognizing', interim);
      }

      if (final) {
        this._setStatus('success', final);
        if (this.onResult) this.onResult(final);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      if (event.error === 'no-speech') {
        this._setStatus('idle', '等待语音...');
        return;
      }
      if (event.error === 'aborted') return;
      this._setStatus('error', '识别失败，请重试');
      this.speak('抱歉，没有听清，请再说一遍');
    };

    this.recognition.onend = () => {
      // 自动重启（continuous 模式下某些浏览器会自动停止）
      if (this.isListening) {
        this._restartTimer = setTimeout(() => {
          if (this.isListening) {
            try { this.recognition.start(); } catch (e) {}
          }
        }, 200);
      }
    };
  }

  get isSupported() {
    return !!this.recognition;
  }

  start() {
    if (!this.recognition) {
      this.speak('您的浏览器不支持语音识别，请使用 Chrome 浏览器');
      return false;
    }
    if (this.isListening) return true;

    try {
      this.recognition.start();
      this.isListening = true;
      this._setStatus('listening', '正在聆听...');
      return true;
    } catch (e) {
      console.error('启动语音识别失败:', e);
      return false;
    }
  }

  stop() {
    this.isListening = false;
    if (this._restartTimer) clearTimeout(this._restartTimer);
    try { this.recognition.stop(); } catch (e) {}
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
    // 取消当前播报
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // 选择中文语音
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh')) || voices[0];
    if (zhVoice) utterance.voice = zhVoice;

    window.speechSynthesis.speak(utterance);
  }

  _setStatus(state, text) {
    if (this.onStatus) this.onStatus(state, text);
  }
}
