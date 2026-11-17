// Data versi Python: level, materi, dan penerjemah error.
// Boss, sprite, dan urutan konsep sama persis kayak versi C++. Yang beda cuma
// soal, panduan abu-abu, aturan tambahan, materi, dan pesan error.
// Dipakai lang.js kalau pemain milih Python.

const py = (i, over) => ({ ...LEVELS[i], ...over });

const LEVELS_PY = [
  py(0, {
    concept: 'print',
    task: 'Print Slime lemah sama tulisan. Buat program yang menampilkan teks "Halo Dunia" di layar.',
    ghost: ['print("Halo Dunia")'],
    requires: [],
  }),
  py(1, {
    task: 'Var Goblin nyimpen barang di dalam kotak (variable). Buat variable bernama umur yang isinya 19, lalu tampilkan isinya.',
    ghost: ['umur = 19', 'print(umur)'],
    requires: [{ pattern: /umur\s*=\s*19/, message: 'Outputnya udah bener, tapi pakai variable dulu ya: umur = 19' }],
  }),
  py(2, {
    ghost: ['print(7 * 6)'],
    requires: [{ pattern: /7\s*\*\s*6/, message: 'Hasilnya bener, tapi hitung pakai operator * ya, jangan langsung ketik 42.' }],
  }),
  py(3, {
    task: 'Fork Wraith berdiri di persimpangan dan selalu milih salah satu jalan. Buat variable nilai = 80. Kalau nilai >= 75 (lebih dari atau sama dengan: ketik tanda > lalu tanda =), tampilkan "Lulus". Kalau tidak, tampilkan "Remedial".',
    ghost: ['nilai = 80', 'if nilai >= 75:', 'print("Lulus")', 'else:', 'print("Remedial")'],
    requires: [
      { pattern: /nilai\s*=\s*80/, message: 'Outputnya udah bener, tapi bikin dulu variable-nya ya: nilai = 80' },
      { pattern: /if\s+[^\n:]*nilai[^\n:]*:/, message: 'Hampir! Pilih jalannya pakai if ... : yang ngecek nilai, jangan langsung print "Lulus".' },
      { pattern: /else\s*:/, message: 'Jalan kedua belum ada. Tambahin else: buat kasus nilainya di bawah 75.' },
    ],
  }),
  py(4, {
    task: 'Loop Serpent muter terus tanpa henti. Hentikan pakai for. Tampilkan angka 1 sampai 5, satu angka per baris.',
    ghost: ['for i in range(1, 6):', 'print(i)'],
    requires: [{ pattern: /for\s+\w+\s+in\b/, message: 'Outputnya bener, tapi pakai for ya. Ular ini cuma tumbang sama loop.' }],
  }),
];

const LESSON_FOR_CONCEPT_PY = {
  print: 'print',
  variable: 'variable',
  operator: 'operator',
  'if-else': 'if-else',
  'for loop': 'for loop',
};

const LESSONS_PY = {
  dasar: {
    kicker: 'Level 0: Zona Latihan',
    title: 'Kenalan sama Python',
    slides: [
      {
        title: 'Kode itu kayak resep',
        text: [
          'Komputer itu kayak koki yang nurut banget. Dia cuma ngerjain apa yang kamu tulis, satu baris demi satu baris, dari atas ke bawah.',
          'Tulisan itu namanya kode. Di game ini, kamu nulis kode. Kalau hasilnya bener, boss-nya kalah.',
        ],
      },
      {
        title: 'Python itu ringkas',
        text: ['Di Python ga ada kerangka panjang. Kamu langsung nulis perintahnya, satu per baris. Ketuk bagiannya.'],
        code: [
          [['print', 'Perintah buat nampilin sesuatu ke layar.'], '(', ['"Halo"', 'Tulisan yang mau ditampilin. Harus diapit tanda kutip dua.'], ')'],
        ],
        tip: 'Satu baris itu sudah satu program lengkap. Ga perlu `#include` atau `main()` kayak bahasa lain.',
      },
      {
        title: 'Huruf dan tanda baca itu penting',
        text: [
          'Komputer beda-in huruf besar dan kecil. `print` itu bener, `Print` itu salah.',
          'Tulisan harus diapit tanda kutip dua, kayak `"ini"`. Tanda kurung juga harus lengkap, ada buka ada tutup.',
          'Ketik semuanya sendiri ya. Tulisan abu-abu cuma petunjuk baris berikutnya. Di HP, ada tombol simbol di bawah editor.',
        ],
      },
      {
        title: 'Salah itu gapapa',
        text: [
          'Ga ada nyawa, ga ada timer. Kalau salah, boss cuma nangkis dan kamu coba lagi.',
          'Pesan error-nya juga ramah, jadi kamu tau apa yang kurang. Siap? Boss pertama udah nunggu.',
        ],
      },
    ],
  },

  print: {
    kicker: 'Gulungan Materi',
    title: 'print: bikin program ngomong',
    slides: [
      {
        title: 'print = nampilin tulisan',
        text: ['`print` dipakai buat nampilin sesuatu ke layar. Ketuk tiap bagiannya.'],
        code: [
          [['print', 'Kata ajaib buat nampilin sesuatu ke layar. Semuanya huruf kecil.'], ['(', 'Kurung buka. Isi yang mau ditampilin ditaruh di dalam kurung.'], ['"Halo Dunia"', 'Tulisan yang mau ditampilin. Harus diapit tanda kutip dua.'], [')', 'Kurung tutup. Tiap ( harus punya pasangan ).']],
        ],
      },
      {
        title: 'Tulisan pakai kutip, angka nggak',
        text: [
          '`print("Halo")` menampilkan tulisan Halo.',
          '`print(5)` menampilkan angka `5`. Angka ga perlu kutip.',
          'Tulisan di dalam kutip muncul persis kayak yang kamu ketik, termasuk huruf besar-kecilnya.',
        ],
      },
    ],
  },

  variable: {
    kicker: 'Gulungan Materi',
    title: 'Variable: kotak penyimpan',
    slides: [
      {
        title: 'Variable itu kotak berlabel',
        text: ['Variable adalah kotak buat nyimpen sesuatu. Kotaknya dikasih nama, jadi gampang diambil lagi.'],
        code: [
          [['umur', 'Nama kotaknya. Kamu yang milih. Jangan pakai spasi.'], ' ', ['=', 'Artinya "isi dengan". Bukan "sama dengan".'], ' ', ['19', 'Isi kotaknya. Bilangan bulat, bukan tulisan.']],
        ],
        tip: 'Di Python kamu ga perlu bilang jenis isinya (kayak `int` di bahasa lain). Python tau sendiri.',
      },
      {
        title: 'Lihat isi kotaknya',
        text: ['Buat nampilin isinya, tulis nama kotaknya tanpa tanda kutip.'],
        code: [
          [['print(umur)', 'Yang muncul: `19`. Komputer buka kotak `umur` dan nampilin isinya.']],
          [['print("umur")', 'Yang muncul: `umur`. Karena pakai kutip, dia dianggap tulisan biasa.']],
        ],
        tip: 'Kotak dibuat dulu, baru dipakai. Jadi `umur = 19` ditulis di atas `print`.',
      },
    ],
  },

  operator: {
    kicker: 'Gulungan Materi',
    title: 'Operator: tanda hitung',
    slides: [
      {
        title: 'Python bisa ngitung',
        text: ['Operator itu tanda buat ngitung. Ketuk satu-satu buat lihat contohnya.'],
        code: [
          [['+', 'Tambah. `5 + 2` hasilnya `7`.']],
          [['-', 'Kurang. `5 - 2` hasilnya `3`.']],
          [['*', 'Kali. Pakai tanda bintang, bukan huruf x. `7 * 6` hasilnya `42`.']],
          [['/', 'Bagi. `8 / 2` hasilnya `4.0`. Di Python, hasil bagi selalu ada koma desimalnya.']],
        ],
      },
      {
        title: 'Hitung langsung di print',
        text: ['Kamu ga perlu ngitung sendiri. Taruh hitungannya di `print`, komputer yang ngitung.'],
        code: [
          [['print(7 * 6)', 'Komputer hitung `7 * 6` dulu, terus nampilin hasilnya: `42`. Ga pakai kutip, karena ini hitungan, bukan tulisan.']],
        ],
      },
    ],
  },

  'if-else': {
    kicker: 'Gulungan Materi',
    title: 'if dan else: milih jalan',
    slides: [
      {
        title: 'Titik dua dan jorokan',
        text: ['Kadang program harus milih. Kalau syaratnya cocok, lakukan A. Kalau nggak, lakukan B. Itu gunanya `if` dan `else`. Ketuk bagiannya.'],
        code: [
          [['if', 'Artinya "kalau". Python ga pakai kurung buat syarat.'], ' ', ['nilai >= 75', 'Ini syaratnya. Artinya: apakah `nilai` `75` atau lebih? Jawabannya cuma benar atau salah.'], [':', 'Titik dua wajib. Artinya "isinya ada di baris bawah".']],
          ['    ', ['print("Lulus")', 'Menjorok 4 spasi = isi dari if. Tekan Tab di editor buat nyorok. Jalan kalau syarat benar.']],
          [['else:', 'Artinya "kalau nggak". Sejajar sama if, dan pakai titik dua juga.']],
          ['    ', ['print("Remedial")', 'Isi dari else, menjorok juga. Jalan kalau syarat di atas salah.']],
        ],
        tip: 'Di Python, jorokan itu penting banget. Baris yang menjorok = isi dari baris titik dua di atasnya.',
      },
      {
        title: 'Tanda buat membandingkan',
        text: ['Buat bikin syarat, kita bandingin dua angka. Ketuk tandanya.'],
        code: [
          [['>', 'Lebih besar dari. `80 > 75` itu benar.'], '   ', ['<', 'Lebih kecil dari. `80 < 75` itu salah.']],
          [['>=', 'Lebih besar atau sama dengan. Ketik `>` lalu `=`, tanpa spasi.'], '  ', ['<=', 'Lebih kecil atau sama dengan.']],
          [['==', 'Sama dengan. Pakai dua tanda `=`. Satu `=` buat mengisi kotak, dua `==` buat membandingkan.'], '  ', ['!=', 'Tidak sama dengan.']],
        ],
      },
    ],
  },

  'for loop': {
    kicker: 'Gulungan Materi',
    title: 'for: ngulang otomatis',
    slides: [
      {
        title: 'Loop itu pengulangan',
        text: ['Mau nampilin angka 1 sampai 100? Capek kalau nulis satu-satu. Pakai `for`, komputer yang ngulang. Ketuk tiap bagiannya.'],
        code: [
          [
            ['for', 'Artinya "untuk setiap". Tanda mulai pengulangan.'],
            ' ',
            ['i', 'Kotak buat ngitung putaran. Isinya berubah tiap putaran. Namanya boleh kamu ganti.'],
            ' ',
            ['in', 'Artinya "di dalam".'],
            ' ',
            ['range(1, 6)', 'Deretan angka dari `1` sampai `5`. Angka akhir (`6`) ga ikut. Jadi `i` jadi 1, 2, 3, 4, 5.'],
            [':', 'Titik dua wajib. Isi yang diulang ada di baris bawah.'],
          ],
          ['    ', ['print(i)', 'Menjorok 4 spasi = isi yang diulang tiap putaran.']],
        ],
        tip: 'Hati-hati: `range(1, 6)` berhenti sebelum 6. Mau sampai 5? Tulis 6.',
      },
      {
        title: 'Pindah baris',
        text: ['Di Python, `print` otomatis pindah baris tiap selesai. Jadi angka muncul satu per baris, tanpa tambahan apa-apa.'],
      },
    ],
  },
};

// Penerjemah error Python (Traceback) jadi penjelasan ramah.
// Bentuknya sama kayak ErrorHelp.explain: { line, codeLine, message, raw }.
const PyErrors = (() => {
  const KNOWN = ['print', 'range', 'for', 'in', 'if', 'else', 'int', 'str'];

  function distance(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const keep = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = keep;
      }
    }
    return row[b.length];
  }

  function nameHelp(name) {
    const lower = name.toLowerCase();
    let near = null;
    let best = 3;
    KNOWN.forEach((kw) => { const d = distance(lower, kw); if (d < best) { best = d; near = kw; } });
    if (near && near !== name) {
      return lower === near
        ? `Huruf besar-kecil ngaruh di Python. Tulis '${near}', bukan '${name}'.`
        : `'${name}' ga dikenal. Mungkin salah ketik, maksudmu '${near}'?`;
    }
    return `'${name}' belum dikenal. Kemungkinan salah ketik, atau variable-nya belum dibuat di baris atasnya.`;
  }

  function explain(output, code) {
    const lines = code.split('\n');
    const all = [...output.matchAll(/File "[^"]*", line (\d+)/g)];
    const line = all.length ? parseInt(all[all.length - 1][1], 10) : 0;
    const errLine = output.trim().split('\n').filter((l) => /^\w*(Error|Exception)\b/.test(l)).pop() || '';
    const [, kind = '', text = ''] = errLine.match(/^(\w+):\s*(.*)$/) || [];
    const codeLine = (lines[line - 1] || '').trim();
    let m;
    let message;

    if (/EOL while scanning string literal|unterminated string/.test(text)) {
      message = 'Tanda kutip penutup (") belum ada di baris ini. Teks harus diapit dua tanda kutip.';
    } else if (/unexpected EOF|was never closed/.test(text)) {
      message = 'Kodenya belum selesai. Cek ada kurung ( yang belum ditutup ).';
    } else if (kind === 'IndentationError' && /expected an indented block/.test(text)) {
      message = 'Baris di bawah titik dua (:) harus menjorok ke dalam. Tekan Tab, atau ketik 4 spasi.';
    } else if (kind === 'IndentationError' && /unexpected indent/.test(text)) {
      message = 'Baris ini menjorok padahal ga perlu. Rapatkan ke kiri, sejajar baris di atasnya.';
    } else if (kind === 'IndentationError') {
      message = 'Jorokan baris ini ga sejajar sama baris lain di blok yang sama.';
    } else if (kind === 'SyntaxError' && /^\s*(if|elif|else|for|while|def)\b/.test(codeLine) && !/:\s*$/.test(codeLine)) {
      message = 'Titik dua (:) kemungkinan kurang di akhir baris ini. if, else, dan for harus diakhiri :';
    } else if (kind === 'SyntaxError' && /^\s*(if|while)\b[^=!<>]*[^=!<>]=[^=]/.test(codeLine)) {
      message = 'Buat membandingkan pakai == (dua sama dengan), bukan = yang buat mengisi kotak.';
    } else if ((m = text.match(/name '(.+)' is not defined/))) {
      message = nameHelp(m[1]);
    } else if (kind === 'TypeError') {
      message = 'Jenis datanya ga cocok, misalnya nambah tulisan dengan angka. Cek isi baris ini.';
    } else if (kind === 'ZeroDivisionError') {
      message = 'Ga bisa bagi dengan 0.';
    } else if (kind === 'SyntaxError') {
      message = 'Ada yang salah ketik atau simbolnya kurang di sekitar baris ini. Cek kutip, kurung, dan titik dua.';
    } else {
      message = 'Ada yang salah di sekitar baris ini. Baca lagi pelan-pelan.';
    }

    return { line, codeLine, message, raw: errLine };
  }

  return { explain };
})();