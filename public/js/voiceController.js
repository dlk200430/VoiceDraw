/**
 * VoiceController — 语音识别与合成
 * Web Speech API + AudioContext VAD，实时交互
 */
class VoiceController {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onStatus = null;
    this.onInterim = null;
    this._restartTimer = null;
    this._vadTimer = null;
    this._lastSpeech = 0;
    this._silenceThreshold = 1500;
    this._pendingFinal = '';
    this._isSpeaking = false;
    this._init();
  }

  _init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('浏览器不支持 SpeechRecognition');
      return;
    }
    this._initVAD();
    this._initRecognition();
  }

  _initRecognition() {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
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
        this._lastSpeech = Date.now();
        this._setStatus('recognizing', interim);
        if (this.onInterim) this.onInterim(interim);
      }

      if (final) {
        this._pendingFinal += final;
        this._lastSpeech = Date.now();
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('语音识别错误:', event.error);
      if (event.error === 'no-speech') {
        this._setStatus('listening', '正在聆听...');
        return;
      }
      if (event.error === 'aborted') return;
      if (event.error === 'network') {
        // Chrome 国内网络问题，静默重启
        this._scheduleRestart();
        return;
      }
      this._setStatus('error', '识别失败，请重试');
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this._scheduleRestart();
      }
    };
  }

  _initVAD() {
    // AudioContext 检测音量
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this._vadInterval = setInterval(() => {
        if (!this.isListening || this._isSpeaking) return;
        const elapsed = Date.now() - this._lastSpeech;
        if (this._pendingFinal && elapsed > this._silenceThreshold) {
          this._commitPending();
        }
      }, 300);
    } catch (e) {
      console.warn('VAD 初始化失败:', e);
    }
  }

  _commitPending() {
    if (!this._pendingFinal.trim()) return;
    const text = this._pendingFinal.trim();
    this._pendingFinal = '';
    this._setStatus('success', text);
    if (this.onResult) this.onResult(text);
  }

  _scheduleRestart() {
    if (this._restartTimer) clearTimeout(this._restartTimer);
    this._restartTimer = setTimeout(() => {
      if (this.isListening && !this._isSpeaking) {
        try { this.recognition.start(); } catch (e) {
          // 可能已经在运行
        }
      }
    }, 150);
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
      this._pendingFinal = '';
      this._lastSpeech = Date.now();
      this._setStatus('listening', '正在聆听...');
      return true;
    } catch (e) {
      console.error('启动语音识别失败:', e);
      return false;
    }
  }

  stop() {
    this.isListening = false;
    this._pendingFinal = '';
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
    this._isSpeaking = true;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh')) || voices[0];
    if (zhVoice) utterance.voice = zhVoice;

    utterance.onend = () => {
      this._isSpeaking = false;
      this._lastSpeech = Date.now();
      // 播报完自动恢复识别
      if (this.isListening) {
        this._scheduleRestart();
      }
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
