let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;

export function roomTonePlaying(): boolean {
  return source !== null;
}

export function stopRoomTone(): void {
  try {
    source?.stop();
  } catch {
    /* already stopped */
  }
  source?.disconnect();
  source = null;
}

export function startRoomTone(): { ok: boolean; message: string } {
  const Ctor = window.AudioContext;
  if (!Ctor) {
    return {
      ok: false,
      message: "This browser has no local audio. The written note is the evidence.",
    };
  }
  stopRoomTone();
  try {
    ctx = ctx ?? new Ctor();
    void ctx.resume();
    const seconds = 2;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 0.2;
    }
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    node.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    node.start();
    source = node;
    return {
      ok: true,
      message: "Playing a local room tone. This is not a voice. Stop ends it. The written note is the evidence.",
    };
  } catch {
    source = null;
    return {
      ok: false,
      message: "Local audio failed to start. The written note is the evidence.",
    };
  }
}
