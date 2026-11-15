// Editor kode (Monaco, editor-nya VS Code) + ghost text.
//
// Ghost text = teks abu-abu yang nyaranin baris kode. User tekan Tab buat
// nerima, atau lanjut ngetik sendiri. Autocomplete biasa sengaja dimatiin
// biar user tetep belajar ngetik, bukan cuma milih saran.

const CodeEditor = (() => {
  let editor = null;
  let ghostLines = [];
  let ghostEnabled = true;
  let runHandler = null;

  function registerGhostProvider() {
    monaco.languages.registerInlineCompletionsProvider('cpp', {
      provideInlineCompletions(model, position) {
        if (!ghostEnabled || ghostLines.length === 0) return { items: [] };

        const lineText = model.getLineContent(position.lineNumber);
        const before = lineText.substring(0, position.column - 1);
        const after = lineText.substring(position.column - 1);

        // Cuma muncul kalau kursor ada di akhir baris.
        if (after.trim() !== '') return { items: [] };

        const typed = before.trimStart();
        const indent = before.length - typed.length;
        const wholeCode = model.getValue();

        // Ambil hint yang belum ada di kode dan cocok sama yang lagi diketik.
        const next = ghostLines.find((g) => !wholeCode.includes(g) && g.startsWith(typed));
        if (!next) return { items: [] };

        return {
          items: [
            {
              insertText: next,
              range: new monaco.Range(
                position.lineNumber,
                indent + 1,
                position.lineNumber,
                position.column
              ),
            },
          ],
        };
      },
      freeInlineCompletions() {},
      disposeInlineCompletions() {},
    });
  }

  function init(containerId) {
    return new Promise((resolve, reject) => {
      require.config({
        paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' },
      });

      require(
        ['vs/editor/editor.main'],
        () => {
          editor = monaco.editor.create(document.getElementById(containerId), {
            value: '',
            language: 'cpp',
            theme: 'vs-dark',
            fontSize: 15,
            tabSize: 4,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            inlineSuggest: { enabled: true },
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            wordBasedSuggestions: 'off',
          });

          registerGhostProvider();

          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            if (runHandler) runHandler();
          });

          resolve();
        },
        reject
      );
    });
  }

  function triggerGhost() {
    if (!editor) return;
    setTimeout(() => editor.trigger('cc', 'editor.action.inlineSuggest.trigger', {}), 60);
  }

  // Kursor otomatis ke baris kosong di bawah komentar "tulis kode kamu".
  function setCode(code) {
    editor.setValue(code);
    const lines = code.split('\n');
    const marker = lines.findIndex((l) => l.includes('// tulis'));
    if (marker !== -1) {
      const target = marker + 2;
      editor.setPosition({ lineNumber: target, column: lines[target - 1].length + 1 });
      editor.revealLineInCenter(target);
    }
    // Jangan auto-fokus di HP, biar keyboard ga muncul sendiri.
    if (window.matchMedia('(pointer: fine)').matches) editor.focus();
    triggerGhost();
  }

  return {
    init,
    setCode,
    getCode: () => editor.getValue(),
    setGhost(lines) {
      ghostLines = lines || [];
    },
    setGhostEnabled(enabled) {
      ghostEnabled = enabled;
      if (!editor) return;
      if (enabled) triggerGhost();
      else editor.trigger('cc', 'editor.action.inlineSuggest.hide', {});
    },
    onRun(handler) {
      runHandler = handler;
    },
  };
})();
