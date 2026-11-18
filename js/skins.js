// Skin per bahasa: boss (sprite + nama) dan teks cerita soal yang nyebut nama boss.
// Python tetap pakai boss lama (assets/bosses/*.png). C++ dan JavaScript punya
// set boss sendiri, jadi tiap bab kelihatan beda. Konsep, soal, dan aturan
// `requires` ga berubah, cuma bungkus visual dan ceritanya.
//
// Dimuat sebelum lang.js. lang.js manggil applySkin() sesudah LEVELS ditukar.
//   boss : nama, file sprite, emoji cadangan
//   say  : pasangan [teks lama, teks baru], dipakai di `task` dan pesan `requires`

function applySkin(levels, skin) {
  skin.forEach((s, i) => {
    const level = levels[i];
    if (!level) return;
    level.boss = s.boss;
    (s.say || []).forEach(([from, to]) => {
      level.task = level.task.split(from).join(to);
      (level.requires || []).forEach((r) => { r.message = r.message.split(from).join(to); });
    });
  });
}

// Ganti teks di mana pun muncul: soal, output yang diharapkan, panduan abu-abu, dan materi.
// Dipakai buat hal yang ikut nama boss, misalnya "Halo Golem" di level 6.
// Hasilnya struktur baru (aslinya ga diubah), jadi Python yang berbagi data dasar tetap utuh.
function mapStrings(value, pairs) {
  if (typeof value === 'string') return pairs.reduce((t, [from, to]) => t.split(from).join(to), value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, pairs));
  if (value && typeof value === 'object' && !(value instanceof RegExp)) {
    const out = {};
    Object.keys(value).forEach((k) => { out[k] = mapStrings(value[k], pairs); });
    return out;
  }
  return value;
}

function applyTextSkin(levels, lessons, pairs) {
  levels.forEach((level) => {
    level.task = mapStrings(level.task, pairs);
    level.expected = mapStrings(level.expected, pairs);
    level.ghost = mapStrings(level.ghost, pairs);
    level.requires = (level.requires || []).map((r) => ({ ...r, message: mapStrings(r.message, pairs) }));
  });
  const next = mapStrings(lessons, pairs);
  Object.keys(lessons).forEach((k) => delete lessons[k]);
  Object.assign(lessons, next);
}

// Level 6: tulisan yang dicetak function ikut nama bosnya.
const TEXT_CPP = [['Halo Golem', 'Halo Mech']];
const TEXT_JS = [['Halo Golem', 'Halo Archer']];

const bossAt = (folder, name, file, emoji) => ({ name, sprite: `assets/bosses/${folder}/${file}.png`, emoji });

// Tema C++: mesin, pabrik, memori.
const SKIN_CPP = [
  { boss: bossAt('cpp', 'Stream Bot', 'stream-bot', '🤖'), say: [['Print Slime lemah', 'Stream Bot lemah']] },
  { boss: bossAt('cpp', 'Box Mimic', 'box-mimic', '📦'), say: [['Var Goblin nyimpen', 'Box Mimic nyimpen']] },
  { boss: bossAt('cpp', 'Operator Crab', 'operator-crab', '🦀'), say: [['Operator Orc kuat', 'Operator Crab capitnya kuat']] },
  { boss: bossAt('cpp', 'Branch Mantis', 'branch-mantis', '🦗'), say: [['Fork Wraith berdiri di persimpangan dan selalu', 'Branch Mantis berdiri di persimpangan, dua sabitnya selalu']] },
  { boss: bossAt('cpp', 'Cycle Beetle', 'cycle-beetle', '🪲'), say: [['Loop Serpent muter', 'Cycle Beetle muter'], ['Ular ini', 'Kumbang ini']] },
  { boss: bossAt('cpp', 'Function Mech', 'function-mech', '⚙️'), say: [['Function Golem cuma', 'Function Mech cuma']] },
  { boss: bossAt('cpp', 'Array Centipede', 'array-centipede', '🐛'), say: [['Array Hydra punya tiga kepala bernomor', 'Array Centipede punya tiga ruas bernomor'], ['kepala pertama dan kepala ketiga', 'ruas pertama dan ruas ketiga'], ['nomor kepala', 'nomor ruas']] },
  { boss: bossAt('cpp', 'While Scorpion', 'while-scorpion', '🦂'), say: [['While Drake menyerang', 'While Scorpion menyerang'], ['Naga ini', 'Kalajengking ini']] },
  { boss: bossAt('cpp', 'Struct Colossus', 'struct-colossus', '🧱'), say: [['Struct Knight kebal', 'Struct Colossus kebal']] },
  { boss: bossAt('cpp', 'Segfault Kraken', 'segfault-kraken', '🐙'), say: [['Segfault Dragon cuma', 'Segfault Kraken cuma'], ['Naga ini', 'Kraken ini']] },
];

// Tema JavaScript: langit neon, roh, makhluk ajaib.
const SKIN_JS = [
  { boss: bossAt('js', 'Log Jelly', 'log-jelly', '🪼'), say: [['Print Slime lemah', 'Log Jelly lemah']] },
  { boss: bossAt('js', 'Const Turtle', 'const-turtle', '🐢'), say: [['Var Goblin nyimpen', 'Const Turtle nyimpen']] },
  { boss: bossAt('js', 'Operator Imp', 'operator-imp', '😈'), say: [['Operator Orc kuat', 'Operator Imp jahil']] },
  { boss: bossAt('js', 'Ternary Fox', 'ternary-fox', '🦊'), say: [['Fork Wraith berdiri di persimpangan dan selalu', 'Ternary Fox berdiri di persimpangan, dua ekornya selalu']] },
  { boss: bossAt('js', 'Iterator Octopus', 'iterator-octopus', '🐙'), say: [['Loop Serpent muter', 'Iterator Octopus muter'], ['Ular ini', 'Gurita ini']] },
  { boss: bossAt('js', 'Function Archer', 'function-archer', '🏹'), say: [['Function Golem cuma', 'Function Archer cuma']] },
  { boss: bossAt('js', 'Array Bats', 'array-bats', '🦇'), say: [['Array Hydra punya tiga kepala bernomor', 'Array Bats punya tiga kelelawar bernomor'], ['kepala pertama dan kepala ketiga', 'kelelawar pertama dan kelelawar ketiga'], ['nomor kepala', 'nomor kelelawar']] },
  { boss: bossAt('js', 'While Tornado', 'while-tornado', '🌪️'), say: [['While Drake menyerang', 'While Tornado menyerang'], ['Naga ini', 'Angin puyuh ini']] },
  { boss: bossAt('js', 'Object Treant', 'object-treant', '🌳'), say: [['Object Knight kebal', 'Object Treant kebal']] },
  { boss: bossAt('js', 'Undefined Dragon', 'undefined-dragon', '🐉'), say: [] },
];