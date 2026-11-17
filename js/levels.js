// Semua level ada di sini. Mau nambah level? Copy salah satu objek di bawah,
// lalu ubah isinya. Urutan di array = urutan main.
//
// Penjelasan field:
//   tier      : 'basic' | 'medium' | 'expert' (nentuin background & label)
//   boss      : nama, file sprite (assets/bosses/...), dan emoji cadangan
//               (dipakai kalau file gambarnya belum ada)
//   task      : cerita + perintah buat user
//   expected  : output persis yang harus keluar dari program
//   starter   : kode awal di editor ('' = kosong, user ngetik dari #include)
//   ghost     : baris-baris panduan abu-abu, urut dari atas. Cuma buat
//               ngasih tau baris berikutnya, user tetap ngetik sendiri.
//               Pakai ghostFor(...) biar kerangka program ga ditulis ulang
//   requires  : (opsional) aturan tambahan biar user ga nyontek output langsung

const TIER_LABEL = {
  basic: 'Basic',
  medium: 'Medium',
  expert: 'Expert',
};

// Editor mulai kosong, jadi user ngetik semuanya sendiri.
const STARTER_EMPTY = '';

// Panduan = kerangka program + baris isi soal.
// ghostFor('cout << 1;') -> #include, using namespace, main, isi, return, }
const GHOST_TOP = ['#include <iostream>', 'using namespace std;', 'int main() {'];
const GHOST_END = ['return 0;', '}'];
const ghostFor = (...body) => [...GHOST_TOP, ...body, ...GHOST_END];

const LEVELS = [
  {
    id: 1,
    tier: 'basic',
    concept: 'cout',
    boss: {
      name: 'Print Slime',
      sprite: 'assets/bosses/print-slime.png',
      emoji: '🟢',
    },
    task: 'Print Slime lemah sama tulisan. Buat program yang menampilkan teks "Halo Dunia" di layar.',
    expected: 'Halo Dunia',
    starter: STARTER_EMPTY,
    ghost: ghostFor('cout << "Halo Dunia";'),
    requires: [],
  },
  {
    id: 2,
    tier: 'basic',
    concept: 'variable',
    boss: {
      name: 'Var Goblin',
      sprite: 'assets/bosses/var-goblin.png',
      emoji: '👺',
    },
    task: 'Var Goblin nyimpen barang di dalam kotak (variable). Buat variable int bernama umur yang isinya 19, lalu tampilkan isinya.',
    expected: '19',
    starter: STARTER_EMPTY,
    ghost: ghostFor('int umur = 19;', 'cout << umur;'),
    requires: [
      {
        pattern: /int\s+umur\s*=\s*19/,
        message: 'Outputnya udah bener, tapi pakai variable dulu ya: int umur = 19;',
      },
    ],
  },
  {
    id: 3,
    tier: 'basic',
    concept: 'operator',
    boss: {
      name: 'Operator Orc',
      sprite: 'assets/bosses/operator-orc.png',
      emoji: '👹',
    },
    task: 'Operator Orc kuat, tapi lemah sama matematika. Hitung 7 dikali 6 pakai operator, lalu tampilkan hasilnya.',
    expected: '42',
    starter: STARTER_EMPTY,
    ghost: ghostFor('cout << 7 * 6;'),
    requires: [
      {
        pattern: /7\s*\*\s*6/,
        message: 'Hasilnya bener, tapi hitung pakai operator * ya, jangan langsung ketik 42.',
      },
    ],
  },
  {
    id: 4,
    tier: 'medium',
    concept: 'if-else',
    boss: {
      name: 'Fork Wraith',
      sprite: 'assets/bosses/fork-wraith.png',
      emoji: '👻',
    },
    task: 'Fork Wraith berdiri di persimpangan dan selalu milih salah satu jalan. Buat variable int nilai = 80. Kalau nilai >= 75 (lebih dari atau sama dengan: ketik tanda > lalu tanda =), tampilkan "Lulus". Kalau tidak, tampilkan "Remedial".',
    expected: 'Lulus',
    starter: STARTER_EMPTY,
    ghost: ghostFor(
      'int nilai = 80;',
      'if (nilai >= 75) {',
      'cout << "Lulus";',
      '} else {',
      'cout << "Remedial";',
      '}'
    ),
    requires: [
      {
        pattern: /int\s+nilai\s*=\s*80/,
        message: 'Outputnya udah bener, tapi bikin dulu variable-nya ya: int nilai = 80;',
      },
      {
        pattern: /if\s*\([^)]*nilai[^)]*\)/,
        message: 'Hampir! Pilih jalannya pakai if (...) yang ngecek nilai, jangan langsung print "Lulus".',
      },
      {
        pattern: /else/,
        message: 'Jalan kedua belum ada. Tambahin else buat kasus nilainya di bawah 75.',
      },
    ],
  },
  {
    id: 5,
    tier: 'medium',
    concept: 'for loop',
    boss: {
      name: 'Loop Serpent',
      sprite: 'assets/bosses/loop-serpent.png',
      emoji: '🐍',
    },
    task: 'Loop Serpent muter terus tanpa henti. Hentikan pakai for. Tampilkan angka 1 sampai 5, satu angka per baris.',
    expected: '1\n2\n3\n4\n5',
    starter: STARTER_EMPTY,
    ghost: ghostFor(
      'for (int i = 1; i <= 5; i++) {',
      'cout << i << "\\n";',
      '}'
    ),
    requires: [
      {
        pattern: /for\s*\(/,
        message: 'Outputnya bener, tapi pakai for ya. Ular ini cuma tumbang sama loop.',
      },
    ],
  },
  {
    id: 6,
    tier: 'medium',
    concept: 'function',
    boss: {
      name: 'Function Golem',
      sprite: 'assets/bosses/function-golem.png',
      emoji: '🗿',
    },
    task: 'Function Golem cuma bisa digerakkan lewat perintah bernama (function). Buat function bernama sapa yang menampilkan "Halo Golem", lalu panggil function itu dua kali dari main().',
    expected: 'Halo Golem\nHalo Golem',
    starter: STARTER_EMPTY,
    ghost: [
      ...GHOST_TOP.slice(0, 2),
      'void sapa() {',
      'cout << "Halo Golem\\n";',
      '}',
      'int main() {',
      'sapa();',
      'sapa();',
      ...GHOST_END,
    ],
    requires: [
      {
        pattern: /void\s+sapa\s*\(\s*\)\s*\{/,
        message: 'Outputnya udah bener, tapi bikin dulu function-nya ya: void sapa() { ... }',
      },
      {
        pattern: /sapa\s*\(\s*\)\s*;[\s\S]*sapa\s*\(\s*\)\s*;/,
        message: 'Function-nya harus dipanggil dua kali dari main(): sapa(); sapa();',
      },
    ],
  },
  {
    id: 7,
    tier: 'expert',
    concept: 'array',
    boss: {
      name: 'Array Hydra',
      sprite: 'assets/bosses/array-hydra.png',
      emoji: '🐉',
    },
    task: 'Array Hydra punya tiga kepala bernomor, masing-masing bawa angka 10, 20, dan 30. Simpan ketiganya di satu array bernama skor, lalu tampilkan kepala pertama dan kepala ketiga, masing-masing di baris sendiri.',
    expected: '10\n30',
    starter: STARTER_EMPTY,
    ghost: ghostFor(
      'int skor[3] = {10, 20, 30};',
      'cout << skor[0] << "\\n";',
      'cout << skor[2];'
    ),
    requires: [
      {
        pattern: /int\s+skor\s*\[\s*\d*\s*\]\s*=\s*\{/,
        message: 'Outputnya udah bener, tapi simpan dulu di array ya: int skor[3] = {10, 20, 30};',
      },
      {
        pattern: /skor\s*\[\s*0\s*\][\s\S]*skor\s*\[\s*2\s*\]/,
        message: 'Ambil isinya pakai nomor kepala: skor[0] buat yang pertama, skor[2] buat yang ketiga.',
      },
    ],
  },
  {
    id: 8,
    tier: 'expert',
    concept: 'while loop',
    boss: {
      name: 'While Drake',
      sprite: 'assets/bosses/while-drake.png',
      emoji: '🦎',
    },
    task: 'While Drake menyerang selama masih ada tenaga. Buat variable int n = 3. Selama n >= 1, tampilkan n lalu kurangi n sebanyak 1. Hasilnya hitung mundur 3, 2, 1 (satu angka per baris).',
    expected: '3\n2\n1',
    starter: STARTER_EMPTY,
    ghost: ghostFor(
      'int n = 3;',
      'while (n >= 1) {',
      'cout << n << "\\n";',
      'n--;',
      '}'
    ),
    requires: [
      {
        pattern: /int\s+n\s*=\s*3/,
        message: 'Outputnya udah bener, tapi bikin dulu variable-nya ya: int n = 3;',
      },
      {
        pattern: /while\s*\(/,
        message: 'Hampir! Naga ini cuma tumbang sama while. Pakai while (...) { ... }',
      },
    ],
  },
  {
    id: 9,
    tier: 'expert',
    concept: 'struct',
    boss: {
      name: 'Struct Knight',
      sprite: 'assets/bosses/struct-knight.png',
      emoji: '🛡️',
    },
    task: 'Struct Knight kebal sama data yang berserakan. Buat struct bernama Ksatria yang punya nama (string) dan hp (int). Bikin satu Ksatria, isi namanya "Arthur" dan hp-nya 100, lalu tampilkan: Arthur 100',
    expected: 'Arthur 100',
    starter: STARTER_EMPTY,
    ghost: [
      ...GHOST_TOP.slice(0, 2),
      'struct Ksatria {',
      'string nama;',
      'int hp;',
      '};',
      'int main() {',
      'Ksatria k;',
      'k.nama = "Arthur";',
      'k.hp = 100;',
      'cout << k.nama << " " << k.hp;',
      ...GHOST_END,
    ],
    requires: [
      {
        pattern: /struct\s+Ksatria\s*\{/,
        message: 'Outputnya udah bener, tapi bikin dulu struct-nya ya: struct Ksatria { ... };',
      },
      {
        pattern: /\.\s*nama\s*=[\s\S]*\.\s*hp\s*=/,
        message: 'Isi datanya lewat titik: k.nama = "Arthur"; lalu k.hp = 100;',
      },
    ],
  },
  {
    id: 10,
    tier: 'expert',
    concept: 'gabungan',
    boss: {
      name: 'Segfault Dragon',
      sprite: 'assets/bosses/segfault-dragon.png',
      emoji: '🐲',
    },
    task: 'Boss terakhir! Segfault Dragon cuma kalah sama gabungan jurusmu. Buat function tambah(a, b) yang mengembalikan a + b. Lalu di main(), buat total = 0. Pakai for dari 1 sampai 3, dan tiap putaran isi total dengan tambah(total, i). Tampilkan total di akhir.',
    expected: '6',
    starter: STARTER_EMPTY,
    ghost: [
      ...GHOST_TOP.slice(0, 2),
      'int tambah(int a, int b) {',
      'return a + b;',
      '}',
      'int main() {',
      'int total = 0;',
      'for (int i = 1; i <= 3; i++) {',
      'total = tambah(total, i);',
      '}',
      'cout << total;',
      ...GHOST_END,
    ],
    requires: [
      {
        pattern: /int\s+tambah\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/,
        message: 'Hasilnya bener, tapi bikin dulu function-nya ya: int tambah(int a, int b) { return a + b; }',
      },
      {
        pattern: /for\s*\(/,
        message: 'Naga ini juga lemah sama for. Pakai for buat ngulang dari 1 sampai 3.',
      },
      {
        pattern: /=\s*tambah\s*\(/,
        message: 'Panggil function-nya di dalam loop: total = tambah(total, i);',
      },
    ],
  },
];