export function createTone() {
  let context = null;
  let gain = null;
  let source = null;

  return {
    apply(settings) {
      if (!settings?.tone) {
        if (context && context.state === "running") context.suspend().catch(() => {});
        return;
      }
      try {
        if (!context) {
          const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
          if (!AudioCtx) return;
          context = new AudioCtx();
          const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
          const data = buffer.getChannelData(0);
          let seed = 0x12345678;
          for (let i = 0; i < data.length; i += 1) {
            seed = (1664525 * seed + 1013904223) >>> 0;
            data[i] = ((seed % 1000) / 1000 - 0.5) * 0.35;
          }
          source = context.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          const filter = context.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 380;
          gain = context.createGain();
          source.connect(filter);
          filter.connect(gain);
          gain.connect(context.destination);
          source.start();
        }
        gain.gain.value = Math.max(0, Math.min(1, settings.volume ?? 0.2)) * 0.12;
        if (context.state === "suspended") context.resume().catch(() => {});
      } catch {
        context = null;
      }
    },
  };
}
