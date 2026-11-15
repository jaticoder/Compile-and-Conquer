// Logika game: lobby, render level, jalanin kode, animasi boss kalah,
// transisi antar-level (hero jalan + tirai), gulungan soal, simpan progress.

(function () {
  'use strict';

  const STORAGE_KEY = 'compile-and-conquer-level';
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
    els.coinCount.textContent = String(levelIndex);
    resetHp();
    els.stage.className = `stage tier-${level.tier}`;

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

  // Tirai kebuka, hero jalan masuk, boss muncul, gulungan soal tampil.
  async function enterLevel() {
    const opening = reveal();
    await wait(reduceMotion ? 0 : 180);
    await Promise.all([opening, walkIn()]);
    await bossPop();
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

    Sound.win();
    if (levelIndex === LEVELS.length - 1) {
      showModal(); // boss terakhir: ga ada level lanjutan
      return;
    }
    // 4. Hero jalan ke level berikutnya.
    await wait(reduceMotion ? 0 : 450);
    await advance(levelIndex + 1);
  }

  function showModal() {
    els.modalText.textContent = `${LEVELS[levelIndex].boss.name} tumbang! Boss berikutnya segera hadir.`;
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
    if (busy || transitioning) return;
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

  // ---------- Lobby ----------

  function paintPlay() {
    els.playBtn.textContent = inGame || levelIndex > 0 ? 'Lanjut' : 'Main';
  }

  function paintMute() {
    const muted = Sound.isMuted();
    els.muteBtn.textContent = muted ? 'Mati' : 'Nyala';
    els.muteBtn.setAttribute('aria-pressed', String(!muted));
    els.muteBtn.classList.toggle('off', muted);
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

  async function startGame() {
    if (transitioning) return;
    transitioning = true;
    Sound.unlock();

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
    els.playBtn.addEventListener('click', startGame);
    els.settingsBtn.addEventListener('click', () => { Sound.click(); showSettings(true); });
    els.settingsBack.addEventListener('click', () => { Sound.click(); showSettings(false); });
    els.menuBtn.addEventListener('click', () => { Sound.click(); openLobby(); });
    document.getElementById('portfolioLink').addEventListener('click', () => Sound.click());

    // Gulungan soal
    els.startBtn.addEventListener('click', hidePaper);

    // Suara nyala secara default (disimpan kalau user mematikan).
    els.muteBtn.addEventListener('click', () => {
      Sound.setMuted(!Sound.isMuted());
      paintMute();
    });
    paintMute();
    paintPlay();

    // Siapin level di belakang lobby biar gambar sprite udah ke-load pas Main ditekan.
    renderLevel(false);
  }

  init();
})();