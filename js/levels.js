// Semua level ada di sini. Mau nambah level? Copy salah satu objek di bawah,
// lalu ubah isinya. Urutan di array = urutan main.
//
// Penjelasan field:
//   tier      : 'basic' | 'medium' | 'expert' (nentuin background & label)
//   boss      : nama, file sprite (assets/bosses/...), dan emoji cadangan
//               (dipakai kalau file gambarnya belum ada)
//   task      : cerita + perintah buat user
//   expected  : output persis yang harus keluar dari program
//   starter   : kode awal di editor
//   ghost     : baris-baris hint abu-abu (Tab buat nerima)
//   requires  : (opsional) aturan tambahan biar user ga nyontek output langsung

const TIER_LABEL = {
  basic: 'Basic',
  medium: 'Medium',
  expert: 'Expert',
};

const STARTER_TEMPLATE = `#include <iostream>
using namespace std;

int main() {
    // tulis kode kamu di sini

    return 0;
}
`;

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
    starter: STARTER_TEMPLATE,
    ghost: ['cout << "Halo Dunia";'],
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
    starter: STARTER_TEMPLATE,
    ghost: ['int umur = 19;', 'cout << umur;'],
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
    starter: STARTER_TEMPLATE,
    ghost: ['cout << 7 * 6;'],
    requires: [
      {
        pattern: /7\s*\*\s*6/,
        message: 'Hasilnya bener, tapi hitung pakai operator * ya, jangan langsung ketik 42.',
      },
    ],
  },
];
