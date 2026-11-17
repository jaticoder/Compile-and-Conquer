// Pilihan bahasa: C++ atau Python. Disimpan di localStorage.
// Dimuat sebelum game.js. Kalau Python dipilih, isi LEVELS dan LESSONS
// ditukar dengan versi Python, jadi sisa kode game ga perlu tau bedanya.
// Ganti bahasa = simpan pilihan lalu muat ulang halaman (paling aman).

const LANGS = {
  cpp: { label: 'C++', judgeId: 54, start: '#include' },
  python: { label: 'Python', judgeId: 71, start: 'baris pertama' },
};

const Lang = (() => {
  const KEY = 'compile-and-conquer-lang';
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

  function set(next) {
    if (!LANGS[next] || next === cur) return;
    try { localStorage.setItem(KEY, next); } catch (err) { /* abaikan */ }
    location.reload();
  }

  return { current: () => cur, info: () => LANGS[cur], set };
})();

// Tampilan: tombol pilihan di lobby + teks yang nyebut nama bahasa.
(() => {
  const info = Lang.info();
  document.title = `Compile & Conquer: ${info.label}`;
  const tag = document.querySelector('.lobby-tag');
  if (tag) tag.textContent = `Belajar ${info.label} sambil ngalahin boss`;
  const note = document.querySelector('.quest .note');
  if (note) {
    note.textContent = '';
    note.append('Panduan cuma nunjukin baris berikutnya. Ketik sendiri semuanya, dari ');
    const code = document.createElement('code');
    code.textContent = info.start;
    note.append(code, '.');
  }
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === Lang.current()));
    btn.addEventListener('click', () => {
      if (typeof Sound !== 'undefined') Sound.click();
      Lang.set(btn.dataset.lang);
    });
  });
})();