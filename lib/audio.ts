// Web Audio & Speech Synthesis Engine for Billiard Timer

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  public initCtx() {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Pure Voice Speech Synthesis (English Voice)
  public speakText(text: string) {
    if (this.isMuted) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const synth = window.speechSynthesis;
        if (synth.paused) {
          synth.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.volume = 1.0;
        utterance.rate = 1.0; // Natural speed
        utterance.pitch = 1.0;

        const voices = synth.getVoices();
        if (voices.length > 0) {
          const enVoice = voices.find(
            (v) => v.lang.startsWith("en") || v.lang.includes("US") || v.lang.includes("GB")
          );
          if (enVoice) utterance.voice = enVoice;
        }

        synth.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
  }

  // Audio Beep for 10s down to 6s (10, 9, 8, 7, 6)
  public play10to6Beep() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(750, now); // 750 Hz clean tick

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.warn("10to6 beep failed:", e);
    }
  }

  // Action: Start (ONLY Voice "Start")
  public playStartSpeech() {
    this.initCtx();
    this.speakText("Start");
  }

  // Action: Extension (ONLY Voice "Extension")
  public playExtensionSpeech() {
    this.initCtx();
    this.speakText("Extension");
  }

  // Action: Countdown 5, 4, 3, 2, 1 (ONLY Voice "five", "four", "three", "two", "one")
  public speakCountdownNumber(num: number) {
    if (this.isMuted) return;

    const words: Record<number, string> = {
      5: "five",
      4: "four",
      3: "three",
      2: "two",
      1: "one",
    };
    if (words[num]) {
      this.speakText(words[num]);
    }
  }

  // Action: Time's Up Finish Sound at 0s (Audio Chime Tone + Voice "Time's Up")
  public playClearFinishSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }

      // Play loud 3-stroke audio finish chime
      if (this.ctx) {
        const now = this.ctx.currentTime;
        [0, 0.18, 0.36].forEach((offset) => {
          if (!this.ctx) return;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = "sine";
          osc2.type = "sawtooth";

          osc1.frequency.setValueAtTime(659.25, now + offset); // E5
          osc2.frequency.setValueAtTime(880.0, now + offset); // A5

          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.4, now + offset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.onended = () => {
            try {
              osc1.disconnect();
              osc2.disconnect();
              gain.disconnect();
            } catch (e) {}
          };

          osc1.start(now + offset);
          osc2.start(now + offset);
          osc1.stop(now + offset + 0.15);
          osc2.stop(now + offset + 0.15);
        });
      }

      // Speak "Time's Up!" voice
      this.speakText("Time's Up");
    } catch (e) {
      console.warn("Clear finish sound failed:", e);
    }
  }

  // Fallback aliases for compatibility
  public playPleasantFinishSound() {
    this.playClearFinishSound();
  }
  public playWarning() {}
  public playBuzzer() {
    this.playClearFinishSound();
  }
  public playTick() {}
  public playFinishChime() {
    this.playClearFinishSound();
  }
  public playClick() {}
  public playStartAudioTone() {}
}

export const soundManager = new SoundManager();
