// Materi belajar. Ditampilkan sebagai gulungan sebelum soal tiap boss.
//
// Struktur:
//   LESSONS[id] = { kicker, title, slides: [...] }
//   slide = { title, text: ['paragraf', ...], code?: [baris, ...], tip?: 'teks' }
//   baris kode = array potongan. Potongan bisa string biasa (ga bisa diklik)
//                atau [teks, 'penjelasan'] (bisa diklik, penjelasan muncul di bawah).
//
// Gaya nulis: kalimat pendek, kata sehari-hari, satu ide per kalimat.
// LESSON_FOR_CONCEPT ngatur materi apa yang dibuka di tiap level.
// Level pertama otomatis diawali materi 'dasar' (Level 0: Zona Latihan).

// Kerangka program yang sama di tiap level. `body` = baris yang diisi soal level itu.
// Potongan ketiga `true` = bagian yang baru di level ini, langsung terpilih.
function skeletonCode(body) {
  return [
    [['#include <iostream>', 'Pinjam alat dulu. Tanpa ini, `cout` ga dikenal. Ada di tiap program, tiap level.']],
    [['using namespace std;', 'Biar cukup nulis `cout`, ga perlu `std::cout`. Ada di tiap program.']],
    [['int main() {', 'Pintu masuk program. Perintah kamu ditulis di dalamnya.']],
    ...body,
    [['    return 0;', 'Program selesai dengan aman. Ada di tiap program.']],
    [['}', 'Penutup `main()`. Setiap `{` punya pasangan `}`.']],
  ];
}

const LESSONS = {
  dasar: {
    kicker: 'Level 0: Zona Latihan',
    title: 'Kenalan sama C++',
    slides: [
      {
        title: 'Kode itu kayak resep',
        text: [
          'Komputer itu kayak koki yang nurut banget. Dia cuma ngerjain apa yang kamu tulis, satu baris demi satu baris, dari atas ke bawah.',
          'Tulisan itu namanya kode. Di game ini, kamu nulis kode. Kalau hasilnya bener, boss-nya kalah.',
        ],
      },
      {
        title: 'Kerangka yang selalu ada',
        text: ['Hampir semua program C++ diawali kerangka yang sama. Ketuk tiap baris buat lihat artinya.'],
        code: [
          [['#include <iostream>', 'Artinya: "pinjam alat dulu". `iostream` itu alat buat nampilin tulisan ke layar. Tanpa ini, komputer ga ngerti perintah `cout`.']],
          [['using namespace std;', 'Biar nulisnya lebih pendek. Tanpa ini, kamu harus nulis `std::cout`. Dengan ini, cukup `cout`.']],
          [['int main() {', 'Pintu masuk program. Komputer mulai baca dari sini. Tanda `{` artinya "isinya mulai".']],
          ['    // ...perintah kamu ditulis di sini'],
          [['    return 0;', 'Artinya: "program selesai, semua aman". Angka `0` itu tanda sukses.']],
          [['}', 'Tanda "isinya selesai". Setiap `{` harus punya pasangan `}`.']],
        ],
      },
      {
        title: 'Titik koma itu kayak titik',
        text: [
          'Kalimat biasa diakhiri titik. Perintah C++ diakhiri titik koma (`;`).',
          'Kalau lupa, komputer bingung dan kasih tau ada yang kurang. Tenang, game ini nunjukin baris mana yang salah.',
        ],
        tip: 'Tiga ini ga pakai `;` di ujungnya: `#include`, `int main() {`, dan `}`.',
      },
      {
        title: 'Huruf dan tanda baca itu penting',
        text: [
          'Komputer beda-in huruf besar dan kecil. `cout` itu bener, `Cout` itu salah.',
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

  cout: {
    kicker: 'Gulungan Materi',
    title: 'cout: bikin program ngomong',
    slides: [
      {
        title: 'Taruh di dalam `main()`',
        text: ['Perintah kamu selalu ditulis di dalam `main()`, di atas `return 0;`. Empat baris lainnya itu kerangka dari Level 0. Ketuk tiap baris.'],
        code: skeletonCode([
          [ '    ', ['cout << "Halo Dunia";', 'Baris baru di level ini. Tampilin tulisan ke layar. Letaknya di dalam `main()`.', true] ],
        ]),
      },
      {
        title: 'cout = nampilin tulisan',
        text: ['`cout` dipakai buat nampilin sesuatu ke layar. Ketuk tiap bagiannya.'],
        code: [
          [['cout', 'Kata ajaib buat nampilin sesuatu ke layar.'], ' ', ['<<', 'Tanda panah. Artinya: kirim yang di kanan ke `cout`.'], ' ', ['"Halo Dunia"', 'Tulisan yang mau ditampilin. Harus diapit tanda kutip dua.'], [';', 'Titik di ujung perintah.']],
        ],
      },
      {
        title: 'Tulisan pakai kutip, angka nggak',
        text: [
          '`cout << "Halo";` menampilkan tulisan Halo.',
          '`cout << 5;` menampilkan angka `5`. Angka ga perlu kutip.',
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
        title: 'Kerangkanya tetap sama',
        text: ['Kerangka dari Level 0 dipakai lagi. Yang baru cuma dua baris di dalam `main()`. Ketuk buat lihat artinya.'],
        code: skeletonCode([
          [ '    ', ['int umur = 19;', 'Baris baru: bikin kotak `umur` isinya `19`. Harus di atas, sebelum dipakai.', true] ],
          [ '    ', ['cout << umur;', 'Tampilin isi kotaknya. Masih pakai `cout` yang sama kayak level sebelumnya.'] ],
        ]),
      },
      {
        title: 'Variable itu kotak berlabel',
        text: ['Variable adalah kotak buat nyimpen sesuatu. Kotaknya dikasih nama, jadi gampang diambil lagi.'],
        code: [
          [['int', 'Jenis isi kotaknya. `int` artinya bilangan bulat, kayak `19` atau `0`. Bukan tulisan.'], ' ', ['umur', 'Nama kotaknya. Kamu yang milih. Jangan pakai spasi.'], ' ', ['=', 'Artinya "isi dengan". Bukan "sama dengan".'], ' ', ['19', 'Isi kotaknya.'], [';', 'Titik di ujung perintah.']],
        ],
      },
      {
        title: 'Lihat isi kotaknya',
        text: ['Buat nampilin isinya, tulis nama kotaknya tanpa tanda kutip.'],
        code: [
          [['cout << umur;', 'Yang muncul: `19`. Komputer buka kotak `umur` dan nampilin isinya.']],
          [['cout << "umur";', 'Yang muncul: `umur`. Karena pakai kutip, dia dianggap tulisan biasa.']],
        ],
        tip: 'Kotak dibuat dulu, baru dipakai. Jadi `int umur = 19;` ditulis di atas `cout`.',
      },
    ],
  },

  operator: {
    kicker: 'Gulungan Materi',
    title: 'Operator: tanda hitung',
    slides: [
      {
        title: 'Kerangkanya tetap sama',
        text: ['Kerangka dari Level 0 dipakai lagi. Yang baru cuma satu baris di dalam `main()`.'],
        code: skeletonCode([
          [ '    ', ['cout << 7 * 6;', 'Baris baru: `cout` yang sama, tapi isinya hitungan. Komputer yang ngitung, hasilnya `42`.', true] ],
        ]),
      },
      {
        title: 'C++ bisa ngitung',
        text: ['Operator itu tanda buat ngitung. Ketuk satu-satu buat lihat contohnya.'],
        code: [
          [['+', 'Tambah. `5 + 2` hasilnya `7`.']],
          [['-', 'Kurang. `5 - 2` hasilnya `3`.']],
          [['*', 'Kali. Pakai tanda bintang, bukan huruf x. `7 * 6` hasilnya `42`.']],
          [['/', 'Bagi. `8 / 2` hasilnya `4`. Hati-hati: `7 / 2` hasilnya `3`, karena sisanya dibuang.']],
        ],
      },
      {
        title: 'Hitung langsung di cout',
        text: ['Kamu ga perlu ngitung sendiri. Taruh hitungannya di `cout`, komputer yang ngitung.'],
        code: [
          [['cout << 7 * 6;', 'Komputer hitung `7 * 6` dulu, terus nampilin hasilnya: `42`. Ga pakai kutip, karena ini hitungan, bukan tulisan.']],
        ],
      },
    ],
  },

  'if-else': {
    kicker: 'Gulungan Materi',
    title: 'if dan else: milih jalan',
    slides: [
      {
        title: 'Kerangkanya tetap sama',
        text: ['Kerangka dari Level 0 dipakai lagi. Yang baru: blok `if`-`else` di dalam `main()`. Ketuk buat lihat artinya.'],
        code: skeletonCode([
          [ '    ', ['int nilai = 80;', 'Kotak `nilai` dari level sebelumnya, dibikin dulu.'] ],
          [ '    ', ['if (nilai >= 75) {', 'Baru di level ini. Kalau syarat benar, isi blok ini jalan.', true] ],
          [ '        cout << "Lulus";' ],
          [ '    ', ['} else {', 'Kalau syarat salah, jalan ke blok ini.'] ],
          [ '        cout << "Remedial";' ],
          [ '    }' ],
        ]),
      },
      {
        title: 'Program bisa milih jalan',
        text: ['Kadang program harus milih. Kalau syaratnya cocok, lakukan A. Kalau nggak, lakukan B. Itu gunanya `if` dan `else`. Ketuk bagiannya.'],
        code: [
          [['if', 'Artinya "kalau". Syaratnya ditulis di dalam kurung.'], ' (', ['nilai >= 75', 'Ini syaratnya. Artinya: apakah `nilai` `75` atau lebih? Jawabannya cuma benar atau salah.'], ') {'],
          ['    cout << "Lulus";   // jalan kalau syarat benar'],
          [['} else {', 'Artinya "kalau nggak". Isi di bawahnya jalan kalau syarat di atas salah.']],
          ['    cout << "Remedial";'],
          ['}'],
        ],
        tip: 'Cuma satu jalan yang dijalankan: `if` atau `else`, ga dua-duanya.',
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
        title: 'Kerangkanya tetap sama',
        text: ['Kerangka dari Level 0 dipakai lagi. Yang baru: `for` di dalam `main()`. Ketuk buat lihat artinya.'],
        code: skeletonCode([
          [ '    ', ['for (int i = 1; i <= 5; i++) {', 'Baru di level ini. Ngulang isi blok ini 5 kali.', true] ],
          [ '        ', ['cout << i << "\\n";', 'Tampilin `i`, lalu pindah baris. Dijalankan tiap putaran.'] ],
          [ '    }' ],
        ]),
      },
      {
        title: 'Loop itu pengulangan',
        text: ['Mau nampilin angka 1 sampai 100? Capek kalau nulis satu-satu. Pakai `for`, komputer yang ngulang. Ketuk tiap bagian di dalam kurungnya.'],
        code: [
          [
            'for (',
            ['int i = 1;', 'Titik awal. Bikin kotak `i` buat ngitung putaran, mulai dari `1`. Cuma dijalankan sekali di awal.'],
            ' ',
            ['i <= 5;', 'Syarat lanjut. Selama `i` masih `5` atau kurang, putar lagi. Kalau udah lewat `5`, berhenti.'],
            ' ',
            ['i++', 'Tiap selesai satu putaran, `i` ditambah `1`.'],
            ') {',
          ],
          ['    // isi ini diulang tiap putaran'],
          ['}'],
        ],
        tip: 'Di dalam kurung, bagiannya dipisah `;`. Tapi bagian terakhir (`i++`) ga pakai `;`.',
      },
      {
        title: 'Pindah baris',
        text: ['Biar tiap angka tampil di baris sendiri, tambahin `"\\n"` setelahnya.'],
        code: [
          [['cout << i << "\\n";', 'Tampilin `i`, lalu `"\\n"` yang artinya pindah baris. Jadinya angka muncul satu per baris.']],
        ],
        tip: 'Ada juga `endl` yang fungsinya sama. Di soal ini kita pakai `"\\n"` biar sama kayak petunjuk abu-abu.',
      },
    ],
  },
};

// Materi tiap level. Cocokin dengan field `concept` di levels.js.
const LESSON_FOR_CONCEPT = {
  cout: 'cout',
  variable: 'variable',
  operator: 'operator',
  'if-else': 'if-else',
  'for loop': 'for loop',
};

// Daftar id materi yang dibuka di level ke-index. Level pertama diawali 'dasar'.
function lessonIdsForLevel(index, includeBasics) {
  const ids = [];
  if (index === 0 && includeBasics) ids.push('dasar');
  const own = LESSON_FOR_CONCEPT[LEVELS[index].concept];
  if (own) ids.push(own);
  return ids;
}