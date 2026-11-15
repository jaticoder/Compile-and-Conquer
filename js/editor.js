// Editor kode (Monaco, editor-nya VS Code) + ghost text.
//
// Ghost text = teks abu-abu yang nunjukin baris berikutnya yang perlu ditulis.
// Dia cuma panduan: ga bisa diterima pakai Tab, ga bisa diklik. User harus
// ngetik semuanya sendiri, mulai dari #include. Autocomplete bawaan Monaco
// juga dimatiin semua biar tangan user yang kerja, bukan saran otomatis.

const CodeEditor = (() => {
  let editor = null;
  let ghostLines = [];
  let ghostEnabled = true;
  let runHandler = null;
  let ghostNode = null;
  let ghostWidget = null;
  let ghostPos = null;

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
  function missingLines(model, cursorLine) {
    const have = new Map();
    for (let n = 1; n <= model.getLineCount(); n++) {
      if (n === cursorLine) continue;
      const key = compact(model.getLineContent(n));
      if (key) have.set(key, (have.get(key) || 0) + 1);
    }
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

  // Ghost text dipasang lewat content widget Monaco: nempel di posisi kursor,
  // ga ikut jadi isi kode, ga bisa diterima pakai Tab.
  function createGhostWidget() {
    ghostNode = document.createElement('div');
    ghostNode.className = 'ghost-hint';
    ghostWidget = {
      getId: () => 'cc.ghost',
      getDomNode: () => ghostNode,
      getPosition: () =>
        ghostPos
          ? {
              position: ghostPos,
              preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
            }
          : null,
    };
    editor.addContentWidget(ghostWidget);
  }

  function setGhostWidget(pos, text) {
    ghostPos = pos;
    if (pos) {
      const info = editor.getOption(monaco.editor.EditorOption.fontInfo);
      ghostNode.textContent = text;
      ghostNode.style.display = 'block';
      ghostNode.style.fontFamily = info.fontFamily;
      ghostNode.style.fontSize = info.fontSize + 'px';
      ghostNode.style.lineHeight = info.lineHeight + 'px';
      ghostNode.style.paddingLeft = '3px';
    } else {
      ghostNode.style.display = 'none';
    }
    editor.layoutContentWidget(ghostWidget);
  }

  function refreshGhost() {
    if (!editor || !ghostWidget) return;

    const model = editor.getModel();
    const pos = editor.getPosition();
    const selection = editor.getSelection();
    const hide = () => setGhostWidget(null, '');

    if (!ghostEnabled || ghostLines.length === 0 || !pos || !selection || !selection.isEmpty()) {
      hide();
      return;
    }

    const lineText = model.getLineContent(pos.lineNumber);
    const atLineEnd = lineText.substring(pos.column - 1).trim() === '';
    if (!atLineEnd) {
      hide();
      return;
    }

    const before = lineText.substring(0, pos.column - 1).trimStart();
    const typed = before.trim();
    // Kalau user baru ketik spasi, ghost ga boleh ikut nambah spasi lagi.
    const spaced = /\s$/.test(before);
    const missing = missingLines(model, pos.lineNumber);

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
      hide();
      return;
    }

    setGhostWidget({ lineNumber: pos.lineNumber, column: pos.column }, hint);
  }

  function init(containerId) {
    return new Promise((resolve, reject) => {
      require.config({
        paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' },
      });

      require(
        ['vs/editor/editor.main'],
        () => {
          monaco.editor.defineTheme('compile-and-conquer', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
              'editor.background': '#15131f',
              'editor.lineHighlightBackground': '#1e1b2d',
              'editorLineNumber.foreground': '#5b5878',
              'editorLineNumber.activeForeground': '#f3e6c9',
              'editorCursor.foreground': '#f5c22e',
              'editorGutter.background': '#15131f',
            },
          });

          editor = monaco.editor.create(document.getElementById(containerId), {
            value: '',
            language: 'cpp',
            theme: 'compile-and-conquer',
            fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
            fontSize: 15,
            tabSize: 4,
            insertSpaces: true,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            cursorWidth: 3,

            // Semua bantuan otomatis dimatiin: user ngetik sendiri.
            inlineSuggest: { enabled: false },
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            wordBasedSuggestions: 'off',
            snippetSuggestions: 'none',
            acceptSuggestionOnEnter: 'off',
            acceptSuggestionOnCommitCharacter: false,
            tabCompletion: 'off',
            parameterHints: { enabled: false },
            hover: { enabled: false },
            autoClosingBrackets: 'never',
            autoClosingQuotes: 'never',
            autoSurround: 'never',
            autoClosingOvertype: 'never',
          });

          createGhostWidget();

          editor.onDidChangeModelContent(refreshGhost);
          editor.onDidChangeCursorPosition(refreshGhost);

          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            if (runHandler) runHandler();
          });

          resolve();
        },
        reject
      );
    });
  }

  // Editor mulai kosong (atau kode awal kalau level-nya ngasih). Kursor di ujung.
  function setCode(code) {
    editor.setValue(code);
    const lastLine = editor.getModel().getLineCount();
    editor.setPosition({
      lineNumber: lastLine,
      column: editor.getModel().getLineMaxColumn(lastLine),
    });
    // Jangan auto-fokus di HP, biar keyboard ga muncul sendiri.
    if (window.matchMedia('(pointer: fine)').matches) editor.focus();
    refreshGhost();
  }

  return {
    init,
    setCode,
    getCode: () => editor.getValue(),
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