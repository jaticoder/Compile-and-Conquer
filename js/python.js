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
  py(5, {
    concept: 'function',
    task: 'Function Golem cuma bisa digerakkan lewat perintah bernama (function). Buat function bernama sapa yang menampilkan "Halo Golem", lalu panggil function itu dua kali.',
    ghost: ['def sapa():', 'print("Halo Golem")', 'sapa()', 'sapa()'],
    requires: [
      { pattern: /def\s+sapa\s*\(\s*\)\s*:/, message: 'Outputnya udah bener, tapi bikin dulu function-nya ya: def sapa():' },
      { pattern: /^sapa\(\)[ \t]*$[\s\S]*^sapa\(\)[ \t]*$/m, message: 'Function-nya harus dipanggil dua kali, masing-masing di barisnya sendiri: sapa()' },
    ],
  }),
  py(6, {
    concept: 'list',
    task: 'Array Hydra punya tiga kepala bernomor, masing-masing bawa angka 10, 20, dan 30. Simpan ketiganya di satu list bernama skor, lalu tampilkan kepala pertama dan kepala ketiga, masing-masing di baris sendiri.',
    ghost: ['skor = [10, 20, 30]', 'print(skor[0])', 'print(skor[2])'],
    requires: [
      { pattern: /skor\s*=\s*\[/, message: 'Outputnya udah bener, tapi simpan dulu di list ya: skor = [10, 20, 30]' },
      { pattern: /skor\s*\[\s*0\s*\][\s\S]*skor\s*\[\s*2\s*\]/, message: 'Ambil isinya pakai nomor kepala: skor[0] buat yang pertama, skor[2] buat yang ketiga.' },
    ],
  }),
  py(7, {
    concept: 'while loop',
    task: 'While Drake menyerang selama masih ada tenaga. Buat variable n = 3. Selama n >= 1, tampilkan n lalu kurangi n sebanyak 1. Hasilnya hitung mundur 3, 2, 1 (satu angka per baris).',
    ghost: ['n = 3', 'while n >= 1:', 'print(n)', 'n -= 1'],
    requires: [
      { pattern: /\bn\s*=\s*3/, message: 'Outputnya udah bener, tapi bikin dulu variable-nya ya: n = 3' },
      { pattern: /while\s+[^\n:]+:/, message: 'Hampir! Naga ini cuma tumbang sama while. Pakai while ... :' },
    ],
  }),
  py(8, {
    concept: 'class',
    boss: { ...LEVELS[8].boss, name: 'Class Knight' },
    task: 'Class Knight kebal sama data yang berserakan. Buat class bernama Ksatria yang punya nama dan hp (isi lewat __init__). Bikin satu Ksatria dengan nama "Arthur" dan hp 100, lalu tampilkan: Arthur 100',
    expected: 'Arthur 100',
    ghost: ['class Ksatria:', 'def __init__(self, nama, hp):', 'self.nama = nama', 'self.hp = hp', 'k = Ksatria("Arthur", 100)', 'print(k.nama, k.hp)'],
    requires: [
      { pattern: /class\s+Ksatria\s*:/, message: 'Outputnya udah bener, tapi bikin dulu class-nya ya: class Ksatria:' },
      { pattern: /Ksatria\s*\(\s*["']Arthur["']\s*,\s*100\s*\)/, message: 'Bikin ksatrianya dari class: k = Ksatria("Arthur", 100)' },
    ],
  }),
  py(9, {
    concept: 'gabungan',
    boss: { ...LEVELS[9].boss, name: 'Traceback Dragon' },
    task: 'Boss terakhir! Traceback Dragon cuma kalah sama gabungan jurusmu. Buat function tambah(a, b) yang mengembalikan a + b. Lalu buat total = 0. Pakai for dari 1 sampai 3, dan tiap putaran isi total dengan tambah(total, i). Tampilkan total di akhir.',
    ghost: ['def tambah(a, b):', 'return a + b', 'total = 0', 'for i in range(1, 4):', 'total = tambah(total, i)', 'print(total)'],
    requires: [
      { pattern: /def\s+tambah\s*\(\s*\w+\s*,\s*\w+\s*\)\s*:/, message: 'Hasilnya bener, tapi bikin dulu function-nya ya: def tambah(a, b):' },
      { pattern: /for\s+\w+\s+in\b/, message: 'Naga ini juga lemah sama for. Pakai for buat ngulang dari 1 sampai 3.' },
      { pattern: /=\s*tambah\s*\(/, message: 'Panggil function-nya di dalam loop: total = tambah(total, i)' },
    ],
  }),
];

const LESSON_FOR_CONCEPT_PY = {
  print: 'print',
  variable: 'variable',
  operator: 'operator',
  'if-else': 'if-else',
  'for loop': 'for loop',
  function: 'function',
  list: 'list',
  'while loop': 'while loop',
  class: 'class',
  gabungan: 'gabungan',
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

  function: {
    kicker: 'Gulungan Materi',
    title: 'function: resep yang dikasih nama',
    slides: [
      {
        title: 'Bikin perintah sendiri',
        text: ['Function itu sekumpulan perintah yang dikasih nama. Sekali bikin, bisa dipakai berkali-kali. Ketuk tiap bagiannya.'],
        code: [
          [['def', 'Artinya "bikin function". Selalu huruf kecil.', true], ' ', ['sapa', 'Nama function-nya. Kamu yang milih.'], ['()', 'Tanda kurung wajib ada, walau kosong.'], [':', 'Titik dua wajib. Artinya "isinya ada di baris bawah".']],
          ['    ', ['print("Halo Golem")', 'Menjorok 4 spasi = isi function. Ini yang dikerjain tiap function dipanggil.']],
        ],
      },
      {
        title: 'Panggil pakai namanya',
        text: ['Bikin function itu baru nulis resep. Resepnya baru "dimasak" kalau dipanggil.'],
        code: [
          [['sapa()', 'Panggil function. Ga menjorok, sejajar sama `def`. Satu panggilan = isi function jalan satu kali.', true]],
          [['sapa()', 'Dipanggil dua kali, jadi tulisannya muncul dua kali.']],
        ],
        tip: 'Function dibuat dulu di atas, baru dipanggil di bawahnya.',
      },
    ],
  },

  list: {
    kicker: 'Gulungan Materi',
    title: 'list: deretan kotak bernomor',
    slides: [
      {
        title: 'Banyak isi, satu nama',
        text: ['Kalau datanya banyak, bikin kotak satu-satu itu capek. List nyimpen banyak isi sekaligus di bawah satu nama.'],
        code: [
          [['skor', 'Nama list-nya. Kamu yang milih.'], ' = ', ['[10, 20, 30]', 'Isinya ditulis di dalam kurung siku, dipisah koma. Di sini ada tiga isi.', true]],
        ],
      },
      {
        title: 'Nomornya mulai dari 0',
        text: ['Tiap isi punya nomor urut. Yang pertama bukan nomor 1, tapi nomor 0.'],
        code: [
          [['skor[0]', 'Isi pertama: `10`.'], '  ', ['skor[1]', 'Isi kedua: `20`.'], '  ', ['skor[2]', 'Isi ketiga: `30`.', true]],
          [['print(skor[2])', 'Tampilin isi ketiga: `30`.']],
        ],
        tip: 'List berisi 3 hal punya nomor 0, 1, 2. Ga ada nomor 3, nanti error.',
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
          ['n = 3'],
          [['while', 'Artinya "selama". Ngulang isinya selama syarat di sebelahnya benar.', true], ' ', ['n >= 1', 'Syaratnya. Selama `n` masih 1 atau lebih, putar lagi.'], [':', 'Titik dua wajib.']],
          ['    ', ['print(n)', 'Tampilin `n`. Menjorok = isi yang diulang.']],
          ['    ', ['n -= 1', 'Kurangi `n` sebanyak 1. Penting: tanpa ini, `n` ga pernah berubah dan loop-nya ga pernah berhenti.']],
        ],
      },
      {
        title: 'Jangan lupa ubah angkanya',
        text: [
          '`n -= 1` artinya "kurangi `n` dengan 1". Jadi `n` berubah 3, 2, 1, lalu jadi 0 dan loop berhenti.',
          'Kalau lupa, game bakal bilang "Programnya kelamaan jalan". Itu tanda loop-mu ga pernah berhenti.',
        ],
        tip: '`for` cocok kalau kamu tau berapa kali ngulang. `while` cocok kalau ngulangnya "selama masih ...".',
      },
    ],
  },

  class: {
    kicker: 'Gulungan Materi',
    title: 'class: cetakan data',
    slides: [
      {
        title: 'Class itu cetakan',
        text: ['Kadang satu benda punya banyak data: nama, hp, dst. Class jadi cetakan buat benda itu. Ketuk tiap bagiannya.'],
        code: [
          [['class', 'Artinya "bikin cetakan baru".', true], ' ', ['Ksatria', 'Nama cetakannya. Biasanya huruf depan besar.'], [':', 'Titik dua wajib.']],
          ['    ', ['def __init__(self, nama, hp):', 'Dijalankan otomatis tiap kali bikin Ksatria baru. `nama` dan `hp` itu data yang diminta.']],
          ['        ', ['self.nama = nama', '`self` artinya "benda ini sendiri". Baris ini nyimpen nama ke dalam benda.']],
          ['        ', ['self.hp = hp', 'Sama, tapi buat hp.']],
        ],
      },
      {
        title: 'Bikin satu ksatria',
        text: ['Cetakannya dipakai kayak function: tulis namanya lalu isi datanya di kurung.'],
        code: [
          [['k = Ksatria("Arthur", 100)', 'Bikin satu ksatria bernama Arthur, hp 100, lalu simpan di variable `k`.', true]],
          [['print(k.nama, k.hp)', 'Titik artinya "ambil bagian ini dari `k`". Tampilnya: Arthur 100. Tanda koma di `print` ngasih spasi otomatis.']],
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
          [['def tambah(a, b):', '`a` dan `b` itu parameter: data yang dikasih waktu function dipanggil.', true]],
          ['    ', ['return a + b', '`return` ngasih hasil balik ke yang manggil. Di sini hasilnya `a + b`.']],
          [['tambah(2, 3)', 'Hasilnya `5`. Bisa ditaruh di variable: `x = tambah(2, 3)`.']],
        ],
      },
      {
        title: 'Rakit semuanya',
        text: [
          'Soal terakhir ngegabungin function, variable, dan for. Ikuti jalannya:',
          'Awalnya `total` = 0. Putaran 1: `total` = 0 + 1 = 1. Putaran 2: 1 + 2 = 3. Putaran 3: 3 + 3 = 6.',
        ],
        tip: '`range(1, 4)` menghasilkan 1, 2, 3. Angka akhirnya (4) ga ikut.',
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
    } else if (kind === 'TypeError' && /missing \d+ required positional argument/.test(text)) {
      message = 'Function atau class ini butuh lebih banyak data waktu dipanggil. Cek jumlah isi di dalam kurungnya.';
    } else if (kind === 'TypeError' && /takes \d+ positional arguments? but \d+ (?:was|were) given/.test(text)) {
      message = 'Jumlah data yang kamu kasih ke function atau class ini ga cocok sama yang diminta. Cek isi di dalam kurungnya.';
    } else if (kind === 'AttributeError') {
      message = 'Bagian setelah titik ga ketemu di benda itu. Cek ejaan, misalnya k.nama dan k.hp.';
    } else if (kind === 'IndexError') {
      message = 'Nomor yang kamu minta ga ada di list. Ingat, nomornya mulai dari 0.';
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