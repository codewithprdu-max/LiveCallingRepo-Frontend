// High-fidelity Web Audio API Sound Generator for In-Call Ringing and Notifications
// Zero external audio files required - works offline and across all browsers

class SoundService {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private ringbackInterval: number | null = null;

  constructor() {
    // Automatically unlock AudioContext on first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.getOrCreateAudioContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }
  }

  private getOrCreateAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * INCOMING CALL RINGTONE (Receiver Side)
   * Plays a pleasant modern melodic chime sequence (C5 - E5 - G5 - C6)
   */
  public playRingtone(): void {
    this.stopAll();

    const ctx = this.getOrCreateAudioContext();
    if (!ctx) return;

    const playMelody = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      const c = this.audioCtx;
      if (c.state === 'suspended') {
        c.resume().catch(() => {});
      }

      // Melodic notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.22 },
        { freq: 659.25, time: 0.25, dur: 0.22 },
        { freq: 783.99, time: 0.50, dur: 0.22 },
        { freq: 1046.50, time: 0.75, dur: 0.45 },
      ];

      const now = c.currentTime;

      notes.forEach(({ freq, time, dur }) => {
        const osc = c.createOscillator();
        const gain = c.createGain();

        // Harmonically rich sound with sine + triangle combination
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Soft attack & exponential decay (marimba / chime style)
        gain.gain.setValueAtTime(0.0001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.18, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    };

    playMelody();
    this.ringtoneInterval = window.setInterval(playMelody, 2400);
  }

  /**
   * OUTGOING DIAL / RINGBACK TONE (Caller Side)
   * Plays standard telephone dial/ringback tone (440Hz + 480Hz dual tone)
   * "tuuuut... tuuuut..." until the receiver answers or declines
   */
  public playOutgoingRingback(): void {
    this.stopAll();

    const ctx = this.getOrCreateAudioContext();
    if (!ctx) return;

    const playBeep = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      const c = this.audioCtx;
      if (c.state === 'suspended') {
        c.resume().catch(() => {});
      }

      const now = c.currentTime;
      const osc1 = c.createOscillator();
      const osc2 = c.createOscillator();
      const gain = c.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      // 1.4s beep duration with smooth attack and decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(c.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    };

    playBeep();
    // Standard ring cadence: ~1.4s beep + ~2.6s silence = 4000ms loop
    this.ringbackInterval = window.setInterval(playBeep, 4000);
  }

  /**
   * CALL ENDED TONE (Both Parties)
   * Polite 3-beep tone signaling the call has hung up
   */
  public playCallEndedTone(): void {
    this.stopAll();

    const ctx = this.getOrCreateAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const beeps = [
      { freq: 480, time: 0.00, dur: 0.12 },
      { freq: 400, time: 0.15, dur: 0.12 },
      { freq: 320, time: 0.30, dur: 0.20 },
    ];

    beeps.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.12, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  }

  /**
   * Stops all active ringtones, dial tones, and audio loops
   */
  public stopAll(): void {
    if (this.ringtoneInterval !== null) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.ringbackInterval !== null) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
  }
}

export const soundService = new SoundService();
