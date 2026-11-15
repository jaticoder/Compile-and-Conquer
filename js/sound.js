// Sound effect dibikin langsung pakai Web Audio API: ga ada file audio.
//
// Catatan: browser (terutama HP) baru ngizinin suara setelah user nyentuh
// layar. Makanya AudioContext baru dibuat pas pertama kali dipakai, yaitu
// setelah user klik Jalankan atau tombol suara.

const Sound = (() => {
  const MUTE_KEY = 'compile-and-conquer-mute';
  let ctx = null;
  let noiseBuffer = null;
  let muted = false;

  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { /* abaikan */ }

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noise(ac) {
    if (!noiseBuffer) {
      noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  // Satu nada: frekuensi meluncur dari `from` ke `to`.
  function tone({ type = 'square', from, to = from, start = 0, dur = 0.15, vol = 0.12 }) {
    const ac = muted ? null : audio();
    if (!ac) return;
    const t = ac.currentTime + start;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Desis/ledakan: noise yang disaring, frekuensinya turun.
  function burst({ start = 0, dur = 0.3, from = 2400, to = 200, vol = 0.2 }) {
    const ac = muted ? null : audio();
    if (!ac) return;
    const t = ac.currentTime + start;
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    src.buffer = noise(ac);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  return {
    // Dipanggil dari klik user biar browser ngizinin suara.
    unlock() { if (!muted) audio(); },
    isMuted: () => muted,
    setMuted(value) {
      muted = value;
      try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch (err) { /* abaikan */ }
      if (!muted) {
        audio();
        tone({ from: 660, to: 990, dur: 0.1, vol: 0.1 });
      }
    },

    // Hero ngisi tenaga.
    charge() { tone({ type: 'sawtooth', from: 180, to: 700, dur: 0.18, vol: 0.09 }); },
    // Bola energi terbang.
    zap() {
      tone({ type: 'square', from: 1100, to: 260, dur: 0.46, vol: 0.07 });
      burst({ dur: 0.4, from: 6000, to: 800, vol: 0.05 });
    },
    // Kena boss.
    hit() {
      tone({ type: 'sine', from: 170, to: 38, dur: 0.28, vol: 0.35 });
      burst({ dur: 0.28, from: 3200, to: 180, vol: 0.28 });
    },
    // Boss tumbang.
    defeat() {
      burst({ dur: 0.7, from: 1800, to: 90, vol: 0.3 });
      [440, 330, 247, 165].forEach((f, i) =>
        tone({ type: 'square', from: f, to: f * 0.8, start: i * 0.09, dur: 0.14, vol: 0.1 })
      );
    },
    // Popup menang: arpeggio naik.
    win() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone({ type: 'square', from: f, to: f, start: i * 0.1, dur: 0.16, vol: 0.09 })
      );
    },
    // Kode salah: dua nada turun, lembut (ga bikin kesel).
    wrong() {
      tone({ type: 'triangle', from: 280, to: 240, dur: 0.14, vol: 0.18 });
      tone({ type: 'triangle', from: 220, to: 160, start: 0.13, dur: 0.22, vol: 0.18 });
    },
  };
})();