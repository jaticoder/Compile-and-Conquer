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
  // Tombol simbol cepat buat HP (susah nyari simbol di keyboard biasa).
  const QUICK_KEYS = [
    ['Tab', INDENT], ['{', '{'], ['}', '}'], ['(', '('], [')', ')'], [';', ';'],
    ['"', '"'], ['<<', ' << '], ['<', '<'], ['>', '>'], ['#', '#'],
    ['*', '*'], ['=', ' = '], ['+', '+'], ['[', '['], [']', ']'],
  ];

  let ta = null;      // textarea
  let mirror = null;  // lapisan cermin
  let before = null;  // teks sebelum kursor (transparan)
  let ghost = null;   // teks ghost
  let gutter = null;  // nomor baris
  let ghostLines = [];
  let ghostEnabled = true;
  let runHandler = null;
  let letTabEscape = false;
  let dedenting = false;

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

  function hideGhost() {
    before.textContent = '';
    ghost.textContent = '';
  }

  function refreshGhost() {
    if (!ta) return;

    const value = ta.value;
    const start = ta.selectionStart;
    if (!ghostEnabled || ghostLines.length === 0 || start !== ta.selectionEnd) {
      hideGhost();
      return;
    }

    const lines = value.split('\n');
    const upToCaret = value.slice(0, start);
    const cursorIdx = upToCaret.split('\n').length - 1;
    const lineText = lines[cursorIdx];
    const col = start - (upToCaret.lastIndexOf('\n') + 1);

    // Ghost cuma muncul kalau kursor di ujung baris.
    if (lineText.slice(col).trim() !== '') {
      hideGhost();
      return;
    }

    const beforeCaret = lineText.slice(0, col).trimStart();
    const typed = beforeCaret.trim();
    // Kalau user baru ketik spasi, ghost ga boleh ikut nambah spasi lagi.
    const spaced = /\s$/.test(beforeCaret);
    const missing = missingLines(lines, cursorIdx);

    let hint = null;
    for (const line of missing) {
      let rest = typed === '' ? line : remainderAfter(line, typed);
      if (rest && spaced) rest = rest.replace(/^ +/, '');
      if (rest) {
        hint = rest;
        break;
      }
    }

    if (!hint) {
      hideGhost();
      return;
    }

    before.textContent = upToCaret;
    ghost.textContent = hint;
    syncScroll();
  }

  function updateGutter() {
    const count = ta.value.split('\n').length;
    let nums = '';
    for (let n = 1; n <= count; n++) nums += n + (n < count ? '\n' : '');
    gutter.textContent = nums;
  }

  function syncScroll() {
    mirror.scrollTop = ta.scrollTop;
    mirror.scrollLeft = ta.scrollLeft;
    gutter.scrollTop = ta.scrollTop;
  }

  function onChange() {
    updateGutter();
    refreshGhost();
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

  // Enter: lanjutin indent baris sebelumnya. Habis "{" tambah satu level.
  // Pakai beforeinput biar jalan juga di keyboard HP.
  function handleEnter(event) {
    const value = ta.value;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const indent = (value.slice(lineStart, start).match(/^[ \t]*/) || [''])[0];
    const prev = value[start - 1];
    const next = value[ta.selectionEnd];

    event.preventDefault();
    if (prev === '{' && next === '}') {
      insert('\n' + indent + INDENT + '\n' + indent);
      const caret = start + 1 + indent.length + INDENT.length;
      ta.setSelectionRange(caret, caret);
    } else {
      insert('\n' + indent + (prev === '{' ? INDENT : ''));
    }
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
    QUICK_KEYS.forEach(([label, text]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'key';
      btn.textContent = label;
      btn.setAttribute('aria-label', `Sisipkan ${label}`);
      // pointerdown + preventDefault: fokus (dan keyboard HP) tetap di editor.
      btn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        insert(text);
      });
      // Lewat keyboard (Enter/Space) event click-nya detail = 0.
      btn.addEventListener('click', (event) => {
        if (event.detail === 0) insert(text);
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
          <pre class="ed-mirror" aria-hidden="true"><span class="ed-before"></span><span class="ed-ghost"></span></pre>
          <textarea class="ed-input" wrap="off" spellcheck="false" autocomplete="off"
            autocapitalize="off" autocorrect="off" enterkeyhint="enter"
            aria-label="Editor kode C++"></textarea>
        </div>
      </div>`;

    gutter = host.querySelector('.ed-gutter');
    mirror = host.querySelector('.ed-mirror');
    before = host.querySelector('.ed-before');
    ghost = host.querySelector('.ed-ghost');
    ta = host.querySelector('.ed-input');

    ta.addEventListener('input', onChange);
    ta.addEventListener('scroll', syncScroll);
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
        insert(INDENT);
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
  };
})();