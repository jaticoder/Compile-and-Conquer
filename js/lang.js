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

  // Progress satu bahasa buat peta bab: berapa boss yang udah kalah.
  function progress(lang) {
    const total = LANG_LEVEL_COUNT[lang] || 0;
    let beaten = 0;
    let finished = false;
    try {
      finished = localStorage.getItem(doneKey(lang)) === '1';
      const saved = parseInt(localStorage.getItem(levelKey(lang)), 10);
      if (saved > 0) beaten = Math.min(saved, total);
    } catch (err) { /* abaikan */ }
    if (finished) beaten = total;
    return { beaten, total, finished };
  }

  function markDone() {
    try { localStorage.setItem(doneKey(cur), '1'); } catch (err) { /* abaikan */ }
  }

  return { current: () => cur, info: () => LANGS[cur], set, consumeAutostart, progress, markDone, levelKey };
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