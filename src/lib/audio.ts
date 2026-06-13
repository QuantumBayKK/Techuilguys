"use client";

/**
 * Audio manager.
 *
 * Browsers block audio until a user gesture — the "Tap to enter" gate calls
 * unlock(). Until real SFX assets are dropped in /public/audio, every cue is
 * synthesized procedurally with the Web Audio API so the experience has sound
 * immediately and with zero network weight. Swap synth() bodies for Howler
 * one-shots later without touching call sites.
 */

type CueId =
  | "spin"
  | "roll"
  | "clack"
  | "thud"
  | "deal"
  | "flip"
  | "hover"
  | "select"
  | "chip";

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bed: { osc: OscillatorNode; gain: GainNode } | null = null;
  muted = false;
  unlocked = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    // restore preference
    try {
      this.muted = localStorage.getItem("tg-muted") === "1";
    } catch {}
    return this.ctx;
  }

  unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    this.unlocked = true;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    try {
      localStorage.setItem("tg-muted", m ? "1" : "0");
    } catch {}
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Quiet ambient room-tone bed + the jazz trio, started after table reveal. */
  startBed() {
    if (!this.ctx || !this.master || this.bed) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 56;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    gain.gain.setTargetAtTime(0.04, this.ctx.currentTime, 2);
    this.bed = { osc, gain };
    this.startJazz();
  }

  private jazzTimer: ReturnType<typeof setTimeout> | null = null;

  /** Generative lo-fi jazz trio — soft 7th-chord pads, walking bass, brushes. */
  private startJazz() {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.jazzTimer) return;

    // music bus → warm lowpass → master (so mute still cuts it)
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.gain.setTargetAtTime(0.32, ctx.currentTime, 6); // slow, understated fade-in
    const warm = ctx.createBiquadFilter();
    warm.type = "lowpass";
    warm.frequency.value = 2600;
    bus.connect(warm);
    warm.connect(this.master);

    // vinyl crackle texture
    const crackleBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const cd = crackleBuf.getChannelData(0);
    for (let i = 0; i < cd.length; i++)
      cd[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.6 : 0;
    const crackle = ctx.createBufferSource();
    crackle.buffer = crackleBuf;
    crackle.loop = true;
    const chp = ctx.createBiquadFilter();
     chp.type = "highpass";
     chp.frequency.value = 2000;
    const cg = ctx.createGain();
    cg.gain.value = 0.06;
    crackle.connect( chp);
    chp.connect(cg);
    cg.connect(bus);
    crackle.start();

    const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

    const pad = (notes: number[], time: number, dur: number) => {
      notes.forEach((n) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = m2f(n);
        o.detune.value = (Math.sin(n) * 6) | 0;
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(0.05, time + 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        o.connect(g);
        g.connect(bus);
        o.start(time);
        o.stop(time + dur + 0.05);
      });
    };
    const bass = (n: number, time: number, dur: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(m2f(n), time);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.16, time + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g);
      g.connect(bus);
      o.start(time);
      o.stop(time + dur + 0.05);
    };
    const brush = (time: number, accent: boolean) => {
      const len = 0.12;
      const src = ctx.createBufferSource();
      const b = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      src.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = accent ? 5000 : 7000;
      const g = ctx.createGain();
      g.gain.value = accent ? 0.05 : 0.025;
      src.connect(f);
      f.connect(g);
      g.connect(bus);
      src.start(time);
    };

    // Dm7 · G7 · Cmaj7 · A7  — a mellow ii–V–I turnaround
    const chords = [
      [50, 53, 57, 60],
      [43, 47, 50, 53],
      [48, 52, 55, 59],
      [45, 49, 52, 55],
    ];
    const walks = [
      [38, 41, 45, 43],
      [31, 35, 38, 41],
      [36, 40, 43, 40],
      [33, 37, 40, 36],
    ];

    const bpm = 72;
    const spb = 60 / bpm;
    let step = 0;
    let next = ctx.currentTime + 0.3;

    const tick = () => {
      if (!this.ctx) return;
      while (next < this.ctx.currentTime + 0.18) {
        const bar = Math.floor(step / 4) % 4;
        const beat = step % 4;
        if (beat === 0) pad(chords[bar], next, spb * 4);
        bass(walks[bar][beat], next, spb * 0.92);
        brush(next, beat === 1 || beat === 3);
        next += spb;
        step++;
      }
      this.jazzTimer = setTimeout(tick, 30);
    };
    tick();
  }

  private noiseBuffer(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  play(id: CueId, opts: { rate?: number } = {}) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted || !this.unlocked) return;
    const t = ctx.currentTime;
    const out = this.master;

    const tone = (
      type: OscillatorType,
      f0: number,
      f1: number,
      dur: number,
      peak: number
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };

    const noise = (dur: number, peak: number, hp = 800, lp = 6000) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(dur);
      const hpf = ctx.createBiquadFilter();
      hpf.type = "highpass";
      hpf.frequency.value = hp;
      const lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = lp;
      const g = ctx.createGain();
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(hpf);
      hpf.connect(lpf);
      lpf.connect(g);
      g.connect(out);
      src.start(t);
      src.stop(t + dur);
    };

    switch (id) {
      case "spin":
        tone("sawtooth", 220, 1400, 1.1, 0.12);
        break;
      case "roll":
        tone("triangle", 90 * (opts.rate ?? 1), 70, 0.5, 0.08);
        break;
      case "chip":
        tone("triangle", 520, 360, 0.18, 0.06);
        break;
      case "clack":
        noise(0.09, 0.5, 1200, 5000);
        tone("square", 180, 80, 0.08, 0.08);
        break;
      case "thud":
        tone("sine", 120, 50, 0.3, 0.22);
        noise(0.12, 0.15, 200, 1200);
        break;
      case "deal":
        noise(0.16, 0.4, 2200, 9000);
        break;
      case "flip":
        noise(0.08, 0.45, 2600, 11000);
        tone("square", 900, 400, 0.06, 0.05);
        break;
      case "hover":
        tone("sine", 1300, 1700, 0.05, 0.025);
        break;
      case "select":
        tone("triangle", 440, 880, 0.22, 0.1);
        break;
    }
  }
}

export const audio = new AudioManager();
