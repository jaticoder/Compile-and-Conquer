// Logika game: lobby, render level, jalanin kode, animasi boss kalah,
// transisi antar-level (hero jalan + tirai), gulungan soal, simpan progress.

(function () {
  'use strict';

  const STORAGE_KEY = Lang.levelKey(Lang.current());
  const RUN_LABEL = 'Jalankan ▶';

  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const els = {
    topbar: $('topbar'),
    frame: $('frame'),
    hudTier: $('hudTier'),
    hudLevel: $('hudLevel'),
    coins: document.querySelector('.coins'),
    coinCount: $('coinCount'),
    plate: document.querySelector('.plate'),
    hpFill: $('hpFill'),
    stage: $('stage'),
    hero: $('hero'),
    boss: $('boss'),
    bossName: $('bossName'),
    projectile: $('projectile'),
    fx: $('fx'),
    pop: $('pop'),
    flash: $('flash'),
    quest: $('quest'),
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
    modalMenuBtn: $('modalMenuBtn'),
    muteBtn: $('muteBtn'),
    musicBtn: $('musicBtn'),
    volBtn: $('volBtn'),
    mixer: $('mixer'),
    alarm: $('alarm'),
    codeCard: document.querySelector('.code'),
    // lobby
    lobby: $('lobby'),
    lobbyHero: $('lobbyHero'),
    lobbyBoss: $('lobbyBoss'),
    lobbyMenu: $('lobbyMenu'),
    lobbySettings: $('lobbySettings'),
    playBtn: $('playBtn'),
    settingsBtn: $('settingsBtn'),
    settingsBack: $('settingsBack'),
    menuBtn: $('menuBtn'),
    lessonBtn: $('lessonBtn'),
    mapBtn: $('mapBtn'),
    // peta bab
    chapters: $('chapters'),
    chapterGrid: $('chapterGrid'),
    chaptersBack: $('chaptersBack'),
    // pilih level
    stages: $('stages'),
    stageGrid: $('stageGrid'),
    stagesSub: $('stagesSub'),
    stagesBack: $('stagesBack'),
    stagesSwap: $('stagesSwap'),
    // transisi
    wipe: $('wipe'),
    scrim: $('scrim'),
    cta: $('cta'),
    startBtn: $('startBtn'),
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let levelIndex = loadProgress();
  let busy = false;          // lagi ngejalanin kode
  let transitioning = false; // lagi di tengah transisi / gulungan soal
  let inGame = false;        // user udah pernah masuk ke gameplay
  let entryDist = 0;         // jarak hero berjalan masuk dari kiri arena
  let paperPose = '';        // posisi gulungan di tengah layar
  let paperAnim = null;

  // ---------- Progress (localStorage, aman kalau diblokir browser) ----------

  function loadProgress() {
    try {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      if (saved >= 0 && saved < LEVELS.length) return saved;
    } catch (err) { /* abaikan */ }
    return 0;
  }

  function saveProgress(index) {
    Lang.syncBest(); // level tertinggi dicatat dulu, biar ga hilang kalau index turun
    try {
      localStorage.setItem(STORAGE_KEY, String(index));
    } catch (err) { /* abaikan */ }
  }

  // ---------- Helper animasi ----------

  // Web Animations API. Kalau user minta gerakan dikurangi, durasinya dipangkas.
  function anim(el, frames, options) {
    return el.animate(frames, { ...options, duration: reduceMotion ? 1 : options.duration, delay: reduceMotion ? 0 : (options.delay || 0) });
  }
  const fin = (animation) => animation.finished.then(() => animation, () => animation);
  const run = (el, frames, options) => fin(anim(el, frames, options));

  function restartClass(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // paksa browser mulai animasi dari awal
    el.classList.add(className);
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

  // `entering` = level ini bakal diawali animasi masuk (hero jalan, boss muncul,
  // gulungan soal). Semua elemen disembunyiin dulu sampai gilirannya.
  function renderLevel(entering) {
    const level = LEVELS[levelIndex];

    els.hudTier.textContent = TIER_LABEL[level.tier];
    els.hudLevel.textContent = `Level ${levelIndex + 1} dari ${LEVELS.length}`;
    els.coinCount.textContent = String(Lang.progress(Lang.current()).beaten);
    resetHp();
    els.stage.className = `stage tier-${level.tier}`;
    Sound.setMood(level.tier);

    setSprite(els.hero, 'assets/hero/hero.png', '🧑‍💻', 'Hero');
    setSprite(els.boss, level.boss.sprite, level.boss.emoji, level.boss.name);
    els.boss.className = 'sprite boss';
    els.hero.className = 'sprite hero';
    els.hero.style.translate = '';
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

    const hidden = entering ? '0' : '';
    els.boss.style.opacity = hidden;
    els.plate.style.opacity = hidden;
    els.coins.style.opacity = hidden;
    els.quest.style.opacity = hidden;
    els.codeCard.style.opacity = hidden;

    if (entering) {
      // Hero mulai dari luar arena sebelah kiri.
      const heroRect = els.hero.getBoundingClientRect();
      const stageRect = els.stage.getBoundingClientRect();
      entryDist = heroRect.right - stageRect.left + 30;
      els.hero.style.translate = `${-entryDist}px 0px`;
      els.hero.classList.add('walking');
    }
  }

  // ---------- Animasi ----------

  // Bar HP boss balik penuh tanpa animasi pas level baru dimuat.
  function resetHp() {
    els.hpFill.style.transition = 'none';
    els.hpFill.style.width = '100%';
    void els.hpFill.offsetWidth;
    els.hpFill.style.transition = '';
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
    return { left, top, w: r.width, h: r.height, right: left + r.width, bottom: top + r.height, x: left + r.width / 2, y: top + r.height / 2 };
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

  // ---------- Transisi: tirai, hero jalan, boss muncul, gulungan soal ----------

  // Tirai nutup layar dari kiri ke kanan.
  async function cover() {
    Sound.whoosh();
    els.wipe.style.pointerEvents = 'auto';
    const a = await run(
      els.wipe,
      [{ transform: 'translateX(-105%)' }, { transform: 'translateX(0)' }],
      { duration: 520, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
    );
    els.wipe.style.transform = 'translateX(0)';
    a.cancel();
  }

  // Tirai lanjut gerak ke kanan, layar baru kebuka.
  async function reveal() {
    const a = await run(
      els.wipe,
      [{ transform: 'translateX(0)' }, { transform: 'translateX(105%)' }],
      { duration: 560, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
    );
    els.wipe.style.transform = '';
    els.wipe.style.pointerEvents = '';
    a.cancel();
  }

  // Hero berjalan dari luar arena ke posisinya.
  async function walkIn() {
    els.hero.classList.add('walking');
    const steps = setInterval(Sound.step, 280);
    const a = await run(
      els.hero,
      [{ translate: `${-entryDist}px 0px` }, { translate: '0px 0px' }],
      { duration: 1000, easing: 'ease-out', fill: 'forwards' }
    );
    clearInterval(steps);
    els.hero.style.translate = '';
    a.cancel();
    els.hero.classList.remove('walking');
  }

  function fadeIn(el) {
    anim(el, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out', fill: 'backwards' });
    el.style.opacity = '';
  }

  // Boss muncul: membesar dengan sedikit memantul, debu di kakinya.
  async function bossPop() {
    const b = box(els.boss);
    Sound.land();
    const a = anim(
      els.boss,
      [
        { opacity: 0, scale: '0.2', translate: '0px -40px' },
        { opacity: 1, scale: '1.12', translate: '0px 4px', offset: 0.6 },
        { opacity: 1, scale: '1', translate: '0px 0px' },
      ],
      { duration: 650, easing: 'ease-out', fill: 'backwards' }
    );
    els.boss.style.opacity = '';
    wait(reduceMotion ? 0 : 380).then(() => burst(b.x, b.bottom - 6, 10, 55, ['#ffffff', '#d8d2e8', '#a9a3c4']));
    await fin(a);
    fadeIn(els.plate);
    fadeIn(els.coins);
    await wait(reduceMotion ? 0 : 250);
  }

  // Gulungan soal: kartu soal terbang ke tengah layar, tampil kayak kertas dungeon.
  async function showPaper() {
    const q = els.quest;
    window.scrollTo(0, 0);
    document.body.classList.add('lock');
    q.classList.add('paper', 'lift');

    const r = q.getBoundingClientRect();
    const s = Math.min(1.2, (window.innerWidth - 32) / r.width, (window.innerHeight * 0.7) / r.height);
    const centerY = window.innerHeight * 0.45;
    const dx = window.innerWidth / 2 - (r.left + r.width / 2);
    const dy = centerY - (r.top + r.height / 2);
    paperPose = `translate(${dx}px, ${dy}px) scale(${s})`;

    els.scrim.classList.add('on');
    Sound.paper();
    paperAnim = anim(
      q,
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s * 0.4}, 0.05)`, opacity: 0 },
        { transform: paperPose, opacity: 1 },
      ],
      { duration: 650, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.12)', fill: 'forwards' }
    );
    q.style.opacity = '';
    await fin(paperAnim);

    const ctaTop = Math.min(centerY + (r.height * s) / 2 + 30, window.innerHeight - 90);
    els.cta.style.top = `${ctaTop}px`;
    els.cta.classList.add('on');
    els.startBtn.focus({ preventScroll: true });
  }

  // Tombol Mulai: kertas melayang balik ke posisi soal, lalu editor muncul.
  async function hidePaper() {
    const q = els.quest;
    els.cta.classList.remove('on');
    els.scrim.classList.remove('on');
    q.classList.remove('paper'); // warna balik ke papan kayu (transisi CSS)

    if (paperAnim) paperAnim.cancel();
    paperAnim = null;
    Sound.paper();
    await run(
      q,
      [{ transform: paperPose }, { transform: 'none' }],
      { duration: 700, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' }
    );
    q.classList.remove('lift');
    document.body.classList.remove('lock');

    anim(els.codeCard, [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'ease-out', fill: 'backwards' });
    els.codeCard.style.opacity = '';
    await wait(reduceMotion ? 0 : 480);

    transitioning = false;
    if (window.matchMedia('(pointer: fine)').matches) {
      const ta = document.querySelector('#editor textarea');
      if (ta) ta.focus({ preventScroll: true });
    }
  }

  // ---------- Materi ----------

  // Materi level ini yang belum pernah dibaca (Level 1 diawali materi dasar).
  // Dibuka otomatis sekali; sesudahnya bisa dibuka lagi lewat tombol Materi.
  async function showLessonIfNew() {
    // Materi selalu muncul di awal level. Level 1 selalu diawali 'dasar'
    // (kenapa ada #include, main, dst.), baru materi konsep level itu.
    const ids = lessonIdsForLevel(levelIndex, true);
    if (!ids.length) return;
    await wait(reduceMotion ? 0 : 200);
    await Lesson.open(ids);
  }

  async function openLessonManually() {
    if (busy || transitioning) return;
    transitioning = true;
    setMixer(false);
    await Lesson.open(lessonIdsForLevel(levelIndex, true));
    transitioning = false;
    els.lessonBtn.focus({ preventScroll: true });
  }

  // Tirai kebuka, hero jalan masuk, boss muncul, materi (kalau baru), gulungan soal tampil.
  async function enterLevel() {
    const opening = reveal();
    await wait(reduceMotion ? 0 : 180);
    await Promise.all([opening, walkIn()]);
    await bossPop();
    await showLessonIfNew();
    await showPaper();
  }

  // Hero jalan keluar arena ke kanan, tirai nutup, level baru dimuat.
  async function advance(to) {
    transitioning = true;
    els.pop.hidden = true;

    const dist = els.stage.clientWidth - box(els.hero).left + 24;
    els.hero.classList.add('walking');
    const steps = setInterval(Sound.step, 280);
    const walk = anim(
      els.hero,
      [{ translate: '0px 0px' }, { translate: `${dist}px 0px` }],
      { duration: 1300, easing: 'ease-in', fill: 'forwards' }
    );

    await wait(reduceMotion ? 0 : 700);
    await cover();
    await fin(walk);
    clearInterval(steps);
    walk.cancel();

    levelIndex = to;
    saveProgress(levelIndex);
    renderLevel(true);
    await enterLevel();
  }

  async function winSequence(output) {
    const text = output.trim().split('\n')[0].slice(0, 18);
    // Boss ini kalah: level berikutnya kebuka (level lama yang diulang ga nurunin apa-apa).
    Lang.unlock(Math.min(levelIndex + 1, LEVELS.length - 1));
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
    els.coinCount.textContent = String(Math.max(Lang.progress(Lang.current()).beaten, levelIndex + 1));
    restartClass(els.coins, 'bump');
    await wait(500);
    els.boss.classList.remove('hit');
    els.hero.classList.remove('attack');

    // 3. Boss meledak dan hilang.
    burst(bossBox.x, bossBox.y, 28, 130, ['#ffffff', '#f5c22e', '#e8702a', '#2ee6a6']);
    Sound.defeat();
    els.boss.classList.add('defeated');
    await wait(950);

    Sound.win();
    if (levelIndex === LEVELS.length - 1) {
      Lang.markDone();
      showModal(); // boss terakhir: ga ada level lanjutan
      return;
    }
    // 4. Hero jalan ke level berikutnya.
    await wait(reduceMotion ? 0 : 450);
    await advance(levelIndex + 1);
  }

  function showModal() {
    els.modalText.textContent = `${LEVELS[levelIndex].boss.name} tumbang! Semua boss di bab ${Lang.info().label} udah kalah. Coba bab lain lewat Peta Bab di menu.`;
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
      const info = (Lang.current() === 'python' ? PyErrors : ErrorHelp).explain(result.compileOutput, code);
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
      if (!got) tip = 'Programnya jalan, tapi ga menampilkan apa-apa. ' + (Lang.current() === 'python' ? 'Pakai print(...) buat nampilin.' : 'Pakai cout << ...; buat nampilin.') + '\n\n';
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

  // Kode belum selesai? Dicek di browser, ga perlu kirim ke Judge0.
  // Pesannya sengaja ga nyebut baris berikutnya, cuma bilang masih ada lanjutan.
  function unfinishedHint(level, code) {
    const squash = (s) => s.replace(/\s+/g, '');
    const mine = code.split('\n').filter((l) => l.trim());
    const guide = (level.ghost || []).filter((l) => l.trim());
    if (!mine.length) return null;

    // 1. Semua baris cocok urut dengan awal panduan, tapi panduan masih lebih panjang.
    if (guide.length > mine.length) {
      const prefix = mine.every((line, i) => {
        const a = squash(line);
        const b = squash(guide[i]);
        return a === b || (a.startsWith('#include') && b.startsWith('#include'));
      });
      if (prefix) {
        return `Kodemu baru ${mine.length} baris dan belum selesai. Masih ada lanjutannya di bawah.`;
      }
    }

    // 2. Python: baris berakhir ':' tapi ga ada isinya.
    if (Lang.current() === 'python' && /:\s*$/.test(mine[mine.length - 1])) {
      return 'Baris terakhir berakhir dengan titik dua (:). Artinya harus ada isinya di bawah, dijorokin ke dalam.';
    }

    // 3. C++: kurung kurawal buka lebih banyak dari tutup.
    if (Lang.current() === 'cpp') {
      const open = (code.match(/\{/g) || []).length;
      const close = (code.match(/\}/g) || []).length;
      if (open > close) return 'Ada { yang belum ditutup }. Kodenya belum selesai.';
    }

    return null;
  }

  async function handleRun() {
    if (busy || transitioning) return;
    if (!CodeEditor.getCode().trim()) {
      showConsole('error', 'Editornya masih kosong', 'Ketik kodenya dulu, mulai dari #include <iostream>. Nyalain panduan abu-abu kalau bingung.');
      Sound.wrong();
      failImpact();
      return;
    }
    const unfinished = unfinishedHint(LEVELS[levelIndex], CodeEditor.getCode());
    if (unfinished) {
      showConsole('error', 'Kodenya belum selesai', unfinished);
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
      const result = await runCode(code);
      await evaluate(level, code, result);
    } catch (err) {
      showConsole('error', 'Ada yang salah', 'Terjadi error di game-nya. Coba refresh halaman.');
    } finally {
      busy = false;
      els.runBtn.disabled = false;
      els.runBtn.textContent = RUN_LABEL;
    }
  }

  // ---------- Lobby ----------

  // Main selalu ngebuka pilihan level (kecuali pemain baru, lihat playBtn di init).
  function paintPlay() {
    els.playBtn.textContent = 'Main';
  }

  // ---------- Pilih level ----------
  // Level yang udah dikalahkan bisa dimainkan lagi. Level berikutnya kebuka,
  // sisanya terkunci sampai boss sebelumnya kalah.

  function buildStages() {
    const lang = Lang.current();
    const prog = Lang.progress(lang);
    const open = prog.finished ? LEVELS.length - 1 : Lang.unlocked(lang);
    els.stagesSub.textContent = `Bab ${Lang.info().label}. Level yang udah kamu kalahkan bisa dimainkan lagi.`;
    els.stageGrid.textContent = '';

    LEVELS.forEach((level, i) => {
      const state = i < prog.beaten ? 'done' : i === open ? 'next' : 'locked';
      const playing = inGame && i === levelIndex;

      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = `stage-tile ${state}${playing ? ' now' : ''}`;
      tile.disabled = state === 'locked';

      const thumb = document.createElement('span');
      thumb.className = 'st-thumb';
      setSprite(thumb, level.boss.sprite, level.boss.emoji, state === 'locked' ? '' : level.boss.name);
      tile.appendChild(thumb);

      const num = document.createElement('span');
      num.className = 'st-num';
      num.textContent = `Level ${i + 1}`;
      tile.appendChild(num);

      const name = document.createElement('span');
      name.className = 'st-name';
      name.textContent = state === 'locked' ? '???' : level.boss.name;
      tile.appendChild(name);

      const concept = document.createElement('span');
      concept.className = 'st-concept';
      concept.textContent = state === 'locked' ? 'Terkunci' : level.concept;
      tile.appendChild(concept);

      const tag = document.createElement('span');
      tag.className = 'st-tag';
      tag.textContent = playing ? 'Lagi dimainkan' : state === 'done' ? 'Sudah kalah' : state === 'next' ? 'Berikutnya' : '';
      if (tag.textContent) tile.appendChild(tag);

      tile.setAttribute('aria-label', `Level ${i + 1}, ${state === 'locked' ? 'terkunci' : level.boss.name}`);
      if (state !== 'locked') tile.addEventListener('click', () => playLevel(i));
      els.stageGrid.appendChild(tile);
    });
  }

  function openStages() {
    buildStages();
    els.stages.hidden = false;
    anim(els.stages, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    anim(els.stageGrid, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 60, easing: 'ease-out', fill: 'backwards' });
    const target = els.stageGrid.querySelector('.stage-tile.next:not(:disabled)') || els.stageGrid.querySelector('.stage-tile:not(:disabled)');
    if (target) target.focus({ preventScroll: true });
  }

  function closeStages() {
    els.stages.hidden = true;
  }

  // Main main dari level `index`. Tiga kemungkinan:
  //   - game lagi jalan dan levelnya sama: tutup menu aja
  //   - game belum jalan: pasang level lalu mulai biasa (tirai, hero jalan masuk)
  //   - game lagi jalan di level lain: tirai nutup, pindah level, hero jalan masuk
  async function playLevel(index) {
    if (transitioning || busy) return;
    closeStages();
    if (inGame && index === levelIndex) { startGame(); return; }
    if (!inGame) {
      levelIndex = index;
      saveProgress(index);
      startGame();
      return;
    }

    transitioning = true;
    Sound.unlock();
    els.lobby.classList.remove('boot');
    els.lobby.classList.add('leaving');
    restartClass(els.lobbyHero, 'attack');
    await wait(reduceMotion ? 0 : 380);
    await cover();
    els.lobby.hidden = true;
    els.lobby.classList.remove('leaving');
    document.body.dataset.view = 'game';
    window.scrollTo(0, 0);
    levelIndex = index;
    saveProgress(index);
    renderLevel(true);
    await enterLevel();
  }

  // ---------- Peta bab ----------
  // Satu kartu per bahasa. Semua bab terbuka. Python diberi label "Disarankan"
  // buat pemula, JavaScript "Segera hadir". Pilih bahasa lain = muat ulang
  // halaman (lihat lang.js), lalu langsung masuk game.

  const CHAPTERS = [
    { id: 'python', name: 'Python', blurb: 'Paling ringkas, ga ada kerangka panjang. Cocok buat yang belum pernah ngoding.', tag: 'Disarankan mulai di sini' },
    { id: 'cpp', name: 'C++', blurb: 'Dipakai di kuliah Informatika. Ada kerangka program yang dijelasin pelan-pelan.' },
    { id: 'js', name: 'JavaScript', blurb: 'Bahasa buat bikin web. Bab ini belum jadi.', soon: true },
  ];

  function chapterMeta(prog) {
    if (prog.finished) return 'Tamat. Semua boss udah kalah.';
    if (prog.beaten === 0) return 'Belum mulai';
    return `Lanjut dari level ${prog.beaten + 1}`;
  }

  function buildChapters() {
    els.chapterGrid.textContent = '';
    CHAPTERS.forEach((ch) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'chapter' + (ch.tag ? ' pick' : '') + (ch.soon ? ' soon' : '');
      card.dataset.lang = ch.id;
      if (ch.soon) card.disabled = true;

      const name = document.createElement('span');
      name.className = 'ch-name';
      name.textContent = ch.name;
      card.appendChild(name);

      if (ch.tag) {
        const tag = document.createElement('span');
        tag.className = 'ch-tag';
        tag.textContent = ch.tag;
        card.appendChild(tag);
      }

      const blurb = document.createElement('span');
      blurb.className = 'ch-blurb';
      blurb.textContent = ch.blurb;
      card.appendChild(blurb);

      const foot = document.createElement('span');
      foot.className = 'ch-foot';
      if (ch.soon) {
        foot.textContent = 'Segera hadir';
      } else {
        const prog = Lang.progress(ch.id);
        const bar = document.createElement('span');
        bar.className = 'ch-bar' + (prog.finished ? ' full' : '');
        bar.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < prog.total; i++) {
          const seg = document.createElement('i');
          if (i < prog.beaten) seg.className = 'on';
          bar.appendChild(seg);
        }
        const count = document.createElement('span');
        count.className = 'ch-count';
        count.textContent = `${prog.beaten} dari ${prog.total} boss`;
        const meta = document.createElement('span');
        meta.className = 'ch-meta';
        meta.textContent = chapterMeta(prog);
        foot.append(bar, count, meta);
        card.addEventListener('click', () => pickChapter(ch.id));
      }
      card.appendChild(foot);
      els.chapterGrid.appendChild(card);
    });
  }

  function openChapters() {
    if (transitioning && els.chapters.hidden) return;
    closeStages();
    buildChapters();
    els.chapters.hidden = false;
    anim(els.chapters, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    anim(els.chapterGrid, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 60, easing: 'ease-out', fill: 'backwards' });
    const first = els.chapterGrid.querySelector('.chapter:not(:disabled)');
    if (first) first.focus({ preventScroll: true });
  }

  function closeChapters() {
    els.chapters.hidden = true;
  }

  function pickChapter(id) {
    if (id !== Lang.current()) {
      Lang.set(id, true); // muat ulang, lalu langsung masuk game
      return;
    }
    closeChapters();
    openStagesOrStart();
  }

  // Bab sudah pernah dimainkan: pilih level dulu. Bab yang masih kosong: langsung mulai.
  function openStagesOrStart() {
    const prog = Lang.progress(Lang.current());
    if (!inGame && prog.beaten === 0 && !prog.finished) startGame();
    else openStages();
  }

  function paintMute() {
    const muted = Sound.isMuted();
    els.muteBtn.textContent = muted ? 'Mati' : 'Nyala';
    els.muteBtn.setAttribute('aria-pressed', String(!muted));
    els.muteBtn.classList.toggle('off', muted);
  }

  function paintMusic() {
    const off = Sound.isMusicMuted();
    els.musicBtn.textContent = off ? 'Mati' : 'Nyala';
    els.musicBtn.setAttribute('aria-pressed', String(!off));
    els.musicBtn.classList.toggle('off', off);
  }

  // ----- Volume + efek ngetik -----
  // Slider dan tombol yang sama ada di dua tempat (pengaturan lobby dan popover
  // di dalam game), jadi semuanya dicari lewat class dan disinkronkan.

  function paintVolumes() {
    document.querySelectorAll('input.vol').forEach((slider) => {
      const value = Sound.getVolume(slider.dataset.kind);
      slider.value = String(value);
      slider.style.setProperty('--fill', `${value}%`);
    });
    document.querySelectorAll('.vol-val').forEach((label) => {
      label.textContent = String(Sound.getVolume(label.dataset.kind));
    });
  }

  function paintTypeFx() {
    const on = CodeEditor.isTypingFx();
    document.querySelectorAll('.type-toggle').forEach((btn) => {
      btn.textContent = on ? 'Nyala' : 'Mati';
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('off', !on);
    });
  }

  function setMixer(open) {
    els.mixer.hidden = !open;
    els.volBtn.setAttribute('aria-expanded', String(open));
    if (open) anim(els.mixer, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
  }

  function initMixer() {
    document.querySelectorAll('input.vol').forEach((slider) => {
      const kind = slider.dataset.kind;
      slider.addEventListener('input', () => {
        Sound.unlock();
        Sound.setVolume(kind, Number(slider.value));
        paintVolumes();
      });
      // Lepas slider efek: bunyiin contoh biar kedengeran segede apa.
      slider.addEventListener('change', () => { if (kind === 'sfx') Sound.click(); });
    });

    document.querySelectorAll('.type-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        CodeEditor.setTypingFx(!CodeEditor.isTypingFx());
        paintTypeFx();
        if (CodeEditor.isTypingFx()) Sound.click();
      });
    });

    els.volBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      Sound.click();
      setMixer(els.mixer.hidden);
    });
    // Klik di luar popover atau tekan Esc menutupnya.
    document.addEventListener('click', (event) => {
      if (!els.mixer.hidden && !els.mixer.contains(event.target)) setMixer(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !els.mixer.hidden) { setMixer(false); els.volBtn.focus(); }
    });

    paintVolumes();
    paintTypeFx();
  }

  async function showSettings(open) {
    const [hide, show] = open ? [els.lobbyMenu, els.lobbySettings] : [els.lobbySettings, els.lobbyMenu];
    hide.hidden = true;
    show.hidden = false;
    anim(show, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
    (open ? els.settingsBack : els.settingsBtn).focus({ preventScroll: true });
  }

  // Balik ke menu dari gameplay. Progress dan kode tetap disimpan.
  async function openLobby() {
    if (busy || transitioning) return;
    transitioning = true;
    setMixer(false);
    els.lobby.classList.remove('leaving');
    els.lobbyMenu.hidden = false;
    els.lobbySettings.hidden = true;
    paintPlay();
    els.lobby.hidden = false;
    document.body.dataset.view = 'menu';
    await run(els.lobby, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    transitioning = false;
    els.playBtn.focus({ preventScroll: true });
  }

  async function startGame(auto) {
    if (transitioning) return;
    transitioning = true;
    // Setelah reload dari peta bab belum ada sentuhan baru, jadi suara belum boleh dibuka.
    if (auto !== true) Sound.unlock();

    els.lobby.classList.remove('boot');
    els.lobby.classList.add('leaving');
    restartClass(els.lobbyHero, 'attack');
    await wait(reduceMotion ? 0 : 380);

    // Balik dari menu di tengah level: cukup tutup menu, ga perlu intro lagi.
    if (inGame) {
      const a = await run(els.lobby, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
      els.lobby.hidden = true;
      els.lobby.classList.remove('leaving');
      a.cancel();
      document.body.dataset.view = 'game';
      transitioning = false;
      return;
    }

    await cover();
    els.lobby.hidden = true;
    els.lobby.classList.remove('leaving');
    document.body.dataset.view = 'game';
    inGame = true;
    window.scrollTo(0, 0);
    renderLevel(true);

    // Topbar turun dan bingkai arena membesar pelan, ngikutin tirai yang kebuka.
    anim(els.topbar, [{ opacity: 0, transform: 'translateY(-24px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 300, easing: 'ease-out', fill: 'backwards' });
    anim(els.frame, [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 250, easing: 'ease-out', fill: 'backwards' });

    await enterLevel();
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

    // Level terakhir selesai: main dari awal atau balik ke menu.
    els.nextBtn.addEventListener('click', async () => {
      els.modal.hidden = true;
      await advance(0);
    });
    els.modalMenuBtn.addEventListener('click', async () => {
      els.modal.hidden = true;
      levelIndex = 0;
      saveProgress(0);
      inGame = false; // Main berikutnya mulai dari awal lagi, lengkap dengan intro
      renderLevel(false);
      await openLobby();
    });

    // Lobby
    setSprite(els.lobbyHero, 'assets/hero/hero.png', '🧑‍💻', 'Hero');
    setSprite(els.lobbyBoss, LEVELS[0].boss.sprite, LEVELS[0].boss.emoji, LEVELS[0].boss.name);
    // Main buka pilihan level. Pemain baru (belum milih bab dan belum ada progress) lewat peta bab dulu.
    els.playBtn.addEventListener('click', () => {
      const fresh = !inGame && !Lang.chosen() && Lang.progress(Lang.current()).beaten === 0;
      if (fresh) openChapters();
      else openStagesOrStart();
    });
    els.stagesBack.addEventListener('click', () => { Sound.click(); closeStages(); els.playBtn.focus({ preventScroll: true }); });
    els.stagesSwap.addEventListener('click', () => { Sound.click(); closeStages(); openChapters(); });
    els.mapBtn.addEventListener('click', () => { Sound.click(); openChapters(); });
    els.chaptersBack.addEventListener('click', () => { Sound.click(); closeChapters(); els.mapBtn.focus({ preventScroll: true }); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !els.chapters.hidden) { closeChapters(); els.mapBtn.focus({ preventScroll: true }); }
      else if (event.key === 'Escape' && !els.stages.hidden) { closeStages(); els.playBtn.focus({ preventScroll: true }); }
    });
    els.settingsBtn.addEventListener('click', () => { Sound.click(); showSettings(true); });
    els.settingsBack.addEventListener('click', () => { Sound.click(); showSettings(false); });
    els.menuBtn.addEventListener('click', () => { Sound.click(); openLobby(); });
    els.lessonBtn.addEventListener('click', () => { Sound.click(); openLessonManually(); });
    document.getElementById('portfolioLink').addEventListener('click', () => Sound.click());

    // Gulungan soal
    els.startBtn.addEventListener('click', hidePaper);

    // Musik dan efek suara nyala secara default (disimpan kalau user mematikan).
    els.musicBtn.addEventListener('click', () => {
      Sound.setMusicMuted(!Sound.isMusicMuted());
      paintMusic();
    });
    els.muteBtn.addEventListener('click', () => {
      Sound.setMuted(!Sound.isMuted());
      paintMute();
    });
    paintMusic();
    paintMute();
    paintPlay();
    initMixer();

    // Animasi masuk lobby (CSS, kelas .boot). Dilepas setelah selesai biar
    // ga ke-replay tiap balik ke menu.
    setTimeout(() => els.lobby.classList.remove('boot'), 2500);

    // Siapin level di belakang lobby biar gambar sprite udah ke-load pas Main ditekan.
    renderLevel(false);

    // Habis pilih bahasa lain di peta bab: halaman dimuat ulang, langsung masuk game.
    if (Lang.consumeAutostart()) {
      els.lobby.classList.remove('boot');
      const prog = Lang.progress(Lang.current());
      if (prog.beaten === 0 && !prog.finished) startGame(true);
      else openStages();
    }
  }

  init();
})();