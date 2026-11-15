// Logika game: render level, jalanin kode, animasi boss kalah, simpan progress.

(function () {
  'use strict';

  const STORAGE_KEY = 'compile-and-conquer-level';
  const RUN_LABEL = 'Jalankan ▶';

  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const els = {
    hudTier: $('hudTier'),
    hudLevel: $('hudLevel'),
    stage: $('stage'),
    hero: $('hero'),
    boss: $('boss'),
    bossName: $('bossName'),
    projectile: $('projectile'),
    taskTitle: $('taskTitle'),
    taskDesc: $('taskDesc'),
    taskExpected: $('taskExpected'),
    ghostToggle: $('ghostToggle'),
    runBtn: $('runBtn'),
    resetBtn: $('resetBtn'),
    console: $('console'),
    modal: $('modal'),
    modalText: $('modalText'),
    nextBtn: $('nextBtn'),
  };

  let levelIndex = loadProgress();
  let busy = false;

  // ---------- Progress (localStorage, aman kalau diblokir browser) ----------

  function loadProgress() {
    try {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      if (saved >= 0 && saved < LEVELS.length) return saved;
    } catch (err) { /* abaikan */ }
    return 0;
  }

  function saveProgress(index) {
    try {
      localStorage.setItem(STORAGE_KEY, String(index));
    } catch (err) { /* abaikan */ }
  }

  // ---------- Tampilan ----------

  // Pasang gambar sprite. Kalau file belum ada, tampilin emoji cadangan.
  function setSprite(container, src, emoji, label) {
    container.textContent = '';
    const img = new Image();
    img.alt = label;
    img.src = src;
    img.draggable = false;
    img.addEventListener('error', () => {
      container.textContent = '';
      const fallback = document.createElement('span');
      fallback.className = 'fallback';
      fallback.textContent = emoji;
      fallback.setAttribute('role', 'img');
      fallback.setAttribute('aria-label', label);
      container.appendChild(fallback);
    });
    container.appendChild(img);
  }

  function showConsole(kind, heading, body) {
    els.console.className = `console ${kind || ''}`.trim();
    els.console.textContent = '';
    const title = document.createElement('strong');
    title.textContent = heading;
    els.console.appendChild(title);
    if (body) {
      const pre = document.createElement('pre');
      pre.textContent = body;
      els.console.appendChild(pre);
    }
  }

  // Skeleton shimmer selagi nunggu compiler.
  function showLoading() {
    els.console.className = 'console loading';
    els.console.textContent = '';
    ['90%', '65%', '78%'].forEach((width) => {
      const bar = document.createElement('div');
      bar.className = 'sk';
      bar.style.width = width;
      els.console.appendChild(bar);
    });
  }

  function renderLevel() {
    const level = LEVELS[levelIndex];

    els.hudTier.textContent = TIER_LABEL[level.tier];
    els.hudLevel.textContent = `Level ${levelIndex + 1} / ${LEVELS.length}`;
    els.stage.className = `stage tier-${level.tier}`;

    setSprite(els.hero, 'assets/hero/hero.png', '🧑‍💻', 'Hero');
    setSprite(els.boss, level.boss.sprite, level.boss.emoji, level.boss.name);
    els.boss.className = 'sprite boss';
    els.bossName.textContent = level.boss.name;

    els.taskTitle.textContent = `${level.boss.name} · ${level.concept}`;
    els.taskDesc.textContent = level.task;
    els.taskExpected.textContent = level.expected;

    CodeEditor.setGhost(level.ghost);
    CodeEditor.setCode(level.starter);
    showConsole('', 'Tulis kodenya, lalu klik Jalankan.');
  }

  // ---------- Animasi ----------

  function restartClass(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // paksa browser mulai animasi dari awal
    el.classList.add(className);
  }

  async function blockBoss() {
    restartClass(els.boss, 'block');
    await wait(450);
    els.boss.classList.remove('block');
  }

  async function winSequence(output) {
    const firstLine = output.trim().split('\n')[0].slice(0, 22);
    els.projectile.textContent = firstLine;
    els.projectile.hidden = false;
    restartClass(els.projectile, 'fly');
    await wait(650);
    els.projectile.hidden = true;

    restartClass(els.boss, 'hit');
    await wait(450);
    els.boss.classList.remove('hit');

    els.boss.classList.add('defeated');
    await wait(950);
    showModal();
  }

  function showModal() {
    const last = levelIndex === LEVELS.length - 1;
    const bossName = LEVELS[levelIndex].boss.name;
    els.modalText.textContent = last
      ? `${bossName} tumbang! Boss berikutnya segera hadir.`
      : `${bossName} tumbang berkat kodemu.`;
    els.nextBtn.textContent = last ? 'Main dari awal' : 'Level berikutnya';
    els.modal.hidden = false;
    els.nextBtn.focus();
  }

  // ---------- Jalanin kode ----------

  function firstLines(text, count) {
    return text.trim().split('\n').slice(0, count).join('\n');
  }

  async function evaluate(level, code, result) {
    if (result.kind === 'network') {
      showConsole('error', 'Server compiler belum bisa dihubungi', result.message);
      return;
    }

    if (result.kind === 'compile') {
      showConsole(
        'error',
        'Kodenya belum bisa dikompilasi',
        `${firstLines(result.compileOutput, 8)}\n\nTips: cek lagi tanda kutip, titik koma (;), dan huruf besar-kecil.`
      );
      await blockBoss();
      return;
    }

    if (result.kind === 'timeout') {
      showConsole('error', 'Programnya kelamaan jalan', 'Kemungkinan ada loop yang ga pernah berhenti.');
      await blockBoss();
      return;
    }

    if (result.kind === 'runtime') {
      showConsole(
        'error',
        'Programnya crash pas dijalankan',
        firstLines(result.stderr || result.statusText || '', 6)
      );
      await blockBoss();
      return;
    }

    // kind === 'ok'
    if (!sameOutput(result.stdout, level.expected)) {
      showConsole(
        'error',
        'Output belum sesuai',
        `Output kamu:\n${result.stdout.trim() || '(kosong)'}\n\nYang diminta:\n${level.expected}`
      );
      await blockBoss();
      return;
    }

    for (const rule of level.requires || []) {
      if (!rule.pattern.test(code)) {
        showConsole('error', 'Hampir bener!', rule.message);
        await blockBoss();
        return;
      }
    }

    showConsole('ok', 'Output benar!', result.stdout.trim());
    await winSequence(result.stdout);
  }

  async function handleRun() {
    if (busy) return;
    busy = true;
    els.runBtn.disabled = true;
    els.runBtn.textContent = 'Menjalankan...';
    showLoading();

    try {
      const level = LEVELS[levelIndex];
      const code = CodeEditor.getCode();
      const result = await runCpp(code);
      await evaluate(level, code, result);
    } catch (err) {
      showConsole('error', 'Ada yang salah', 'Terjadi error di game-nya. Coba refresh halaman.');
    } finally {
      busy = false;
      els.runBtn.disabled = false;
      els.runBtn.textContent = RUN_LABEL;
    }
  }

  // ---------- Mulai ----------

  async function init() {
    try {
      await CodeEditor.init('editor');
    } catch (err) {
      showConsole('error', 'Editor gagal dimuat', 'Cek koneksi internet kamu, lalu refresh halaman.');
      return;
    }

    CodeEditor.onRun(handleRun);
    els.runBtn.addEventListener('click', handleRun);

    els.resetBtn.addEventListener('click', () => {
      CodeEditor.setCode(LEVELS[levelIndex].starter);
      showConsole('', 'Kode di-reset.');
    });

    els.ghostToggle.addEventListener('change', () => {
      CodeEditor.setGhostEnabled(els.ghostToggle.checked);
    });

    els.nextBtn.addEventListener('click', () => {
      const last = levelIndex === LEVELS.length - 1;
      levelIndex = last ? 0 : levelIndex + 1;
      saveProgress(levelIndex);
      els.modal.hidden = true;
      renderLevel();
    });

    renderLevel();
  }

  init();
})();
