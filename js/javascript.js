// Data versi JavaScript: level, materi, dan penerjemah error.
// Boss, sprite, dan urutan konsep sama persis kayak versi C++ dan Python.
// Yang beda cuma soal, panduan abu-abu, aturan tambahan, materi, dan pesan error.
// Kode jalan langsung di browser (Web Worker), lihat runJavaScript() di judge.js.
// Dipakai lang.js kalau pemain milih JavaScript.

const jsl = (i, over) => ({ ...LEVELS[i], ...over });

const LEVELS_JS = [
  jsl(0, {
    concept: 'console.log',
    task: 'Print Slime lemah sama tulisan. Buat program yang menampilkan teks "Halo Dunia" di layar.',
    ghost: ['console.log("Halo Dunia");'],
    requires: [],
  }),
  jsl(1, {
    task: 'Var Goblin nyimpen barang di dalam kotak (variable). Buat variable bernama umur yang isinya 19, lalu tampilkan isinya.',
    ghost: ['let umur = 19;', 'console.log(umur);'],
    requires: [{ pattern: /(?:let|const|var)\s+umur\s*=\s*19/, message: 'Outputnya udah bener, tapi pakai variable dulu ya: let umur = 19;' }],
  }),
  jsl(2, {
    ghost: ['console.log(7 * 6);'],
    requires: [{ pattern: /7\s*\*\s*6/, message: 'Hasilnya bener, tapi hitung pakai operator * ya, jangan langsung ketik 42.' }],
  }),
  jsl(3, {
    task: 'Fork Wraith berdiri di persimpangan dan selalu milih salah satu jalan. Buat variable nilai = 80. Kalau nilai >= 75 (lebih dari atau sama dengan: ketik tanda > lalu tanda =), tampilkan "Lulus". Kalau tidak, tampilkan "Remedial".',
    ghost: ['let nilai = 80;', 'if (nilai >= 75) {', '    console.log("Lulus");', '} else {', '    console.log("Remedial");', '}'],
    requires: [
      { pattern: /(?:let|const|var)\s+nilai\s*=\s*80/, message: 'Outputnya udah bener, tapi bikin dulu variable-nya ya: let nilai = 80;' },
      { pattern: /if\s*\([^)]*nilai[^)]*\)/, message: 'Hampir! Pilih jalannya pakai if (...) yang ngecek nilai, jangan langsung tampilin "Lulus".' },
      { pattern: /else/, message: 'Jalan kedua belum ada. Tambahin else buat kasus nilainya di bawah 75.' },
    ],
  }),
  jsl(4, {
    task: 'Loop Serpent muter terus tanpa henti. Hentikan pakai for. Tampilkan angka 1 sampai 5, satu angka per baris.',
    ghost: ['for (let i = 1; i <= 5; i++) {', '    console.log(i);', '}'],
    requires: [{ pattern: /for\s*\(/, message: 'Outputnya bener, tapi pakai for ya. Ular ini cuma tumbang sama loop.' }],
  }),
  jsl(5, {
    task: 'Function Golem cuma bisa digerakkan lewat perintah bernama (function). Buat function bernama sapa yang menampilkan "Halo Golem", lalu panggil function itu dua kali.',
    ghost: ['function sapa() {', '    console.log("Halo Golem");', '}', 'sapa();', 'sapa();'],
    requires: [
      { pattern: /function\s+sapa\s*\(\s*\)\s*\{/, message: 'Outputnya udah bener, tapi bikin dulu function-nya ya: function sapa() { ... }' },
      { pattern: /^sapa\(\)\s*;[ \t]*$[\s\S]*^sapa\(\)\s*;[ \t]*$/m, message: 'Function-nya harus dipanggil dua kali, masing-masing di barisnya sendiri: sapa();' },
    ],
  }),
  jsl(6, {
    concept: 'array',
    task: 'Array Hydra punya tiga kepala bernomor, masing-masing bawa angka 10, 20, dan 30. Simpan ketiganya di satu array bernama skor, lalu tampilkan kepala pertama dan kepala ketiga, masing-masing di baris sendiri.',
    ghost: ['let skor = [10, 20, 30];', 'console.log(skor[0]);', 'console.log(skor[2]);'],
    requires: [
      { pattern: /(?:let|const|var)\s+skor\s*=\s*\[/, message: 'Outputnya udah bener, tapi simpan dulu di array ya: let skor = [10, 20, 30];' },
      { pattern: /skor\s*\[\s*0\s*\][\s\S]*skor\s*\[\s*2\s*\]/, message: 'Ambil isinya pakai nomor kepala: skor[0] buat yang pertama, skor[2] buat yang ketiga.' },
    ],
  }),
  jsl(7, {
    concept: 'while loop',
    task: 'While Drake menyerang selama masih ada tenaga. Buat variable n = 3. Selama n >= 1, tampilkan n lalu kurangi n sebanyak 1. Hasilnya hitung mundur 3, 2, 1 (satu angka per baris).',
    ghost: ['let n = 3;', 'while (n >= 1) {', '    console.log(n);', '    n--;', '}'],
    requires: [
      { pattern: /(?:let|var)\s+n\s*=\s*3/, message: 'Outputnya udah bener, tapi bikin dulu variable-nya ya: let n = 3;' },
      { pattern: /while\s*\(/, message: 'Hampir! Naga ini cuma tumbang sama while. Pakai while (...) { ... }' },
    ],
  }),
  jsl(8, {
    concept: 'object',
    boss: { ...LEVELS[8].boss, name: 'Object Knight' },
    task: 'Object Knight kebal sama data yang berserakan. Buat object bernama k yang punya nama "Arthur" dan hp 100, lalu tampilkan: Arthur 100',
    expected: 'Arthur 100',
    ghost: ['let k = {', '    nama: "Arthur",', '    hp: 100', '};', 'console.log(k.nama, k.hp);'],
    requires: [
      { pattern: /\{[\s\S]*nama\s*:\s*["']Arthur["'][\s\S]*hp\s*:\s*100[\s\S]*\}/, message: 'Outputnya udah bener, tapi bikin dulu object-nya ya: let k = { nama: "Arthur", hp: 100 };' },
      { pattern: /k\s*\.\s*nama/, message: 'Ambil datanya lewat titik: k.nama dan k.hp' },
    ],
  }),
  jsl(9, {
    concept: 'gabungan',
    boss: { ...LEVELS[9].boss, name: 'Undefined Dragon' },
    task: 'Boss terakhir! Undefined Dragon cuma kalah sama gabungan jurusmu. Buat function tambah(a, b) yang mengembalikan a + b. Lalu buat total = 0. Pakai for dari 1 sampai 3, dan tiap putaran isi total dengan tambah(total, i). Tampilkan total di akhir.',
    ghost: ['function tambah(a, b) {', '    return a + b;', '}', 'let total = 0;', 'for (let i = 1; i <= 3; i++) {', '    total = tambah(total, i);', '}', 'console.log(total);'],
    requires: [
      { pattern: /function\s+tambah\s*\(\s*\w+\s*,\s*\w+\s*\)/, message: 'Hasilnya bener, tapi bikin dulu function-nya ya: function tambah(a, b) { return a + b; }' },
      { pattern: /for\s*\(/, message: 'Naga ini juga lemah sama for. Pakai for buat ngulang dari 1 sampai 3.' },
      { pattern: /=\s*tambah\s*\(/, message: 'Panggil function-nya di dalam loop: total = tambah(total, i);' },
    ],
  }),
];

const LESSON_FOR_CONCEPT_JS = {
  'console.log': 'console.log',
  variable: 'variable',
  operator: 'operator',
  'if-else': 'if-else',
  'for loop': 'for loop',
  function: 'function',
  array: 'array',
  'while loop': 'while loop',
  object: 'object',
  gabungan: 'gabungan',
};

const LESSONS_JS = {
  dasar: {
    kicker: 'Level 0: Zona Latihan',
    title: 'Kenalan sama JavaScript',
    slides: [
      {
        title: 'Kode itu kayak resep',
        text: [
          'Komputer itu kayak koki yang nurut banget. Dia cuma ngerjain apa yang kamu tulis, satu baris demi satu baris, dari atas ke bawah.',
          'Tulisan itu namanya kode. Di game ini, kamu nulis kode. Kalau hasilnya bener, boss-nya kalah.',
        ],
      },
      {
        title: 'JavaScript itu bahasa web',
        text: ['JavaScript jalan di tiap browser, jadi hampir semua website pakai bahasa ini. Di game ini, kodemu langsung jalan di browser-mu, tanpa kerangka panjang. Ketuk bagiannya.'],
        code: [
          [['console.log', 'Perintah buat nampilin sesuatu. Huruf kecil semua, ada titik di tengah.'], '(', ['"Halo"', 'Tulisan yang mau ditampilin. Harus diapit tanda kutip dua.'], [')', 'Kurung tutup.'], [';', 'Titik koma, tanda akhir perintah.']],
        ],
        tip: 'Satu baris itu sudah satu program lengkap. Ga perlu `#include` atau `main()` kayak C++.',
      },
      {
        title: 'Huruf dan tanda baca itu penting',
        text: [
          'Komputer beda-in huruf besar dan kecil. `console.log` itu bener, `Console.Log` itu salah.',
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

  'console.log': {
    kicker: 'Gulungan Materi',
    title: 'console.log: bikin program ngomong',
    slides: [
      {
        title: 'console.log = nampilin tulisan',
        text: ['`console.log` dipakai buat nampilin sesuatu. Ketuk tiap bagiannya.'],
        code: [
          [['console.log', 'Kata ajaib buat nampilin sesuatu. Huruf kecil semua, ada titik di tengahnya.'], ['(', 'Kurung buka. Isi yang mau ditampilin ditaruh di dalam kurung.'], ['"Halo Dunia"', 'Tulisan yang mau ditampilin. Harus diapit tanda kutip dua.'], [')', 'Kurung tutup. Tiap ( harus punya pasangan ).'], [';', 'Titik koma. Penutup perintah.']],
        ],
      },
      {
        title: 'Tulisan pakai kutip, angka nggak',
        text: [
          '`console.log("Halo")` menampilkan tulisan Halo.',
          '`console.log(5)` menampilkan angka `5`. Angka ga perlu kutip.',
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
          [['let', 'Artinya "bikin kotak baru". Selalu huruf kecil.', true], ' ', ['umur', 'Nama kotaknya. Kamu yang milih. Jangan pakai spasi.'], ' ', ['=', 'Artinya "isi dengan". Bukan "sama dengan".'], ' ', ['19', 'Isi kotaknya. Bilangan bulat, bukan tulisan.'], [';', 'Titik koma di akhir.']],
        ],
        tip: 'Di JavaScript kamu ga perlu bilang jenis isinya (kayak `int` di C++). Cukup tulis `let`.',
      },
      {
        title: 'Lihat isi kotaknya',
        text: ['Buat nampilin isinya, tulis nama kotaknya tanpa tanda kutip.'],
        code: [
          [['console.log(umur);', 'Yang muncul: `19`. Komputer buka kotak `umur` dan nampilin isinya.']],
          [['console.log("umur");', 'Yang muncul: `umur`. Karena pakai kutip, dia dianggap tulisan biasa.']],
        ],
        tip: 'Kotak dibuat dulu, baru dipakai. Jadi `let umur = 19;` ditulis di atas `console.log`.',
      },
    ],
  },

  operator: {
    kicker: 'Gulungan Materi',
    title: 'Operator: tanda hitung',
    slides: [
      {
        title: 'JavaScript bisa ngitung',
        text: ['Operator itu tanda buat ngitung. Ketuk satu-satu buat lihat contohnya.'],
        code: [
          [['+', 'Tambah. `5 + 2` hasilnya `7`.']],
          [['-', 'Kurang. `5 - 2` hasilnya `3`.']],
          [['*', 'Kali. Pakai tanda bintang, bukan huruf x. `7 * 6` hasilnya `42`.']],
          [['/', 'Bagi. `8 / 2` hasilnya `4`.']],
        ],
      },
      {
        title: 'Hitung langsung di console.log',
        text: ['Kamu ga perlu ngitung sendiri. Taruh hitungannya di `console.log`, komputer yang ngitung.'],
        code: [
          [['console.log(7 * 6);', 'Komputer hitung `7 * 6` dulu, terus nampilin hasilnya: `42`. Ga pakai kutip, karena ini hitungan, bukan tulisan.']],
        ],
      },
    ],
  },

  'if-else': {
    kicker: 'Gulungan Materi',
    title: 'if dan else: milih jalan',
    slides: [
      {
        title: 'Kurung dan kurawal',
        text: ['Kadang program harus milih. Kalau syaratnya cocok, lakukan A. Kalau nggak, lakukan B. Itu gunanya `if` dan `else`. Ketuk bagiannya.'],
        code: [
          [['if', 'Artinya "kalau".'], ' ', ['(nilai >= 75)', 'Syaratnya ditulis di dalam kurung. Artinya: apakah `nilai` `75` atau lebih? Jawabannya cuma benar atau salah.'], ' ', ['{', 'Kurawal buka. Isi dari if ada di dalamnya.']],
          ['    ', ['console.log("Lulus");', 'Menjorok 4 spasi biar rapi. Jalan kalau syarat benar.']],
          [['} else {', 'Artinya "kalau nggak". Kurawal tutup if, lalu buka isi else.']],
          ['    ', ['console.log("Remedial");', 'Isi dari else. Jalan kalau syarat di atas salah.']],
          [['}', 'Kurawal tutup. Tiap { harus punya pasangan }.']],
        ],
        tip: 'Jorokan di JavaScript cuma buat rapi. Yang penting itu kurung kurawal { }.',
      },
      {
        title: 'Tanda buat membandingkan',
        text: ['Buat bikin syarat, kita bandingin dua angka. Ketuk tandanya.'],
        code: [
          [['>', 'Lebih besar dari. `80 > 75` itu benar.'], '   ', ['<', 'Lebih kecil dari. `80 < 75` itu salah.']],
          [['>=', 'Lebih besar atau sama dengan. Ketik `>` lalu `=`, tanpa spasi.'], '  ', ['<=', 'Lebih kecil atau sama dengan.']],
          [['===', 'Sama dengan. Pakai tiga tanda `=`. Satu `=` buat mengisi kotak, tiga `===` buat membandingkan.'], '  ', ['!==', 'Tidak sama dengan.']],
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
            ['for (', 'Tanda mulai pengulangan. Isi kurungnya ada tiga bagian, dipisah titik koma.'],
            ['let i = 1;', 'Bagian 1: kotak buat ngitung putaran, mulai dari `1`. Namanya boleh kamu ganti.'],
            ' ',
            ['i <= 5;', 'Bagian 2: syarat. Selama `i` masih 5 atau kurang, putar lagi.'],
            ' ',
            ['i++', 'Bagian 3: tiap putaran selesai, `i` nambah 1. Jadi `i` jadi 1, 2, 3, 4, 5.'],
            [') {', 'Kurung tutup dan kurawal buka. Isi yang diulang ada di dalamnya.'],
          ],
          ['    ', ['console.log(i);', 'Menjorok 4 spasi. Ini isi yang diulang tiap putaran.']],
          [['}', 'Kurawal tutup.']],
        ],
        tip: 'Hati-hati: `i <= 5` ikut ngitung angka 5. Kalau pakai `i < 5`, berhenti di 4.',
      },
      {
        title: 'Pindah baris',
        text: ['Di JavaScript, `console.log` otomatis pindah baris tiap selesai. Jadi angka muncul satu per baris, tanpa tambahan apa-apa.'],
      },
    ],
  },

  function: {
    kicker: 'Gulungan Materi',
    title: 'function: resep yang dikasih nama',
    slides: [
      {
        title: 'Bikin perintah sendiri',
        text: ['Function itu sekumpulan perintah yang dikasih nama. Sekali bikin, bisa dipakai berkali-kali. Ketuk tiap bagiannya.'],
        code: [
          [['function', 'Artinya "bikin function". Selalu huruf kecil.', true], ' ', ['sapa', 'Nama function-nya. Kamu yang milih.'], ['()', 'Tanda kurung wajib ada, walau kosong.'], ' ', ['{', 'Kurawal buka. Isi function ada di dalamnya.']],
          ['    ', ['console.log("Halo Golem");', 'Ini yang dikerjain tiap function dipanggil.']],
          [['}', 'Kurawal tutup.']],
        ],
      },
      {
        title: 'Panggil pakai namanya',
        text: ['Bikin function itu baru nulis resep. Resepnya baru "dimasak" kalau dipanggil.'],
        code: [
          [['sapa();', 'Panggil function. Satu panggilan = isi function jalan satu kali.', true]],
          [['sapa();', 'Dipanggil dua kali, jadi tulisannya muncul dua kali.']],
        ],
        tip: 'Function dibuat dulu di atas, baru dipanggil di bawahnya.',
      },
    ],
  },

  array: {
    kicker: 'Gulungan Materi',
    title: 'array: deretan kotak bernomor',
    slides: [
      {
        title: 'Banyak isi, satu nama',
        text: ['Kalau datanya banyak, bikin kotak satu-satu itu capek. Array nyimpen banyak isi sekaligus di bawah satu nama.'],
        code: [
          [['let skor', 'Nama array-nya. Kamu yang milih.'], ' = ', ['[10, 20, 30]', 'Isinya ditulis di dalam kurung siku, dipisah koma. Di sini ada tiga isi.', true], ';'],
        ],
      },
      {
        title: 'Nomornya mulai dari 0',
        text: ['Tiap isi punya nomor urut. Yang pertama bukan nomor 1, tapi nomor 0.'],
        code: [
          [['skor[0]', 'Isi pertama: `10`.'], '  ', ['skor[1]', 'Isi kedua: `20`.'], '  ', ['skor[2]', 'Isi ketiga: `30`.', true]],
          [['console.log(skor[2]);', 'Tampilin isi ketiga: `30`.']],
        ],
        tip: 'Array berisi 3 hal punya nomor 0, 1, 2. Kalau minta nomor 3, hasilnya `undefined` (kosong).',
      },
    ],
  },

  'while loop': {
    kicker: 'Gulungan Materi',
    title: 'while: ulangi selama masih benar',
    slides: [
      {
        title: 'Ulang selama syaratnya benar',
        text: ['`while` ngulang isinya terus selama syaratnya masih benar. Kalau udah salah, berhenti. Ketuk bagiannya.'],
        code: [
          ['let n = 3;'],
          [['while', 'Artinya "selama". Ngulang isinya selama syarat di sebelahnya benar.', true], ' ', ['(n >= 1)', 'Syaratnya. Selama `n` masih 1 atau lebih, putar lagi.'], ' {'],
          ['    ', ['console.log(n);', 'Tampilin `n`. Menjorok = isi yang diulang.']],
          ['    ', ['n--;', 'Kurangi `n` sebanyak 1. Penting: tanpa ini, `n` ga pernah berubah dan loop-nya ga pernah berhenti.']],
          ['}'],
        ],
      },
      {
        title: 'Jangan lupa ubah angkanya',
        text: [
          '`n--` artinya "kurangi `n` dengan 1". Jadi `n` berubah 3, 2, 1, lalu jadi 0 dan loop berhenti.',
          'Kalau lupa, game bakal bilang "Programnya kelamaan jalan". Itu tanda loop-mu ga pernah berhenti.',
        ],
        tip: '`for` cocok kalau kamu tau berapa kali ngulang. `while` cocok kalau ngulangnya "selama masih ...".',
      },
    ],
  },

  object: {
    kicker: 'Gulungan Materi',
    title: 'object: satu benda, banyak data',
    slides: [
      {
        title: 'Object itu kotak berlabel banyak',
        text: ['Kadang satu benda punya banyak data: nama, hp, dst. Object nyimpen semuanya jadi satu. Ketuk tiap bagiannya.'],
        code: [
          [['let k', 'Nama object-nya. Kamu yang milih.'], ' = ', ['{', 'Kurawal buka. Isi object ditulis di dalamnya.', true]],
          ['    ', ['nama: "Arthur",', 'Satu data: labelnya `nama`, isinya tulisan Arthur. Pakai titik dua, dan diakhiri koma.']],
          ['    ', ['hp: 100', 'Data kedua. Yang terakhir ga perlu koma.']],
          [['};', 'Kurawal tutup dan titik koma.']],
        ],
      },
      {
        title: 'Ambil data lewat titik',
        text: ['Buat ngambil satu data, tulis nama object, titik, lalu labelnya.'],
        code: [
          [['k.nama', 'Hasilnya `Arthur`. Titik artinya "ambil bagian ini dari `k`".'], '  ', ['k.hp', 'Hasilnya `100`.']],
          [['console.log(k.nama, k.hp);', 'Tampilnya: Arthur 100. Tanda koma di `console.log` ngasih spasi otomatis.', true]],
        ],
      },
    ],
  },

  gabungan: {
    kicker: 'Gulungan Materi',
    title: 'Boss terakhir: gabungin semua',
    slides: [
      {
        title: 'Function bisa ngasih balik hasil',
        text: ['Function bisa nerima data (parameter) dan ngasih hasil balik (return).'],
        code: [
          [['function tambah(a, b) {', '`a` dan `b` itu parameter: data yang dikasih waktu function dipanggil.', true]],
          ['    ', ['return a + b;', '`return` ngasih hasil balik ke yang manggil. Di sini hasilnya `a + b`.']],
          ['}'],
          [['tambah(2, 3)', 'Hasilnya `5`. Bisa ditaruh di variable: `let x = tambah(2, 3);`.']],
        ],
      },
      {
        title: 'Rakit semuanya',
        text: [
          'Soal terakhir ngegabungin function, variable, dan for. Ikuti jalannya:',
          'Awalnya `total` = 0. Putaran 1: `total` = 0 + 1 = 1. Putaran 2: 1 + 2 = 3. Putaran 3: 3 + 3 = 6.',
        ],
        tip: 'Variable `total` dibuat pakai `let` biar isinya boleh berubah tiap putaran.',
      },
    ],
  },
};

// Penerjemah error JavaScript jadi penjelasan ramah.
// Bentuknya sama kayak ErrorHelp.explain: { line, codeLine, message, raw }.
// `output` dibikin runJavaScript() di judge.js: baris 1 = "NamaError: pesan", baris 2 = "line N".
const JsErrors = (() => {
  const KNOWN = ['console', 'log', 'let', 'const', 'for', 'while', 'if', 'else', 'function', 'return', 'true', 'false'];

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
        ? `Huruf besar-kecil ngaruh di JavaScript. Tulis '${near}', bukan '${name}'.`
        : `'${name}' ga dikenal. Mungkin salah ketik, maksudmu '${near}'?`;
    }
    return `'${name}' belum dikenal. Kemungkinan salah ketik, atau variable-nya belum dibuat di baris atasnya.`;
  }

  function lastCodeLine(lines) {
    for (let i = lines.length - 1; i >= 0; i--) if (lines[i].trim()) return i + 1;
    return 1;
  }

  function explain(output, code) {
    const lines = code.split('\n');
    const head = output.trim().split('\n')[0] || '';
    const [, kind = '', text = ''] = head.match(/^(\w+):\s*(.*)$/) || [];
    let line = parseInt((output.match(/^line (\d+)/m) || [])[1], 10) || 0;
    let m;
    let message;

    if (/Unexpected end of input|Unexpected token '?end'? of/i.test(text)) {
      line = lastCodeLine(lines);
      message = 'Kodenya belum selesai: ada { atau ( yang belum ditutup. Tiap { harus punya pasangan }.';
    } else if (/missing \) after argument list/.test(text)) {
      message = 'Kurung tutup ) kurang di baris ini, atau ada tanda koma yang ketinggalan. Tiap ( harus punya pasangan ).';
    } else if (/Invalid or unexpected token|Unterminated string|Unterminated template/.test(text)) {
      message = 'Tanda kutip penutup (") belum ada di baris ini, atau ada karakter aneh. Teks harus diapit dua tanda kutip.';
    } else if (/Unexpected token '\}'/.test(text)) {
      message = 'Ada } berlebih. Cek lagi pasangan { dan } di kodemu.';
    } else if (/Unexpected token '(?:else)'/.test(text)) {
      message = 'else harus langsung setelah blok if. Cek kurung kurawal } sebelum else.';
    } else if ((m = text.match(/Identifier '(.+)' has already been declared/))) {
      message = `'${m[1]}' udah dibuat sebelumnya. Kotak cukup dibuat sekali pakai let, setelah itu langsung ditulis tanpa let.`;
    } else if (/Assignment to constant variable/.test(text)) {
      message = 'Isi variable yang dibuat pakai const ga bisa diubah. Pakai let kalau isinya mau berubah.';
    } else if (/Unexpected (?:identifier|string|number)/.test(text)) {
      message = 'Ada bagian yang nyasar. Biasanya ada tanda koma, titik koma, atau operator yang ketinggalan di sekitar baris ini.';
    } else if ((m = text.match(/^(.+) is not defined$/))) {
      message = nameHelp(m[1]);
    } else if ((m = text.match(/^(.+) is not a function$/))) {
      const name = m[1];
      message = name.toLowerCase().replace(/\s/g, '') === 'console.log'
        ? "Tulis console.log, semuanya huruf kecil."
        : `'${name}' bukan function. Cek ejaan dan huruf besar-kecilnya, atau function-nya belum dibuat.`;
    } else if (/Cannot read propert(?:y|ies) of (?:undefined|null)/.test(text)) {
      message = 'Kamu ngambil data dari sesuatu yang kosong (undefined). Cek nomor array atau nama object-nya.';
    } else if (kind === 'RangeError') {
      message = 'Function-nya manggil dirinya sendiri tanpa henti. Cek lagi isi function-nya.';
    } else if (kind === 'SyntaxError') {
      message = 'Ada yang salah ketik atau simbolnya kurang di sekitar baris ini. Cek kutip, kurung, dan kurawal.';
    } else {
      message = 'Ada yang salah di sekitar baris ini. Baca lagi pelan-pelan.';
    }

    return { line, codeLine: (lines[line - 1] || '').trim(), message, raw: head };
  }

  return { explain };
})();