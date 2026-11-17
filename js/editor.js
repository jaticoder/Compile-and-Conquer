// Editor kode ringan buatan sendiri (textarea + lapisan ghost text).
//
// Kenapa bukan Monaco: Monaco berat dan sering bermasalah di browser HP.
// Textarea asli ngasih keyboard HP, kursor, dan seleksi yang normal.
//
// Ghost text = teks abu-abu yang nunjukin baris berikutnya yang perlu ditulis.
// Dia cuma panduan: ga bisa diterima pakai Tab, ga bisa diklik. User harus
// ngetik semuanya sendiri, mulai dari #include.
//
// Cara kerja: di belakang textarea ada <pre> "cermin" yang isinya teks
// sebelum kursor (transparan) + ghost text. Posisi ghost jadi pas di kursor.

const CodeEditor = (() => {
  const INDENT = '    ';
  // Batas indent: 4 level. Tanpa batas, tombol Tab yang dipencet berkali-kali
  // (apalagi ditambah Enter yang nyontek indent baris atasnya) bikin teks
  // terdorong jauh ke kanan sampai keluar layar HP, kelihatan kayak "hilang".
  const MAX_INDENT = INDENT.length * 4;

  // Tombol simbol cepat buat HP (susah nyari simbol di keyboard biasa).
  // Isi kedua bisa teks yang disisipkan, atau fungsi buat aksi khusus.
  const CPP_KEYS = [
    ['Tab', () => insertIndent()], ['{', '{'], ['}', '}'], ['(', '('], [')', ')'], [';', ';'],
    ['"', '"'], ['<<', ' << '], ['<', '<'], ['>', '>'], ['<=', ' <= '], ['>=', ' >= '],
    ['==', ' == '], ['++', '++'], ['#', '#'], ['*', '*'], ['=', ' = '], ['+', '+'], ['[', '['], [']', ']'],
  ];
  const IS_PY = typeof Lang !== 'undefined' && Lang.current() === 'python';
  const PY_KEYS = [
    ['Tab', () => insertIndent()], [':', ':'], ['(', '('], [')', ')'], ['"', '"'],
    ['==', ' == '], ['!=', ' != '], ['>=', ' >= '], ['<=', ' <= '], ['>', '>'], ['<', '<'],
    ['=', ' = '], ['+', ' + '], ['-', ' - '], ['*', ' * '], ['/', ' / '], ['[', '['], [']', ']'], ['#', '#'],
  ];
  const QUICK_KEYS = IS_PY ? PY_KEYS : CPP_KEYS;

  // ---------- Pewarnaan sintaks (gaya VS Code, tanpa warna merah) ----------
  // Teks asli di textarea dibikin transparan, warnanya digambar di lapisan
  // .ed-hl tepat di belakangnya. Palet sengaja tanpa merah, biar kode yang
  // benar ga kelihatan kayak salah.
  const split = (w) => new Set(w.split(' '));
  const HL_LANG = {
    cpp: {
      kw: split('if else for while do return using namespace switch case break continue const new delete class struct public private'),
      types: split('int float double char bool string long short unsigned void auto size_t'),
      consts: split('true false nullptr NULL'),
      std: split('cout cin endl cerr'),
      re: /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|(#[ \t]*[A-Za-z]+(?:[ \t]*<[^>\n]*>?)?)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(<<|>>|<=|>=|==|!=|\+\+|--|&&|\|\||[-+*/%=<>!&|^~?:])/g,
    },
    python: {
      kw: split('if elif else for while in def return import from as class pass break continue and or not is'),
      types: split('int str float bool list dict set tuple'),
      consts: split('True False None'),
      std: split('print'),
      re: /(#[^\n]*)|(\b\B)|("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(==|!=|<=|>=|\*\*|\/\/|[-+*/%=<>!:])/g,
    },
  };
  const escHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function highlight(code) {
    const L = IS_PY ? HL_LANG.python : HL_LANG.cpp;
    const re = L.re;
    re.lastIndex = 0;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(code))) {
      out += escHtml(code.slice(last, m.index));
      last = re.lastIndex;
      const t = m[0];
      if (m[2] !== undefined) {
        // #include <iostream>: kata #include dan nama header beda warna.
        const parts = t.match(/^(#[ \t]*\w+)([ \t]*)(<[^>\n]*>?)?$/);
        out += `<span class="tp">${escHtml(parts[1])}</span>${parts[2]}`;
        if (parts[3]) out += `<span class="ts">${escHtml(parts[3])}</span>`;
        continue;
      }
      let cls = '';
      if (m[1] !== undefined) cls = 'tc';
      else if (m[3] !== undefined) cls = 'ts';
      else if (m[4] !== undefined) cls = 'tn';
      else if (m[6] !== undefined) cls = 'to';
      else if (m[5] !== undefined) {
        if (L.kw.has(t)) cls = 'tk';
        else if (L.consts.has(t)) cls = 'tn';
        else if (L.std.has(t) || /^[ \t]*\(/.test(code.slice(last, last + 40))) cls = 'tf';
        else if (L.types.has(t)) cls = 'tt';
      }
      out += cls ? `<span class="${cls}">${escHtml(t)}</span>` : escHtml(t);
    }
    // Baris kosong di ujung ikut dihitung, biar tinggi gulungannya sama kayak textarea.
    return out + escHtml(code.slice(last)) + '\n ';
  }

  function paintHl() {
    if (hl) hl.innerHTML = highlight(ta.value);
  }


  let ta = null;      // textarea
  let mirror = null;  // lapisan cermin
  let hl = null;      // lapisan warna sintaks
  let before = null;  // teks sebelum kursor (transparan)
  let caretMark = null; // penanda posisi kursor (lebar nol)
  let ghost = null;   // teks ghost
  let measEl = null;  // penanda ukur lebar 1 huruf
  let hintEl = null;  // strip "Lanjutan" di bawah editor (cadangan kalau ghost kepotong)
  let hintDone = null;
  let hintNext = null;
  let hintShown = false;
  let stack = null;   // pembungkus lapisan teks (digeser kalau ghost butuh ruang)
  let shift = 0;      // geseran ke kiri (px)
  let ghostRows = 1;  // jumlah baris yang dipakai ghost (>1 kalau dipatahkan)
  let gutter = null;  // nomor baris
  let ghostLines = [];
  let ghostEnabled = true;
  let runHandler = null;
  let letTabEscape = false;
  let errEl = null;   // pita merah di baris yang error
  let errLine = 0;
  let dedenting = false;

  // ----- Efek ngetik: tik, percikan di kursor, combo, kilau tiap baris benar -----
  const FX_KEY = 'compile-and-conquer-typefx';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPARK_COLORS = ['#f5c22e', '#ffffff', '#2ee6a6', '#ff9f43'];
  const OK_COLORS = ['#6fdc7a', '#ffffff', '#2ee6a6'];
  const MILESTONES = [10, 25, 50, 100];
  let fxOn = true;
  try { fxOn = localStorage.getItem(FX_KEY) !== '0'; } catch (err) { /* abaikan */ }
  let edEl = null;     // elemen .ed (buat variabel --heat)
  let fxLayer = null;  // lapisan percikan
  let comboEl = null;  // lencana combo
  let combo = 0;
  let lastKey = 0;
  let comboTimer = null;
  let okLine = 0;      // baris yang lagi berkilau hijau di nomor baris
  let okTimer = null;

  const compact = (text) => text.replace(/\s+/g, '');

  // Cek apakah `typed` (tanpa spasi) cocok sama awal `expected`.
  // Kalau cocok, balikin sisa teks `expected` yang belum diketik.
  // Spasi diabaikan: "cout<<" tetap cocok sama "cout << ...".
  function remainderAfter(expected, typed) {
    let i = 0;
    for (const ch of compact(typed)) {
      while (i < expected.length && expected[i] === ' ') i++;
      if (expected[i] !== ch) return null;
      i++;
    }
    return expected.slice(i);
  }

  // Berapa karakter `typed` yang masih cocok sama awal `expected`.
  // Dipakai buat milih baris panduan paling mirip kalau user salah ketik.
  function matchLen(expected, typed) {
    let i = 0;
    let n = 0;
    for (const ch of compact(typed)) {
      while (i < expected.length && expected[i] === ' ') i++;
      if (expected[i] !== ch) break;
      i++;
      n++;
    }
    return n;
  }

  // Baris panduan yang belum ada di kode user (kecuali baris tempat kursor).
  function missingLines(lines, cursorIdx) {
    const have = new Map();
    lines.forEach((text, idx) => {
      if (idx === cursorIdx) return;
      const key = compact(text);
      if (key) have.set(key, (have.get(key) || 0) + 1);
    });
    const isInclude = (key) => key.startsWith('#include');

    return ghostLines.filter((line) => {
      const key = compact(line);
      let used = null;
      if ((have.get(key) || 0) > 0) {
        used = key;
      } else if (isInclude(key)) {
        // Header apa pun dianggap cukup: <iostream>, <bits/stdc++.h>, dst.
        used = [...have.keys()].find((k) => isInclude(k) && have.get(k) > 0) || null;
      }
      if (used) {
        have.set(used, have.get(used) - 1);
        return false;
      }
      return true;
    });
  }

  // Isi cermin. `upToCaret` selalu diisi (walau ghost kosong) supaya posisi
  // kursor bisa diukur lewat caretMark.
  function paintMirror(upToCaret, ghostText) {
    before.textContent = upToCaret;
    ghost.textContent = ghostText;
    ghost.classList.remove('wrap');
    ghost.style.width = '';
    ghostRows = 1;
  }

  // Lebar satu huruf (font monospace), diukur dari penanda di lapisan cermin.
  const charWidth = () => measEl.offsetWidth / 10;

  // Strip "Lanjutan": dipakai kalau ghost inline ga muat (kursor udah mepet
  // tepi kanan, atau awal baris kegulung keluar layar). Ghost inline itu teks
  // di luar textarea, jadi ga bisa digulung ke dalam. Strip ini selalu kelihatan.
  function showHint(full, next) {
    hintDone.textContent = full.slice(0, full.length - next.length);
    hintNext.textContent = next;
    hintEl.hidden = false;
    hintShown = true;
    edEl.style.setProperty('--hint-h', hintEl.offsetHeight + 'px');
  }

  function hideHint() {
    if (!hintShown) return;
    hintEl.hidden = true;
    hintShown = false;
    edEl.style.setProperty('--hint-h', '0px');
  }

  // Geser seluruh lapisan teks ke kiri biar ghost di ujung kanan kebagian tempat.
  // (Textarea ga bisa digulung melewati teksnya sendiri, jadi ini triknya.)
  function setShift(px) {
    px = Math.max(0, Math.round(px));
    if (px === shift) return;
    shift = px;
    stack.style.setProperty('--shift', px + 'px');
    stack.style.transform = px ? `translateX(${-px}px)` : '';
  }

  // Tampilkan panduan di kursor. Urutan usaha, dari yang paling rapi:
  //   1. Muat inline: tampil apa adanya.
  //   2. Kurang sedikit: lapisan teks digeser ke kiri (selama kursor tetap kelihatan).
  //   3. Masih kepanjangan: ghost dipatahkan ke baris di bawahnya, tetap abu-abu
  //      inline (cuma kalau kursor di baris terakhir, biar ga numpuk teks lain).
  //   4. Terakhir: strip "Lanjutan" di dasar editor.
  //   full      = baris panduan lengkap
  //   rest      = sisa yang belum diketik (kalau lanjut di baris yang sama)
  //   onNewLine = true kalau panduan ditaruh di baris bawah (user salah ketik)
  function placeHint(upToCaret, full, rest, onNewLine, stripRest, canWrap) {
    paintMirror(upToCaret, onNewLine ? '\n' + full : rest);
    const w = charWidth();
    const room = ta.clientWidth - 6;
    let fits;
    let dx = 0;
    let wrapWidth = 0;

    if (onNewLine) {
      fits = ta.scrollLeft === 0 && full.length * w + 4 <= room;
    } else {
      const caretX = caretMark.offsetLeft - ta.scrollLeft;
      const overflow = caretX + rest.length * w - room;
      if (overflow <= 0) {
        fits = true;
      } else if (caretX - 14 >= overflow) { // kursor tetap kelihatan setelah digeser
        fits = true;
        dx = overflow;
      } else if (canWrap) {
        // Geser secukupnya biar ada ruang minimal ~16 kolom, sisanya dipatahkan.
        fits = true;
        dx = Math.max(0, Math.min(caretX - 14, caretX + Math.min(rest.length, 16) * w - room));
        wrapWidth = room - (caretX - dx);
      } else {
        fits = false;
      }
    }

    if (fits) {
      setShift(dx);
      if (wrapWidth) {
        ghost.classList.add('wrap');
        ghost.style.width = wrapWidth + 'px';
        ghostRows = Math.max(1, Math.round(ghost.offsetHeight / lineHeight()));
      }
      hideHint();
      syncScroll();
      return true;
    }
    // Panduan buat salah ketik cuma referensi: kalau ga muat, ga usah bikin strip.
    if (onNewLine) return false;
    setShift(0);
    paintMirror(upToCaret, '');
    showHint(full, stripRest);
    syncScroll();
    return true;
  }

  // Berapa kolom kosong yang disisakan di kanan kursor waktu belum ada ghost.
  const RESERVE_COLS = 4;

  function refreshGhost() {
    if (!ta) return;

    const value = ta.value;
    const start = ta.selectionStart;
    const upToCaret = value.slice(0, start);
    const lines = value.split('\n');
    const cursorIdx = upToCaret.split('\n').length - 1;
    const lineText = lines[cursorIdx];
    const col = start - (upToCaret.lastIndexOf('\n') + 1);
    const atEnd = lineText.slice(col).trim() === '' && start === ta.selectionEnd;

    // Tanpa ghost: tetap sisakan ruang kosong di kanan kursor (kayak "scroll beyond
    // last column" di VS Code), biar kursor ga nempel di tepi kotak editor.
    const none = () => {
      paintMirror(upToCaret, '');
      hideHint();
      if (!atEnd) { setShift(0); return; }
      const caretX = caretMark.offsetLeft - ta.scrollLeft;
      const overflow = caretX + RESERVE_COLS * charWidth() - (ta.clientWidth - 6);
      setShift(overflow > 0 ? Math.min(overflow, Math.max(0, caretX - 14)) : 0);
    };

    if (!ghostEnabled || ghostLines.length === 0 || start !== ta.selectionEnd) {
      none();
      return;
    }

    // Ghost cuma muncul kalau kursor di ujung baris.
    if (!atEnd) {
      none();
      return;
    }

    const rawBefore = lineText.slice(0, col);
    const beforeCaret = rawBefore.trimStart();
    const typed = beforeCaret.trim();
    // Spasi indent yang udah ada di kiri kursor (diketik user atau disisipin
    // Enter otomatis). Ghost ga boleh ngulang indent itu lagi.
    const leadWs = rawBefore.length - beforeCaret.length;
    // Kalau user baru ketik spasi, ghost ga boleh ikut nambah spasi lagi.
    const spaced = /\s$/.test(rawBefore);
    const missing = missingLines(lines, cursorIdx);

    let match = null;     // baris panduan yang lagi diikuti
    let rest = null;      // sisanya (buat ditampilin inline)
    let restRaw = null;   // sisanya sebelum spasi depan dibuang
    let complete = false; // baris di kursor udah persis sama satu baris panduan
    let completeIdx = -1; // urutan baris panduan yang persis sama itu di `missing`
    let idx = -1;
    for (const line of missing) {
      idx++;
      // Baris kosong (cuma indent): lewati indent panduan sebanyak spasi yang udah ada.
      const left = typed === ''
        ? line.slice(Math.min(leadWs, (line.match(/^ */) || [''])[0].length))
        : remainderAfter(line, typed);
      if (left === '') {
        complete = true;
        if (completeIdx < 0) completeIdx = idx;
      }
      let shown = left;
      if (shown && spaced && typed !== '') shown = shown.replace(/^ +/, '');
      if (shown) {
        match = line;
        restRaw = left;
        rest = shown;
        break;
      }
    }

    if (match) {
      // `full` buat strip: bagian yang udah diketik dibuat redup, sisanya terang.
      placeHint(upToCaret, match, rest, false, restRaw, cursorIdx === lines.length - 1);
      return;
    }

    // Baris ini udah bener dan lengkap: tunjukin baris panduan berikutnya di
    // baris bawahnya (abu-abu, lengkap dengan jorokannya), biar pemain tau
    // harus lanjut. Cuma kalau kursor di baris terakhir.
    if (complete) {
      const next = missing.slice(completeIdx + 1)[0] || missing.find((_, i) => i !== completeIdx);
      if (next && cursorIdx === lines.length - 1 && placeHint(upToCaret, next, '', true, '', false)) return;
      none();
      return;
    }
    // Ga ada baris panduan yang cocok (salah ketik / salah tap simbol).
    // Tampilkan baris panduan paling mirip sebagai referensi, tapi cuma kalau
    // kursor di baris terakhir, biar ga numpuk di atas teks baris lain.
    const onLastLine = cursorIdx === lines.length - 1;
    if (!onLastLine || missing.length === 0) {
      none();
      return;
    }
    let best = missing[0];
    let bestLen = -1;
    for (const line of missing) {
      const n = matchLen(line, typed);
      if (n > bestLen) {
        best = line;
        bestLen = n;
      }
    }
    if (!placeHint(upToCaret, best, '', true, '', false)) none();
  }

  function updateGutter() {
    const count = ta.value.split('\n').length;
    let nums = '';
    for (let n = 1; n <= count; n++) {
      nums += `<span class="ln${n === errLine ? ' err' : ''}${n === okLine ? ' ok' : ''}">${n}</span>`;
    }
    gutter.innerHTML = nums;
  }

  function lineHeight() {
    return parseFloat(getComputedStyle(ta).lineHeight) || 22;
  }

  // Pita merah di belakang teks baris yang error.
  function paintError() {
    if (!errLine) { errEl.style.display = 'none'; return; }
    const lh = lineHeight();
    errEl.style.display = 'block';
    errEl.style.height = lh + 'px';
    errEl.style.top = (12 + (errLine - 1) * lh - ta.scrollTop) + 'px';
  }

  function syncScroll() {
    mirror.scrollTop = ta.scrollTop;
    mirror.scrollLeft = ta.scrollLeft;
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
    gutter.scrollTop = ta.scrollTop;
    paintError();
  }

  // Pastikan kursor selalu kelihatan. Textarea biasanya ngurus ini sendiri,
  // tapi di beberapa browser HP gulungan horizontalnya telat atau meleset
  // setelah teks disisipkan lewat tombol simbol. Posisi kursor diukur dari
  // penanda di lapisan cermin, lalu textarea digulung kalau perlu.
  function revealCaret() {
    if (ta.selectionStart !== ta.selectionEnd) return;

    const lh = lineHeight();
    const x = caretMark.offsetLeft;
    // offsetTop dibulatkan ke awal barisnya (padding atas textarea = 12px).
    const y = 12 + Math.floor((caretMark.offsetTop - 12) / lh) * lh;
    const margin = 28;

    if (x < ta.scrollLeft + margin) {
      ta.scrollLeft = Math.max(0, x - margin);
    } else if (x > ta.scrollLeft + ta.clientWidth - margin) {
      ta.scrollLeft = x - ta.clientWidth + margin;
    }

    // Strip "Lanjutan" nutupin dasar editor: baris kursor harus di atasnya.
    const hintH = (hintShown ? hintEl.offsetHeight : 0) + (ghostRows - 1) * lh;
    if (y < ta.scrollTop) {
      ta.scrollTop = Math.max(0, y - 4);
    } else if (y + lh > ta.scrollTop + ta.clientHeight - hintH) {
      ta.scrollTop = y + lh - ta.clientHeight + hintH + 8;
    }

    syncScroll();
  }

  // ---------- Efek ngetik ----------

  // Posisi kursor relatif ke area teks (diukur dari penanda di lapisan cermin).
  function caretXY() {
    return {
      x: caretMark.offsetLeft - ta.scrollLeft - shift,
      y: caretMark.offsetTop - ta.scrollTop + caretMark.offsetHeight / 2,
    };
  }

  // Kotak-kotak kecil beterbangan dari satu titik. `rise` > 0 naik, < 0 jatuh.
  function sparks(x, y, count, colors, spread, rise) {
    if (reduceMotion || !fxLayer) return;
    for (let i = 0; i < count; i++) {
      if (fxLayer.childElementCount > 36) return; // batas biar ga berat di HP
      const spark = document.createElement('i');
      const size = 3 + Math.floor(Math.random() * 3);
      spark.className = 'ed-spark';
      spark.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]};`;
      fxLayer.appendChild(spark);
      const dx = (Math.random() - 0.5) * spread * 2;
      const dy = -rise * (0.4 + Math.random() * 0.8) + (Math.random() - 0.3) * spread * 0.4;
      const a = spark.animate(
        [{ transform: 'translate(0, 0)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }],
        { duration: 320 + Math.random() * 220, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' }
      );
      a.onfinish = () => spark.remove();
      a.oncancel = () => spark.remove();
    }
  }

  const comboLevel = (n) => (n >= 50 ? 3 : n >= 25 ? 2 : n >= 10 ? 1 : 0);

  function endCombo() {
    combo = 0;
    comboEl.classList.remove('on', 'tick');
    edEl.style.setProperty('--heat', '0');
  }

  // Satu karakter diketik. Balikin true kalau tepat di tonggak combo.
  function bumpCombo() {
    const now = performance.now();
    if (now - lastKey > 1600) combo = 0;
    lastKey = now;
    combo++;
    edEl.style.setProperty('--heat', Math.min(1, combo / 50).toFixed(2));
    if (combo >= 5) {
      comboEl.textContent = `x${combo}`;
      comboEl.dataset.lv = String(comboLevel(combo));
      comboEl.classList.add('on');
      if (!reduceMotion) {
        comboEl.classList.remove('tick');
        void comboEl.offsetWidth;
        comboEl.classList.add('tick');
      }
    }
    clearTimeout(comboTimer);
    comboTimer = setTimeout(endCombo, 1700);
    return MILESTONES.includes(combo) || (combo > 100 && combo % 50 === 0);
  }

  function typingFx(event) {
    if (!fxOn) return;
    const type = event.inputType || '';
    const data = event.data || '';
    const { x, y } = caretXY();

    if (data.includes('\n') || type === 'insertLineBreak' || type === 'insertParagraph') {
      Sound.typeEnter();
      return;
    }
    if (type.startsWith('delete')) {
      Sound.typeBack();
      sparks(x, y, 1, ['#6f6a92'], 5, -8);
      return;
    }
    if (type === 'insertFromPaste' || type === 'insertFromDrop') {
      sparks(x, y, 8, SPARK_COLORS, 22, 14);
      return;
    }

    const milestone = bumpCombo();
    Sound.type();
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (!/^\s*$/.test(data)) sparks(x, y, coarse ? 2 : 3, SPARK_COLORS, 12, 16);
    if (milestone) {
      Sound.combo(comboLevel(combo));
      sparks(x, y, 14, SPARK_COLORS, 36, 30);
    }
  }

  // Baris yang persis sama kayak salah satu baris panduan (spasi diabaikan).
  function isGuideLine(text) {
    const key = compact(text);
    if (key.length < 4) return false;
    return ghostLines.some((line) => {
      const k = compact(line);
      return k === key || (key.startsWith('#include') && k.startsWith('#include'));
    });
  }

  // Enter di baris yang benar: ting, percikan hijau, nomor baris berkilau.
  function lineDone(pos, lineIdx) {
    Sound.lineDone();
    sparks(pos.x, pos.y, 12, OK_COLORS, 30, 22);
    okLine = lineIdx + 1;
    updateGutter();
    clearTimeout(okTimer);
    okTimer = setTimeout(() => { okLine = 0; updateGutter(); }, 900);
  }

  function onChange() {
    paintHl();
    errLine = 0; // user mulai ngedit: tandanya hilang
    paintError();
    updateGutter();
    refreshGhost();
    revealCaret();
    refreshGhost(); // ukur ulang setelah gulungan berubah
  }

  // Sisipkan teks di kursor. execCommand dipakai biar undo (Ctrl+Z) tetap jalan.
  function insert(text) {
    ta.focus();
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (err) { ok = false; }
    if (!ok) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      onChange();
    }
  }

  // Panjang spasi/tab di awal baris tempat kursor berada.
  function leadingWidth() {
    const start = ta.selectionStart;
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    return (ta.value.slice(lineStart).match(/^[ \t]*/) || [''])[0].length;
  }

  // Tab: tambah satu level indent, tapi berhenti di batas MAX_INDENT.
  function insertIndent() {
    ta.focus();
    if (leadingWidth() >= MAX_INDENT) return;
    insert(INDENT);
  }

  // Enter: lanjutin indent baris sebelumnya. Habis "{" tambah satu level.
  // Pakai beforeinput biar jalan juga di keyboard HP.
  function handleEnter(event) {
    const value = ta.value;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const rawIndent = (value.slice(lineStart, start).match(/^[ \t]*/) || [''])[0];
    // Indent yang diwariskan dibatasi, biar ga numpuk tiap kali Enter.
    const indent = rawIndent.slice(0, MAX_INDENT);
    const canDeepen = indent.length + INDENT.length <= MAX_INDENT;
    const prev = value[start - 1];
    const next = value[ta.selectionEnd];

    // Baris yang baru selesai diketik cocok sama panduan? Rayakan setelah Enter.
    const lineIdx = value.slice(0, start).split('\n').length - 1;
    const celebrate = fxOn && isGuideLine(value.slice(lineStart, start));
    const where = celebrate ? caretXY() : null;

    // Python + panduan nyala: jorokan baris baru ngikutin baris panduan berikutnya,
    // jadi else, dedent habis def/for, dst. mendarat di kolom yang bener.
    let guideIndent = null;
    if (IS_PY && ghostEnabled && ghostLines.length) {
      const cur = compact(value.slice(lineStart, start));
      const gi = cur ? ghostLines.findIndex((l) => compact(l) === cur) : -1;
      if (gi >= 0 && gi + 1 < ghostLines.length) {
        guideIndent = (ghostLines[gi + 1].match(/^ */) || [''])[0].slice(0, MAX_INDENT);
      }
    }

    event.preventDefault();
    if (prev === '{' && next === '}') {
      const inner = canDeepen ? INDENT : '';
      insert('\n' + indent + inner + '\n' + indent);
      const caret = start + 1 + indent.length + inner.length;
      ta.setSelectionRange(caret, caret);
    } else {
      insert('\n' + (guideIndent !== null
        ? guideIndent
        : indent + ((prev === '{' || (IS_PY && prev === ':')) && canDeepen ? INDENT : '')));
    }
    if (celebrate) lineDone(where, lineIdx);
  }

  // Ketik "}" di baris yang isinya cuma spasi: mundur satu level indent.
  function handleCloseBrace(event) {
    const start = ta.selectionStart;
    if (start !== ta.selectionEnd) return;
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    const lead = ta.value.slice(lineStart, start);
    if (lead === '' || /\S/.test(lead)) return;
    event.preventDefault();
    const cut = Math.min(INDENT.length, lead.length);
    dedenting = true;
    ta.setSelectionRange(start - cut, start);
    insert('}');
    dedenting = false;
  }

  function buildKeys(keysEl) {
    if (!keysEl) return;
    QUICK_KEYS.forEach(([label, action]) => {
      const run = typeof action === 'function' ? action : () => insert(action);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'key';
      btn.textContent = label;
      btn.setAttribute('aria-label', `Sisipkan ${label}`);
      // pointerdown + preventDefault: fokus (dan keyboard HP) tetap di editor.
      btn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        run();
      });
      // Lewat keyboard (Enter/Space) event click-nya detail = 0.
      btn.addEventListener('click', (event) => {
        if (event.detail === 0) run();
      });
      keysEl.appendChild(btn);
    });
  }

  function init(containerId) {
    const host = document.getElementById(containerId);
    host.innerHTML = `
      <div class="ed">
        <div class="ed-gutter" aria-hidden="true"></div>
        <div class="ed-body">
         <div class="ed-stack">
          <div class="ed-errline" aria-hidden="true"></div>
          <pre class="ed-hl" aria-hidden="true"></pre>
          <pre class="ed-mirror" aria-hidden="true"><span class="ed-before"></span><span class="ed-caret" style="display:inline-block;width:0;height:1em"></span><span class="ed-ghost"></span><span class="ed-meas">MMMMMMMMMM</span></pre>
          <textarea class="ed-input" wrap="off" spellcheck="false" autocomplete="off"
            autocapitalize="off" autocorrect="off" enterkeyhint="enter"
            aria-label="Editor kode"></textarea>
         </div>
          <div class="ed-fx" aria-hidden="true"></div>
          <div class="ed-combo" aria-hidden="true"></div>
          <div class="ed-hint" aria-hidden="true" hidden><span class="ed-hint-label">Lanjutan</span><code><span class="hd"></span><span class="hn"></span></code></div>
        </div>
      </div>`;

    edEl = host.querySelector('.ed');
    fxLayer = host.querySelector('.ed-fx');
    comboEl = host.querySelector('.ed-combo');
    stack = host.querySelector('.ed-stack');
    errEl = host.querySelector('.ed-errline');
    gutter = host.querySelector('.ed-gutter');
    mirror = host.querySelector('.ed-mirror');
    hl = host.querySelector('.ed-hl');
    before = host.querySelector('.ed-before');
    caretMark = host.querySelector('.ed-caret');
    ghost = host.querySelector('.ed-ghost');
    measEl = host.querySelector('.ed-meas');
    hintEl = host.querySelector('.ed-hint');
    hintDone = hintEl.querySelector('.hd');
    hintNext = hintEl.querySelector('.hn');
    ta = host.querySelector('.ed-input');

    ta.addEventListener('input', onChange);
    ta.addEventListener('input', typingFx); // setelah onChange: posisi kursor udah terbaru
    ta.addEventListener('scroll', () => { syncScroll(); refreshGhost(); });
    ta.addEventListener('keyup', refreshGhost);
    ta.addEventListener('click', refreshGhost);
    ta.addEventListener('focus', refreshGhost);
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === ta) refreshGhost();
    });

    ta.addEventListener('beforeinput', (event) => {
      if (event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph') {
        handleEnter(event);
      } else if (event.inputType === 'insertText' && event.data === '}' && !dedenting) {
        handleCloseBrace(event);
      }
    });

    ta.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (runHandler) runHandler();
        return;
      }
      // Tab = 4 spasi. Tekan Esc dulu kalau mau Tab buat pindah fokus (aksesibilitas).
      if (event.key === 'Escape') { letTabEscape = true; return; }
      if (event.key === 'Tab' && !event.shiftKey && !letTabEscape) {
        event.preventDefault();
        insertIndent();
        return;
      }
      if (event.key !== 'Tab') letTabEscape = false;
    });

    buildKeys(document.getElementById('keys'));
    return Promise.resolve();
  }

  // Editor mulai kosong (atau kode awal kalau level-nya ngasih). Kursor di ujung.
  function setCode(code) {
    ta.value = code;
    ta.setSelectionRange(code.length, code.length);
    ta.scrollTop = 0;
    ta.scrollLeft = 0;
    // Jangan auto-fokus di HP, biar keyboard ga muncul sendiri.
    if (window.matchMedia('(pointer: fine)').matches) ta.focus();
    onChange();
  }

  return {
    init,
    setCode,
    getCode: () => ta.value,
    // Tandai baris yang error (nomor 1-based) dan gulung biar kelihatan.
    markError(line) {
      errLine = line;
      updateGutter();
      if (line) {
        const lh = lineHeight();
        const top = (line - 1) * lh;
        if (top < ta.scrollTop || top > ta.scrollTop + ta.clientHeight - lh * 3) {
          ta.scrollTop = Math.max(0, top - lh * 2);
        }
      }
      syncScroll();
    },
    setGhost(lines) {
      ghostLines = lines || [];
      refreshGhost();
    },
    setGhostEnabled(enabled) {
      ghostEnabled = enabled;
      refreshGhost();
    },
    onRun(handler) {
      runHandler = handler;
    },
    // Efek ngetik (suara tik, percikan, combo) bisa dimatiin. Disimpan.
    isTypingFx: () => fxOn,
    setTypingFx(on) {
      fxOn = on;
      try { localStorage.setItem(FX_KEY, on ? '1' : '0'); } catch (err) { /* abaikan */ }
      if (!on && edEl) endCombo();
    },
  };
})();