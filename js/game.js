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
    coins: document.querySelector('.coins'),
    coinCount: $('coinCount'),
    hpFill: $('hpFill'),
    stage: $('stage'),
    hero: $('hero'),
    boss: $('boss'),
    bossName: $('bossName'),
    projectile: $('projectile'),
    fx: $('fx'),
    pop: $('pop'),
    flash: $('flash'),
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
    muteBtn: $('muteBtn'),
    alarm: $('alarm'),
    codeCard: document.querySelector('.code'),
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // Error sintaks: baris yang salah + penjelasan ramah. Pesan asli compiler dilipat.
  function showSyntaxError(info) {
    els.console.className = 'console error';
    els.console.textContent = '';

    const title = document.createElement('strong');
    title.textContent = 'Syntax-nya belum benar';
    els.console.appendChild(title);

    if (info.line) {
      const where = document.createElement('span');
      where.className = 'where';
      where.textContent = `Baris ${info.line}: ${info.codeLine || '(kosong)'}`;
      els.console.appendChild(where);
    }

    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = info.message;
    els.console.appendChild(why);

    if (info.raw) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Pesan asli compiler';
      const pre = document.createElement('pre');
      pre.textContent = info.raw;
      details.append(summary, pre);
      els.console.appendChild(details);
    }
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
    els.hudLevel.textContent = `Level ${levelIndex + 1} dari ${LEVELS.length}`;
    els.coinCount.textContent = String(levelIndex);
    resetHp();
    els.stage.className = `stage tier-${level.tier}`;

    setSprite(els.hero, 'assets/hero/hero.png', '🧑‍💻', 'Hero');
    setSprite(els.boss, level.boss.sprite, level.boss.emoji, level.boss.name);
    els.boss.className = 'sprite boss';
    els.hero.className = 'sprite hero';
    els.pop.hidden = true;
    els.projectile.hidden = true;
    els.fx.textContent = '';
    els.bossName.textContent = level.boss.name;

    els.taskTitle.textContent = `Konsep: ${level.concept}`;
    els.taskDesc.textContent = level.task;
    els.taskExpected.textContent = level.expected;

    CodeEditor.setGhost(level.ghost);
    CodeEditor.setCode(level.starter);
    showConsole('', 'Tulis kodenya, lalu klik Jalankan.');
  }

  // ---------- Animasi ----------

  // Bar HP boss balik penuh tanpa animasi pas level baru dimuat.
  function resetHp() {
    els.hpFill.style.transition = 'none';
    els.hpFill.style.width = '100%';
    void els.hpFill.offsetWidth;
    els.hpFill.style.transition = '';
  }

  function restartClass(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // paksa browser mulai animasi dari awal
    el.classList.add(className);
  }

  // Efek kalau kode salah: bingkai merah, kartu editor goyang, pesan digulung ke layar.
  function failImpact() {
    restartClass(els.alarm, 'go');
    restartClass(els.codeCard, 'oops');
    els.console.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  async function blockBoss() {
    Sound.wrong();
    failImpact();
    restartClass(els.boss, 'block');
    await wait(450);
    els.boss.classList.remove('block');
  }

  // Posisi + ukuran elemen relatif ke arena (buat naruh efek pas di tempatnya).
  function box(el) {
    const s = els.stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const left = r.left - s.left;
    const top = r.top - s.top;
    return { left, top, w: r.width, h: r.height, right: left + r.width, x: left + r.width / 2, y: top + r.height / 2 };
  }

  // Ledakan kotak-kotak kecil yang menyebar dari satu titik.
  function burst(x, y, count, spread, colors) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('i');
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = spread * (0.45 + Math.random() * 0.75);
      const size = [6, 8, 10][i % 3];
      spark.className = 'spark';
      spark.style.cssText =
        `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]};` +
        `--dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;`;
      spark.addEventListener('animationend', () => spark.remove());
      els.fx.appendChild(spark);
    }
  }

  // Output program muncul sebagai teks "damage" di atas boss.
  function showPop(text, x, top) {
    els.pop.textContent = text;
    els.pop.hidden = false;
    const half = els.pop.offsetWidth / 2 + 8;
    const clamped = Math.min(Math.max(x, half), els.stage.clientWidth - half);
    els.pop.style.left = `${clamped}px`;
    els.pop.style.top = `${Math.max(top, 56)}px`;
    restartClass(els.pop, 'rise');
  }

  // Di HP, arena bisa kegeser keluar layar waktu user ngetik. Tarik balik.
  async function bringStageIntoView() {
    const r = els.stage.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) return;
    els.stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    await wait(450);
  }

  async function winSequence(output) {
    const text = output.trim().split('\n')[0].slice(0, 18);
    await bringStageIntoView();

    const heroBox = box(els.hero);
    const bossBox = box(els.boss);

    // 1. Hero maju sedikit, lempar bola energi dari laptopnya.
    Sound.charge();
    restartClass(els.hero, 'attack');
    await wait(reduceMotion ? 0 : 160);

    const from = { x: heroBox.right, y: heroBox.top + heroBox.h * 0.45 };
    const to = { x: bossBox.left + bossBox.w * 0.3, y: bossBox.y };
    els.projectile.hidden = false;
    Sound.zap();
    const flight = els.projectile.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px) scale(0.6)` },
        { transform: `translate(${to.x}px, ${to.y}px) scale(1.15)` },
      ],
      { duration: reduceMotion ? 1 : 480, easing: 'cubic-bezier(0.5, 0, 1, 1)', fill: 'forwards' }
    );
    await flight.finished.catch(() => {});
    flight.cancel();
    els.projectile.hidden = true;

    Sound.hit();
    // 2. Kena: flash, ledakan, arena goyang, boss kedip, HP habis.
    restartClass(els.flash, 'go');
    restartClass(els.stage, 'shake');
    restartClass(els.boss, 'hit');
    burst(to.x, to.y, 14, 80, ['#ffffff', '#f5c22e', '#2ee6a6']);
    showPop(text, bossBox.x, bossBox.top - 10);
    els.hpFill.style.width = '0%';
    els.coinCount.textContent = String(levelIndex + 1);
    restartClass(els.coins, 'bump');
    await wait(500);
    els.boss.classList.remove('hit');
    els.hero.classList.remove('attack');

    // 3. Boss meledak dan hilang.
    burst(bossBox.x, bossBox.y, 28, 130, ['#ffffff', '#f5c22e', '#e8702a', '#2ee6a6']);
    Sound.defeat();
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
    Sound.win();
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
      const info = ErrorHelp.explain(result.compileOutput, code);
      showSyntaxError(info);
      CodeEditor.markError(info.line);
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
      const got = normalizeOutput(result.stdout);
      const want = normalizeOutput(level.expected);
      let tip = '';
      if (!got) tip = 'Programnya jalan, tapi ga menampilkan apa-apa. Pakai cout << ...; buat nampilin.\n\n';
      else if (got.toLowerCase() === want.toLowerCase()) tip = 'Isinya udah bener, tapi huruf besar-kecilnya beda.\n\n';
      else if (got.replace(/\s+/g, '') === want.replace(/\s+/g, '')) tip = 'Isinya udah bener, tapi spasi atau baris barunya beda.\n\n';
      showConsole(
        'error',
        'Output belum sesuai',
        `${tip}Output kamu:\n${got || '(kosong)'}\n\nYang diminta:\n${level.expected}`
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
    if (!CodeEditor.getCode().trim()) {
      showConsole('error', 'Editornya masih kosong', 'Ketik kodenya dulu, mulai dari #include <iostream>. Nyalain panduan abu-abu kalau bingung.');
      Sound.wrong();
      failImpact();
      return;
    }
    busy = true;
    Sound.unlock();
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

    const paintMute = () => {
      els.muteBtn.textContent = Sound.isMuted() ? 'Suara: mati' : 'Suara: nyala';
      els.muteBtn.setAttribute('aria-pressed', String(Sound.isMuted()));
    };
    els.muteBtn.addEventListener('click', () => {
      Sound.setMuted(!Sound.isMuted());
      paintMute();
    });
    paintMute();

    renderLevel();
  }

  init();
})();