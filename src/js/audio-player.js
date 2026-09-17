/**
 * 复古磁带播放器与混音对比挂件 (Audio Preview Player)
 * 内置 Web Audio API 动态合成引擎，支持在 Dry (原声干音) 与 Wet (商业母带混音) 之间无缝切换试听
 */

export class RetroAudioPlayer {
  constructor() {
    this.isPlaying = false;
    this.mode = 'wet'; // 'dry' or 'wet'
    this.audioCtx = null;
    this.timer = null;
    this.progress = 0;
    this.duration = 16; // 16-beat synth groove

    this.playBtn = document.getElementById('audioPlayToggle');
    this.reel1 = document.getElementById('reel1');
    this.reel2 = document.getElementById('reel2');
    this.progressFill = document.getElementById('audioProgressFill');
    this.modeDryBtn = document.getElementById('modeDryBtn');
    this.modeWetBtn = document.getElementById('modeWetBtn');
    this.trackStatusLabel = document.getElementById('audioTrackStatus');

    this.initEvents();
  }

  initEvents() {
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.modeDryBtn) {
      this.modeDryBtn.addEventListener('click', () => this.setMode('dry'));
    }

    if (this.modeWetBtn) {
      this.modeWetBtn.addEventListener('click', () => this.setMode('wet'));
    }
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'dry') {
      this.modeDryBtn?.classList.add('active');
      this.modeWetBtn?.classList.remove('active');
      if (this.trackStatusLabel) {
        this.trackStatusLabel.textContent = '【Dry】原始单声道干音 (未经混音)';
      }
    } else {
      this.modeWetBtn?.classList.add('active');
      this.modeDryBtn?.classList.remove('active');
      if (this.trackStatusLabel) {
        this.trackStatusLabel.textContent = '【Wet】商业级宽立体声 (混音母带)';
      }
    }
  }

  playBeepPattern(step) {
    if (!this.audioCtx) return;

    // Musical chord notes in Pentatonic / Neo-soul scale
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const baseFreq = pentatonic[step % pentatonic.length];

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    if (this.mode === 'dry') {
      // Flat raw sound, narrow bandwidth
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
    } else {
      // Rich wet sound: multiple detuned harmonics, warm lowpass and stereo warmth
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);

      const subOsc = this.audioCtx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(baseFreq * 0.5, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, this.audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      subOsc.start();
      subOsc.stop(this.audioCtx.currentTime + 0.6);
    }

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.6);
  }

  togglePlay() {
    this.initAudio();

    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    if (this.playBtn) this.playBtn.innerHTML = '⏸';
    this.reel1?.classList.add('spinning');
    this.reel2?.classList.add('spinning');

    let currentStep = 0;
    this.timer = setInterval(() => {
      this.playBeepPattern(currentStep);
      currentStep = (currentStep + 1) % this.duration;

      this.progress = (currentStep / this.duration) * 100;
      if (this.progressFill) {
        this.progressFill.style.width = `${this.progress}%`;
      }
    }, 450);
  }

  stop() {
    this.isPlaying = false;
    if (this.playBtn) this.playBtn.innerHTML = '▶';
    this.reel1?.classList.remove('spinning');
    this.reel2?.classList.remove('spinning');
    clearInterval(this.timer);
    this.timer = null;
    if (this.progressFill) {
      this.progressFill.style.width = '0%';
    }
  }
}
