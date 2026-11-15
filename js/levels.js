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
];