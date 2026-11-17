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
  let lastType = 0;

  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { /* abaikan */ }

  // ---------- Mixer: volume musik dan efek terpisah ----------
  // Jalur suara: musik -> musicBus \
  //              efek  -> sfxBus   -> pembatas -> speaker
  // Pembatas puncak (soft clipper) nahan suara di volume tinggi biar ga pecah.
  // Di posisi 70 (bawaan) jalurnya persis sama kayak sebelum ada slider.
  // Slider 0-100. Posisi 70 = loudness bawaan; di atas 70 dikeraskan, di bawahnya
  // dikecilin (kurva kuadrat biar enak di telinga).
  const VOL_KEYS = { music: 'compile-and-conquer-music-vol', sfx: 'compile-and-conquer-sfx-vol' };
  const VOL_DEFAULT = 70;
  const vol = { music: VOL_DEFAULT, sfx: VOL_DEFAULT };
  Object.keys(VOL_KEYS).forEach((kind) => {
    try {
      const saved = parseInt(localStorage.getItem(VOL_KEYS[kind]), 10);
      if (saved >= 0 && saved <= 100) vol[kind] = saved;
    } catch (err) { /* abaikan */ }
  });
  const gainFor = (v) => Math.pow(v / VOL_DEFAULT, 2);

  let sfxBus = null;
  let musicBus = null;

  // Pembatas puncak: lurus (ga mengubah suara sama sekali) sampai amplitudo 0,8,
  // baru di atasnya dilengkungkan pelan ke 1,0. Sengaja BUKAN DynamicsCompressor:
  // node itu nambah gain otomatis, jadi suara jadi lebih keras walau belum mentok.
  function limiterCurve() {
    const size = 4096;
    const curve = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const x = (i / (size - 1)) * 2 - 1;
      const a = Math.abs(x);
      curve[i] = a <= 0.8 ? x : Math.sign(x) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
    }
    return curve;
  }

  function buildGraph(ac) {
    const limiter = ac.createWaveShaper();
    limiter.curve = limiterCurve();
    limiter.oversample = 'none';
    limiter.connect(ac.destination);

    sfxBus = ac.createGain();
    sfxBus.gain.value = gainFor(vol.sfx);
    sfxBus.connect(limiter);
    musicBus = ac.createGain();
    musicBus.gain.value = gainFor(vol.music);
    musicBus.connect(limiter);
  }

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      buildGraph(ctx);
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
  // Waktu efek suara terakhir. Dipakai pendengar klik global di bawah biar
  // tombol yang udah punya suara sendiri ga dobel bunyi.
  let lastSfx = 0;

  function tone({ type = 'square', from, to = from, start = 0, dur = 0.15, vol = 0.12 }) {
    const ac = muted ? null : audio();
    if (!ac) return;
    lastSfx = performance.now();
    const t = ac.currentTime + start;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Desis/ledakan: noise yang disaring, frekuensinya turun.
  function burst({ start = 0, dur = 0.3, from = 2400, to = 200, vol = 0.2 }) {
    const ac = muted ? null : audio();
    if (!ac) return;
    lastSfx = performance.now();
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
    src.connect(filter).connect(gain).connect(sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // ---------- Musik latar ----------
  // Chiptune santai ala game petualangan 8-bit: melodi ceria yang tersusun
  // (8 bar, diulang), bass yang memantul, dan drum sangat ringan. Semua nada
  // mayor, volumenya pelan, dan dibikin lewat Web Audio, jadi tetap ga ada
  // file audio. Musik punya tombol sendiri (terpisah dari efek suara).
  //
  // Satu lagu dipakai di semua tier, tapi nadanya dipindah ke kunci lain dan
  // warna suara leadnya beda: Basic cerah, Medium lebih tipis dan lincah,
  // Expert sedikit lebih berani.

  const MUSIC_KEY = 'compile-and-conquer-music-mute';
  let musicMuted = false;
  try { musicMuted = localStorage.getItem(MUSIC_KEY) === '1'; } catch (err) { /* abaikan */ }

  const BPM = 104;
  const EIGHTH = 60 / BPM / 2;       // satu not 1/8, dalam detik
  const LOOKAHEAD = 0.3;             // jadwalin nada sejauh ini ke depan
  const MUSIC_LEVEL = 0.8;           // volume akhir musik (0 sampai 1)
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // Urutan chord 8 bar: root = jarak dari nada dasar (semiton), m = minor.
  // Dalam kunci C mayor: C  G  Am  F  |  F  G  C  G
  const CHORDS = [
    { root: 0 }, { root: 7 }, { root: 9, m: true }, { root: 5 },
    { root: 5 }, { root: 7 }, { root: 0 }, { root: 7 },
  ];

  // Melodi dalam kunci C. Tiap bar = daftar [langkah 0-7, nada MIDI, panjang dalam 1/8].
  const MELODY = [
    [[0, 76, 1], [1, 79, 1], [2, 84, 2], [4, 83, 1], [5, 79, 1], [6, 76, 2]],
    [[0, 74, 1], [1, 79, 1], [2, 83, 2], [4, 81, 1], [5, 79, 1], [6, 74, 2]],
    [[0, 72, 1], [1, 76, 1], [2, 81, 2], [4, 79, 1], [5, 76, 1], [6, 72, 2]],
    [[0, 69, 1], [1, 72, 1], [2, 77, 2], [4, 76, 1], [5, 74, 1], [6, 72, 2]],
    [[0, 77, 2], [2, 81, 1], [3, 79, 1], [4, 77, 2], [6, 76, 2]],
    [[0, 74, 2], [2, 79, 1], [3, 81, 1], [4, 83, 2], [6, 79, 2]],
    [[0, 76, 1], [1, 76, 1], [2, 79, 1], [3, 84, 1], [4, 83, 3]],
    [[0, 81, 1], [1, 79, 1], [2, 74, 1], [4, 71, 1], [5, 74, 1], [6, 79, 2]],
  ];

  // tonic = geser nada (semiton), pulse = lebar gelombang lead (makin kecil makin tipis).
  const MOODS = {
    basic: { tonic: 0, pulse: 0.25 },     // C mayor
    medium: { tonic: -5, pulse: 0.125 },  // G mayor
    expert: { tonic: 2, pulse: 0.5 },     // D mayor
  };

  let mus = null;          // graf audio musik (dibuat sekali)
  let musicTimer = null;
  let musicRunning = false;
  let nextTime = 0;
  let stepCount = 0;
  let mood = 'basic';
  let pendingMood = 'basic';
  let autoSuspended = false;

  // Gelombang pulsa (suara khas chip game lama).
  function pulseWave(ac, duty) {
    const size = 48;
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    for (let n = 1; n < size; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    return ac.createPeriodicWave(real, imag);
  }

  function buildMusic(ac) {
    const out = ac.createGain();
    out.gain.value = 0;
    const soften = ac.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 3200;
    const bus = ac.createGain();
    bus.connect(soften);
    soften.connect(out);
    out.connect(musicBus);

    // Gema tipis buat lead (tiga not 1/8, cepat habis).
    const echoIn = ac.createGain();
    const echo = ac.createDelay(1.5);
    echo.delayTime.value = EIGHTH * 3;
    const feedback = ac.createGain();
    feedback.gain.value = 0.28;
    const echoTone = ac.createBiquadFilter();
    echoTone.type = 'lowpass';
    echoTone.frequency.value = 2000;
    echoIn.connect(echo);
    echo.connect(echoTone);
    echoTone.connect(feedback);
    feedback.connect(echo);
    echoTone.connect(bus);

    const waves = {};
    Object.values(MOODS).forEach(({ pulse }) => { waves[pulse] = pulseWave(ac, pulse); });
    waves.stab = pulseWave(ac, 0.125);

    return { ac, out, bus, echoIn, waves };
  }

  // Satu nada pendek. `wave` = gelombang pulsa; `echo` = seberapa banyak dikirim ke gema (0 sampai 1).
  function voice({ type = 'triangle', wave = null, freq, start, dur, vol, attack = 0.006, hold = 0.65, echo = 0 }) {
    const ac = mus.ac;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const holdAt = start + Math.min(dur * 0.8, Math.max(attack + 0.02, Math.min(0.12, dur * 0.4)));
    if (wave) osc.setPeriodicWave(wave); else osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start + attack);
    gain.gain.exponentialRampToValueAtTime(vol * hold, holdAt);
    gain.gain.setValueAtTime(vol * hold, start + Math.max(attack + 0.02, dur - 0.04));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(mus.bus);
    if (echo > 0) {
      const send = mus.ac.createGain();
      send.gain.value = echo;
      gain.connect(send);
      send.connect(mus.echoIn);
    }
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function kick(t) {
    const ac = mus.ac;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.1);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain).connect(mus.bus);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Desis pendek buat tik snare dan hi-hat.
  function tick(t, { type, freq, vol, dur }) {
    const ac = mus.ac;
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    src.buffer = noise(ac);
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(mus.bus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function playStep(t) {
    const step = stepCount % 8;
    const bar = Math.floor(stepCount / 8) % CHORDS.length;
    // Ganti suasana cuma di awal putaran, biar lagunya ga kepotong di tengah frasa.
    if (bar === 0 && step === 0) mood = pendingMood;
    const { tonic, pulse } = MOODS[mood];
    const chord = CHORDS[bar];
    const root = 60 + tonic + chord.root;                       // root chord di oktaf tengah
    const triad = [root, root + (chord.m ? 3 : 4), root + 7];
    const bassRoot = root - 12;
    const e = EIGHTH;

    // Melodi
    const note = MELODY[bar].find((n) => n[0] === step);
    if (note) {
      voice({ wave: mus.waves[pulse], freq: midi(note[1] + tonic), start: t, dur: note[2] * e * 0.92, vol: 0.022, hold: 0.7, echo: 0.28 });
    }

    // Bass memantul: root, root, kelima, root
    if (step === 0) voice({ freq: midi(bassRoot), start: t, dur: e * 1.7, vol: 0.075 });
    if (step === 2) voice({ freq: midi(bassRoot + 12), start: t, dur: e * 0.9, vol: 0.05 });
    if (step === 4) voice({ freq: midi(bassRoot + 7), start: t, dur: e * 1.7, vol: 0.07 });
    if (step === 6) voice({ freq: midi(bassRoot + 12), start: t, dur: e * 0.9, vol: 0.05 });

    // Chord pendek di ketukan lemah (langkah 3 dan 7), kasih rasa "melompat".
    if (step === 3 || step === 7) {
      triad.forEach((n) => voice({ wave: mus.waves.stab, freq: midi(n), start: t, dur: e * 0.7, vol: 0.007, hold: 0.5 }));
    }

    // Drum sangat ringan
    if (step === 0 || step === 4) kick(t);
    if (step === 2 || step === 6) tick(t, { type: 'bandpass', freq: 2200, vol: 0.022, dur: 0.06 });
    if (step % 2) tick(t, { type: 'highpass', freq: 8000, vol: 0.01, dur: 0.035 });
  }

  function musicTick() {
    if (!musicRunning || !mus) return;
    const now = mus.ac.currentTime;
    // Ketinggalan jauh (misal tab sempat di-throttle): jangan kejar, mulai lagi dari sekarang.
    if (nextTime < now - 0.4) nextTime = now + 0.05;
    while (nextTime < now + LOOKAHEAD) {
      playStep(nextTime);
      nextTime += EIGHTH;
      stepCount++;
    }
  }

  function startMusic() {
    if (musicMuted || musicRunning) return;
    const ac = audio();
    if (!ac) return;
    if (!mus || mus.ac !== ac) mus = buildMusic(ac);
    musicRunning = true;
    const now = ac.currentTime;
    mus.out.gain.cancelScheduledValues(now);
    mus.out.gain.setValueAtTime(mus.out.gain.value, now);
    mus.out.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + 2.5);
    nextTime = now + 0.1;
    stepCount = 0;
    mood = pendingMood;
    musicTimer = setInterval(musicTick, 90);
  }

  function stopMusic() {
    if (!musicRunning) return;
    musicRunning = false;
    clearInterval(musicTimer);
    if (mus) {
      const now = mus.ac.currentTime;
      mus.out.gain.cancelScheduledValues(now);
      mus.out.gain.setValueAtTime(mus.out.gain.value, now);
      mus.out.gain.linearRampToValueAtTime(0, now + 0.4);
    }
  }

  // Tab disembunyiin atau HP dikunci: hentikan audio biar hemat baterai.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      if (ctx.state === 'running') { autoSuspended = true; ctx.suspend(); }
    } else if (autoSuspended) {
      autoSuspended = false;
      ctx.resume();
    }
  });

  return {
    // Dipanggil dari klik user biar browser ngizinin suara.
    unlock() {
      if (!muted) audio();
      startMusic();
    },
    // Volume 0-100, disimpan. Berlaku langsung walau lagi dimainkan.
    getVolume: (kind) => vol[kind],
    setVolume(kind, value) {
      if (!(kind in vol)) return;
      vol[kind] = Math.max(0, Math.min(100, Math.round(value)));
      try { localStorage.setItem(VOL_KEYS[kind], String(vol[kind])); } catch (err) { /* abaikan */ }
      const bus = kind === 'music' ? musicBus : sfxBus;
      if (bus) bus.gain.setTargetAtTime(gainFor(vol[kind]), bus.context.currentTime, 0.03);
    },

    isMuted: () => muted,
    setMuted(value) {
      muted = value;
      try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch (err) { /* abaikan */ }
      if (!muted) {
        audio();
        tone({ from: 660, to: 990, dur: 0.1, vol: 0.1 });
      }
    },

    // Musik latar.
    startMusic,
    isMusicMuted: () => musicMuted,
    setMusicMuted(value) {
      musicMuted = value;
      try { localStorage.setItem(MUSIC_KEY, value ? '1' : '0'); } catch (err) { /* abaikan */ }
      if (value) stopMusic();
      else startMusic();
    },
    // Ganti suasana musik sesuai tier ('basic' | 'medium' | 'expert'); berlaku di awal bar berikutnya.
    setMood(tier) { if (MOODS[tier]) pendingMood = tier; },

    // Umur efek suara terakhir (ms).
    sinceLast: () => performance.now() - lastSfx,
    // Tombol simbol di bawah editor: tik lebih pendek dan tinggi.
    key() {
      const r = 0.94 + Math.random() * 0.12;
      burst({ dur: 0.018, from: 5200, to: 2400, vol: 0.07 });
      tone({ type: 'square', from: 1250 * r, to: 900 * r, dur: 0.035, vol: 0.045 });
    },
    // Tombol utama (Jalankan, Main, Mulai): "ba-ding" kayak ngambil koin.
    confirm() {
      burst({ dur: 0.02, from: 6000, to: 3000, vol: 0.06 });
      tone({ type: 'triangle', from: 260, to: 130, dur: 0.07, vol: 0.2 });
      tone({ type: 'square', from: 988, to: 988, dur: 0.07, vol: 0.07 });
      tone({ type: 'square', from: 1319, to: 1319, start: 0.065, dur: 0.24, vol: 0.07 });
    },
    // Klik tombol menu.
    // Tombol biasa: ketukan "pop" (badan rendah + percikan tinggi + klik tipis).
    // Nadanya digeser dikit tiap kali biar ga membosankan.
    click() {
      const r = 0.96 + Math.random() * 0.08;
      burst({ dur: 0.02, from: 6000, to: 3000, vol: 0.05 });
      tone({ type: 'triangle', from: 320 * r, to: 150 * r, dur: 0.07, vol: 0.2 });
      tone({ type: 'square', from: 880 * r, to: 1320 * r, dur: 0.05, vol: 0.055 });
    },
    // Tirai transisi menyapu layar.
    whoosh() { burst({ dur: 0.5, from: 5000, to: 400, vol: 0.12 }); },
    // Langkah kaki hero.
    step() { tone({ type: 'square', from: 130, to: 70, dur: 0.05, vol: 0.05 }); },
    // Boss mendarat.
    land() {
      tone({ type: 'sine', from: 150, to: 55, dur: 0.2, vol: 0.22 });
      burst({ dur: 0.16, from: 1800, to: 200, vol: 0.1 });
    },
    // Gulungan kertas terbuka.
    paper() {
      burst({ dur: 0.28, from: 4200, to: 1200, vol: 0.08 });
      tone({ type: 'triangle', from: 400, to: 640, dur: 0.14, vol: 0.06 });
    },

    // Gulungan materi terbuka: kertas + ting naik yang hangat.
    lessonOpen() {
      burst({ dur: 0.3, from: 4200, to: 1200, vol: 0.08 });
      [523, 659, 784].forEach((f, i) =>
        tone({ type: 'triangle', from: f, to: f, start: 0.05 + i * 0.07, dur: 0.16, vol: 0.09 })
      );
    },
    // Ganti slide: kertas dibalik. `back` = mundur (nadanya turun).
    page(back) {
      burst({ dur: 0.12, from: 5200, to: 1800, vol: 0.07 });
      tone({ type: 'triangle', from: back ? 520 : 400, to: back ? 380 : 600, dur: 0.09, vol: 0.06 });
    },
    // Ketuk bagian kode di materi: blip kecil.
    tip() {
      tone({ type: 'square', from: 880, to: 1320, dur: 0.06, vol: 0.05 });
      tone({ type: 'triangle', from: 1320, to: 1320, start: 0.05, dur: 0.08, vol: 0.05 });
    },
    // Materi selesai: fanfare pendek.
    lessonDone() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone({ type: 'square', from: f, to: f, start: i * 0.07, dur: 0.12, vol: 0.07 })
      );
    },

    // ----- Efek ngetik -----
    // Tik pendek, nadanya acak sedikit biar ga monoton. Dibatasi biar ga numpuk.
    type() {
      const now = performance.now();
      if (now - lastType < 22) return;
      lastType = now;
      tone({ type: 'square', from: 900 + Math.random() * 500, to: 560 + Math.random() * 160, dur: 0.035, vol: 0.03 });
    },
    typeBack() { tone({ type: 'triangle', from: 320, to: 190, dur: 0.045, vol: 0.05 }); },
    typeEnter() {
      tone({ type: 'square', from: 620, to: 880, dur: 0.06, vol: 0.045 });
      burst({ dur: 0.05, from: 5000, to: 1500, vol: 0.03 });
    },
    // Satu baris persis sama kayak panduan, Enter ditekan: ting dua nada.
    lineDone() {
      tone({ type: 'triangle', from: 784, to: 784, dur: 0.1, vol: 0.1 });
      tone({ type: 'triangle', from: 1175, to: 1175, start: 0.08, dur: 0.16, vol: 0.1 });
    },
    // Tonggak combo: arpeggio naik, makin panjang di level tinggi.
    combo(level) {
      [523, 659, 784, 1047, 1319].slice(0, 3 + Math.min(level, 2)).forEach((f, i) =>
        tone({ type: 'square', from: f, to: f, start: i * 0.055, dur: 0.1, vol: 0.07 })
      );
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

// Browser baru ngizinin suara setelah user nyentuh layar. Sentuhan pertama
// di mana pun (menu, pengaturan, dst.) langsung nyalain musik.
['pointerup', 'keydown'].forEach((type) => {
  window.addEventListener(type, () => Sound.startMusic(), { once: true, passive: true });
});

// Semua tombol dapat suara. Pendengar ini jalan setelah pendengar tombolnya
// sendiri, jadi kalau tombol itu udah bunyi (whoosh, kertas, halaman, dst.)
// ga ditambah bunyi klik lagi.
document.addEventListener('click', (event) => {
  const target = event.target.closest && event.target.closest('button, a.btn, label.toggle');
  if (!target || target.disabled) return;
  if (Sound.sinceLast() < 90) return;
  if (target.classList.contains('key')) Sound.key();
  else if (target.matches('.btn:not(.ghost)')) Sound.confirm();
  else Sound.click();
});