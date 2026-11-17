// Pilihan bahasa: C++ atau Python. Disimpan di localStorage.
// Dimuat sebelum game.js. Kalau Python dipilih, isi LEVELS dan LESSONS
// ditukar dengan versi Python, jadi sisa kode game ga perlu tau bedanya.
// Ganti bahasa = simpan pilihan lalu muat ulang halaman (paling aman).
// Bahasa dipilih lewat peta bab (lihat game.js).

const LANGS = {
  cpp: { label: 'C++', judgeId: 54, start: '#include' },
  python: { label: 'Python', judgeId: 71, start: 'baris pertama' },
};

// Jumlah level tiap bahasa, dicatat sebelum LEVELS ditukar.
const LANG_LEVEL_COUNT = { cpp: LEVELS.length, python: LEVELS_PY.length };

const Lang = (() => {
  const KEY = 'compile-and-conquer-lang';
  const AUTOSTART_KEY = 'compile-and-conquer-autostart';
  let cur = 'cpp';
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGS[saved]) cur = saved;
  } catch (err) { /* abaikan */ }

  const swap = (target, source) => {
    Object.keys(target).forEach((k) => delete target[k]);
    Object.assign(target, source);
  };
  if (cur === 'python') {
    LEVELS.splice(0, LEVELS.length, ...LEVELS_PY);
    swap(LESSONS, LESSONS_PY);
    swap(LESSON_FOR_CONCEPT, LESSON_FOR_CONCEPT_PY);
  }

  // Key progress. C++ pakai key lama (tanpa akhiran) biar progress lama tetap kebaca.
  const suffix = (lang) => (lang === 'cpp' ? '' : `-${lang}`);
  const levelKey = (lang) => `compile-and-conquer-level${suffix(lang)}`;
  const doneKey = (lang) => `compile-and-conquer-done${suffix(lang)}`;
  // Level tertinggi yang udah kebuka (index 0-based). Dipisah dari levelKey,
  // soalnya levelKey ikut turun kalau pemain balik main level lama.
  const bestKey = (lang) => `compile-and-conquer-best${suffix(lang)}`;

  const readInt = (key) => {
    try {
      const n = parseInt(localStorage.getItem(key), 10);
      return n > 0 ? n : 0;
    } catch (err) {
      return 0;
    }
  };

  // Level tertinggi yang kebuka di satu bahasa. Progress lama (cuma levelKey)
  // ikut kebaca, jadi pemain lama ga kehilangan level yang udah dibuka.
  function unlocked(lang) {
    const last = Math.max((LANG_LEVEL_COUNT[lang] || 1) - 1, 0);
    return Math.min(Math.max(readInt(bestKey(lang)), readInt(levelKey(lang))), last);
  }

  // Simpan level tertinggi sebelum levelKey ditimpa. Dipanggil game.js tiap simpan progress.
  function syncBest() {
    const best = unlocked(cur);
    try { if (best > readInt(bestKey(cur))) localStorage.setItem(bestKey(cur), String(best)); } catch (err) { /* abaikan */ }
  }

  // Buka level `index` (dan semua sebelumnya) di bahasa yang lagi dimainkan.
  function unlock(index) {
    if (index <= unlocked(cur)) return;
    try { localStorage.setItem(bestKey(cur), String(index)); } catch (err) { /* abaikan */ }
  }

  const isFinished = (lang) => {
    try { return localStorage.getItem(doneKey(lang)) === '1'; } catch (err) { return false; }
  };

  // Udah pernah milih bahasa lewat peta bab?
  function chosen() {
    try { return localStorage.getItem(KEY) !== null; } catch (err) { return false; }
  }

  // Ganti bahasa lalu muat ulang. `autostart` = langsung masuk game setelah reload.
  function set(next, autostart) {
    if (!LANGS[next] || next === cur) return;
    try {
      localStorage.setItem(KEY, next);
      if (autostart) sessionStorage.setItem(AUTOSTART_KEY, '1');
    } catch (err) { /* abaikan */ }
    location.reload();
  }

  // Dipanggil sekali pas halaman dimuat: true kalau reload ini dari pilihan di peta bab.
  function consumeAutostart() {
    try {
      const yes = sessionStorage.getItem(AUTOSTART_KEY) === '1';
      sessionStorage.removeItem(AUTOSTART_KEY);
      return yes;
    } catch (err) {
      return false;
    }
  }

  // Progress satu bahasa buat peta bab dan pilih level: berapa boss yang udah kalah.
  function progress(lang) {
    const total = LANG_LEVEL_COUNT[lang] || 0;
    const finished = isFinished(lang);
    const beaten = finished ? total : unlocked(lang);
    return { beaten, total, finished };
  }

  function markDone() {
    try { localStorage.setItem(doneKey(cur), '1'); } catch (err) { /* abaikan */ }
  }

  syncBest(); // pemain lama: catat level yang udah dibuka sebelum levelKey berubah

  return { current: () => cur, info: () => LANGS[cur], set, consumeAutostart, progress, markDone, levelKey, unlocked, unlock, syncBest, chosen };
})();

// Tampilan: teks yang nyebut nama bahasa.
(() => {
  const info = Lang.info();
  document.title = `Compile & Conquer: ${info.label}`;
  const note = document.querySelector('.quest .note');
  if (note) {
    note.textContent = '';
    note.append('Panduan cuma nunjukin baris berikutnya. Ketik sendiri semuanya, dari ');
    const code = document.createElement('code');
    code.textContent = info.start;
    note.append(code, '.');
  }
})();