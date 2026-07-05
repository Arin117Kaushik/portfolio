// Procedural sound design — everything is synthesized in Web Audio, zero
// asset files. Two continuous layers (corridor drone + scroll-velocity
// wind) and a handful of one-shots. Every node routes through a single
// master gain, so mute is one knob and the graph stays alive.
//
// The context can only start after a user gesture (autoplay policy), so
// the engine boots lazily from the HUD toggle / first pointerdown.

const MASTER_LEVEL = 0.5;

class AudioEngine {
  enabled = false;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  private ensure() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // --- corridor drone: two detuned oscillators through a dark lowpass,
    // filter swept by a very slow LFO so it never reads as a test tone
    this.droneFilter = ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 240;
    this.droneFilter.Q.value = 0.8;

    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.07;
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.master);

    const oscA = ctx.createOscillator();
    oscA.type = "sine";
    oscA.frequency.value = 55;
    const oscB = ctx.createOscillator();
    oscB.type = "triangle";
    oscB.frequency.value = 110.7; // slightly off the octave — slow beating
    const oscBGain = ctx.createGain();
    oscBGain.gain.value = 0.35;
    oscA.connect(this.droneFilter);
    oscB.connect(oscBGain);
    oscBGain.connect(this.droneFilter);
    oscA.start();
    oscB.start();

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneFilter.frequency);
    lfo.start();

    // --- scroll wind: looped noise through a bandpass; gain and centre
    // frequency ride scroll velocity from the director
    const noiseLen = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.value = 400;
    this.windFilter.Q.value = 0.6;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;

    noise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.master);
    noise.start();
  }

  toggle(): boolean {
    this.ensure();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") void ctx.resume();
    this.enabled = !this.enabled;
    this.master!.gain.setTargetAtTime(
      this.enabled ? MASTER_LEVEL : 0,
      ctx.currentTime,
      0.15
    );
    try {
      localStorage.setItem("snd", this.enabled ? "1" : "0");
    } catch {}
    return this.enabled;
  }

  // Continuous control, called once per rAF by the director.
  frame(velocity: number, ambient: number) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const v = Math.min(1, Math.abs(velocity) * 6);
    // wind swells and brightens with scroll speed, dies in the finale
    this.windGain!.gain.setTargetAtTime(v * 0.1 * (1 - ambient), t, 0.12);
    this.windFilter!.frequency.setTargetAtTime(400 + v * 900, t, 0.2);
    // the drone calms and darkens once the field settles
    this.droneGain!.gain.setTargetAtTime(0.07 - 0.03 * ambient, t, 0.6);
    this.droneFilter!.frequency.setTargetAtTime(240 - 110 * ambient, t, 0.8);
  }

  // Soft two-partial bell — one per station, pitched to its hue.
  chime(freq: number) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const [ratio, level] of [
      [1, 0.09],
      [1.5, 0.04],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(g);
      g.connect(this.master!);
      osc.start(t);
      osc.stop(t + 1.5);
    }
  }

  // Low pitch-drop as the camera punches through a station.
  thump() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Ascending resolve as the constellation snaps into place.
  snapResolve() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [440, 523.25, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const at = t + i * 0.11;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.055, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
      osc.connect(g);
      g.connect(this.master!);
      osc.start(at);
      osc.stop(at + 1.2);
    });
  }

  // UI micro-sounds for the finale links.
  blip() {
    this.oneShot(1180, 0.05, 0.045);
  }
  tick() {
    this.oneShot(760, 0.035, 0.06);
  }

  private oneShot(freq: number, dur: number, level: number) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}

export const audio = new AudioEngine();

// Station chime pitches — A4 / C5 / E5, one per machine, an A-minor
// arpeggio across the corridor that the snap-resolve completes at A5.
export const STATION_FREQS = [440, 523.25, 659.25];
