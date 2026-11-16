// Gulungan materi: popup slide yang dibuka sebelum soal tiap boss,
// atau kapan aja lewat tombol "Materi". Bagian kode bisa diketuk buat
// ngeliat penjelasannya. Data materi ada di lessons.js.

const Lesson = (() => {
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SEEN_KEY = 'compile-and-conquer-lessons';
  const HINT = 'Ketuk bagian kode yang bergaris putus-putus buat lihat artinya.';

  let root, card, kicker, title, body, dots, prevBtn, nextBtn, skipBtn, mentor;
  let slides = [];
  let index = 0;
  let resolver = null;
  let ready = false;

  // ---------- Catatan materi yang udah dibaca ----------

  function seenSet() {
    try {
      const list = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      return new Set(Array.isArray(list) ? list : []);
    } catch (err) {
      return new Set();
    }
  }

  function markSeen(ids) {
    const set = seenSet();
    ids.forEach((id) => set.add(id));
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch (err) { /* abaikan */ }
  }

  function isSeen(id) { return seenSet().has(id); }

  // ---------- Render ----------

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Teks biasa dengan `potongan kode` di antara tanda backtick. Potongan kode
  // jadi <code class="ic"> (kotak gelap) biar ga nyatu sama kertas.
  function rich(node, text) {
    node.textContent = '';
    String(text).split('`').forEach((part, i) => {
      if (!part) return;
      node.appendChild(i % 2 ? el('code', 'ic', part) : document.createTextNode(part));
    });
    return node;
  }

  function buildCode(lines) {
    const pre = el('pre', 'lcode');
    const note = rich(el('p', 'lnote'), HINT);
    note.setAttribute('aria-live', 'polite');
    let first = null;

    const select = (btn, text) => {
      pre.querySelectorAll('.tok.on').forEach((n) => n.classList.remove('on'));
      btn.classList.add('on');
      rich(note, text);
    };

    lines.forEach((line, i) => {
      line.forEach((part) => {
        if (typeof part === 'string') {
          pre.appendChild(document.createTextNode(part));
          return;
        }
        const [text, explain, pick] = part;
        const btn = el('button', 'tok', text);
        btn.type = 'button';
        btn.addEventListener('click', () => {
          if (typeof Sound !== 'undefined') Sound.tip();
          select(btn, explain);
        });
        if (!first || pick) first = { btn, explain };
        pre.appendChild(btn);
      });
      if (i < lines.length - 1) pre.appendChild(document.createTextNode('\n'));
    });

    if (first) select(first.btn, first.explain);

    const wrap = document.createDocumentFragment();
    wrap.append(pre, note);
    return { wrap };
  }

  function render() {
    const slide = slides[index];
    kicker.textContent = slide.kicker;
    title.textContent = slide.title;

    body.textContent = '';
    (slide.text || []).forEach((t) => body.appendChild(rich(el('p', 'ltext'), t)));

    if (slide.code) {
      const built = buildCode(slide.code);
      body.appendChild(built.wrap);
    }
    if (slide.tip) body.appendChild(rich(el('p', 'ltip'), slide.tip));
    body.scrollTop = 0;

    dots.textContent = '';
    slides.forEach((_, i) => {
      const dot = el('i', i === index ? 'dot on' : 'dot');
      dots.appendChild(dot);
    });
    dots.setAttribute('aria-label', `Slide ${index + 1} dari ${slides.length}`);

    const last = index === slides.length - 1;
    prevBtn.hidden = index === 0;
    skipBtn.hidden = last;
    nextBtn.textContent = last ? 'Siap!' : 'Lanjut';
  }

  function go(step) {
    const next = index + step;
    if (next < 0) return;
    if (next >= slides.length) { if (typeof Sound !== 'undefined') Sound.lessonDone(); close('done'); return; }
    if (typeof Sound !== 'undefined') Sound.page(step < 0);
    index = next;
    render();
    if (!reduceMotion) body.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  }

  // ---------- Buka / tutup ----------

  function onKey(event) {
    if (root.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close('skip'); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
  }

  function close(result) {
    if (root.hidden) return;
    const done = resolver;
    resolver = null;
    const finish = () => {
      root.hidden = true;
      document.body.classList.remove('lesson-open');
      if (done) done(result);
    };
    if (reduceMotion) { finish(); return; }
    root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' }).finished.then(finish, finish);
  }

  // Buka materi buat daftar id. Hasilnya 'done' (sampai habis) atau 'skip'.
  function open(ids) {
    init();
    slides = [];
    ids.forEach((id) => {
      const lesson = LESSONS[id];
      if (!lesson) return;
      lesson.slides.forEach((slide) => slides.push({ ...slide, kicker: lesson.kicker }));
    });
    if (!slides.length) return Promise.resolve('done');

    index = 0;
    render();
    root.hidden = false;
    document.body.classList.add('lesson-open');
    if (typeof Sound !== 'undefined') Sound.lessonOpen();
    if (!reduceMotion) {
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      card.animate(
        [{ transform: 'translateY(18px) scale(0.94, 0.7)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 420, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.12)' }
      );
    }
    nextBtn.focus({ preventScroll: true });

    return new Promise((resolve) => {
      resolver = (result) => {
        // Materi dianggap udah dibaca walau dilewati, biar ga muncul terus.
        markSeen(ids);
        resolve(result);
      };
    });
  }

  function setMentor() {
    mentor.textContent = '';
    const img = new Image();
    img.alt = 'Mentor';
    img.draggable = false;
    img.src = 'assets/mentor/mentor.png';
    img.addEventListener('error', () => {
      mentor.textContent = '';
      const fallback = el('span', 'fallback', '🧙');
      fallback.setAttribute('role', 'img');
      fallback.setAttribute('aria-label', 'Mentor');
      mentor.appendChild(fallback);
    });
    mentor.appendChild(img);
  }

  function init() {
    if (ready) return;
    root = $('lesson');
    card = $('lessonCard');
    kicker = $('lessonKicker');
    title = $('lessonTitle');
    body = $('lessonBody');
    dots = $('lessonDots');
    prevBtn = $('lessonPrev');
    nextBtn = $('lessonNext');
    skipBtn = $('lessonSkip');
    mentor = $('mentor');

    setMentor();
    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    skipBtn.addEventListener('click', () => { if (typeof Sound !== 'undefined') Sound.click(); close('skip'); });
    document.addEventListener('keydown', onKey);
    ready = true;
  }

  return { open, isSeen, init };
})();