# Compile & Conquer

Game web 2D pixel art buat belajar coding. Tiap level ada satu boss. Tulis programnya dengan benar, boss-nya tumbang.

Bisa belajar **C++**, **Python**, atau **JavaScript**, masing-masing 10 level.

Dibuat buat temen-temen yang baru mulai ngoding, baik dari Informatika maupun dari luar.

## Cara jalanin di lokal

1. Buka folder ini di VS Code.
2. Klik kanan `index.html` → **Open with Live Server**.
3. Butuh internet, karena compiler (Judge0) dan font diambil dari online.

Jangan dibuka langsung dengan klik dua kali `index.html`, pakai Live Server aja.

Habis nimpa file, refresh keras (Ctrl+Shift+R). Nomor `?v=` di `index.html` dinaikin tiap file berubah biar browser ga pakai cache lama.

## Struktur folder

```
compile-and-conquer/
├── index.html          halaman utama
├── css/style.css       tampilan
├── js/
│   ├── levels.js       level C++ (boss, soal, hint)
│   ├── lessons.js      materi C++ (gulungan penjelasan)
│   ├── python.js       level + materi + penerjemah error Python
│   ├── javascript.js   level + materi + penerjemah error JavaScript
│   ├── skins.js        boss + teks cerita per bahasa (C++ dan JavaScript beda dari Python)
│   ├── lang.js         pilihan bahasa (C++ / Python / JavaScript)
│   ├── lesson.js       mesin popup materi
│   ├── errors.js       pesan error compiler C++ jadi bahasa ramah
│   ├── sound.js        sound effect + musik latar (Web Audio, tanpa file audio)
│   ├── judge.js        kirim kode ke compiler online (JavaScript: Web Worker di browser)
│   ├── editor.js       editor kode ringan + warna sintaks + ghost text + tombol simbol HP
│   └── game.js         logika game & animasi
└── assets/
    ├── ui/             tile bata bingkai
    ├── hero/           sprite hero
    ├── mentor/         sprite mentor (penyihir di gulungan materi)
    ├── bosses/         sprite boss Python (print-slime.png dst.)
    │   ├── cpp/        sprite boss C++
    │   └── js/         sprite boss JavaScript
    └── backgrounds/    background per tier (svg bawaan = Python, png menimpa), plus cpp-*.png dan js-*.png
```

Urutan `<script>` di `index.html` penting: `levels` → `lessons` → `python` → `javascript` → `skins` → `lang` → `lesson` → `sound` → `errors` → `judge` → `editor` → `game`.

## Pilihan bahasa

Bahasa dipilih lewat **Peta Bab**: tombol **Main** (kalau belum ada progress) atau **Peta Bab** di lobby. Satu kartu per bahasa, dengan bar progress satu kotak per boss. Semua bab terbuka. Python diberi label "Disarankan mulai di sini". JavaScript juga sudah terbuka.

Pilihan disimpan di `localStorage` (`compile-and-conquer-lang`), terus halaman dimuat ulang dan langsung masuk game (penanda sementara di `sessionStorage`, dibaca `Lang.consumeAutostart()`). Kartu peta dibangun di `buildChapters()` (`game.js`), daftarnya di `CHAPTERS`. Nambah bahasa baru = nambah satu entri di `CHAPTERS` dan `LANGS`.

Cara kerjanya: `lang.js` baca pilihan itu. Kalau Python, isi `LEVELS`, `LESSONS`, dan `LESSON_FOR_CONCEPT` ditukar dengan versi Python dari `python.js`. Kalau JavaScript, ditukar dengan versi dari `javascript.js` (`LEVELS_JS`, `LESSONS_JS`, `LESSON_FOR_CONCEPT_JS`). Jadi sisa kode game ga perlu tau bedanya.

- Progress dipisah per bahasa. C++ pakai key `compile-and-conquer-level`, Python pakai `compile-and-conquer-level-python`, JavaScript pakai `compile-and-conquer-level-javascript`. Key lain ikut pola yang sama (`-done-javascript`, `-best-javascript`). Boss terakhir yang kalah nyimpen penanda tamat (`compile-and-conquer-done`, `compile-and-conquer-done-python`) buat peta bab. Ada key ketiga, `compile-and-conquer-best` (dan `-best-python`): level tertinggi yang udah kebuka. Beda dari `-level` yang ikut turun kalau pemain ngulang level lama. Kebuka = `max(best, level)`, jadi pemain lama ga kehilangan progress.
- Tombol **Main** selalu buka layar **Pilih Level** (`#stages`, dibangun `buildStages()` di game.js). Level yang udah kalah bisa dimainkan lagi, level berikutnya kebuka, sisanya terkunci (siluet, ga bisa diklik). Pengecualian: pemain baru ga punya progress, Main langsung ke peta bab atau mulai level 1.
- Boss, sprite, arena, dan urutan konsep sama di semua bahasa. Yang beda cuma soal, ghost text, aturan `requires`, materi, dan pesan error.
- ID bahasa di Judge0 ada di `lang.js` (`judgeId`). C++ = 54, Python = 71. Cek di `ce.judge0.com/languages` kalau mau mastiin. JavaScript ga pakai Judge0 (`judgeId: null`), kodenya jalan di browser, lihat bagian Catatan compiler.
- Python ga punya tahap compile, jadi `SyntaxError` dan Traceback keluar di stderr. `judge.js` nganggap itu error compile, terus `PyErrors` (di `python.js`) yang nerjemahin ke bahasa ramah.
- JavaScript juga dianggap error compile semua (SyntaxError maupun error saat jalan). `JsErrors` (di `javascript.js`) yang nerjemahin: kurung atau kurawal kurang, kutip kurang, `Console` salah huruf besar, `console.Log`, variable belum dibuat, `const` diubah, dst.

## Boss dan latar per bahasa

Supaya tiap bab kelihatan beda, boss dan latarnya dipisah per bahasa. Konsep, soal, dan urutan level tetap sama.

- **Python** pakai boss lama (`assets/bosses/*.png`) dan latar bawaan (rumput, hutan, gua lava).
- **C++** tema mesin dan pabrik: Stream Bot, Box Mimic, Operator Crab, Branch Mantis, Cycle Beetle, Function Mech, Array Centipede, While Scorpion, Struct Colossus, Segfault Kraken. Sprite di `assets/bosses/cpp/`. Latar: pabrik pagi, ruang server, kernel panic.
- **JavaScript** tema langit neon dan makhluk ajaib: Log Jelly, Const Turtle, Operator Imp, Ternary Fox, Iterator Octopus, Function Archer, Array Bats, While Tornado, Object Treant, Undefined Dragon. Sprite di `assets/bosses/js/`. Latar: senja pulau melayang, malam berbintang, kota neon.

Cara kerjanya ada di `js/skins.js`. `SKIN_CPP` dan `SKIN_JS` isinya satu entri per level: `boss` (nama, sprite, emoji) dan `say` (pasangan teks lama dan baru buat cerita soal dan pesan `requires` yang nyebut nama boss). `lang.js` manggil `applySkin()` sesudah `LEVELS` ditukar. Python ga kena skin, jadi `python.js` tetap nurunin boss dan teks dari `levels.js` apa adanya. Level baru: tambah satu entri di tiap skin.

Latar dipasang lewat kelas `lang-cpp` / `lang-javascript` di `.stage` (diset `renderLevel()` di `game.js`) dan atribut `data-lang` di `<body>` (diset `lang.js`, buat lobby). Aturannya ada di `style.css`, tepat di atas `.stage::after`. Yang ketinggalan sprite atau latar? Aman, tetap muncul emoji dan warna cadangan.

Sprite dan latar dibikin lewat kode di folder `tools/`. Jalankan dari root repo: `python tools/cpp_bosses.py`, `python tools/js_bosses.py`, `python tools/backgrounds.py` (butuh Pillow). Sprite level 1-3 berukuran 32x32, level 4-10 berukuran 52x52, outline 1 piksel warna (26,18,38), hadap kiri. Latar 192x108, di-cover dengan `image-rendering: pixelated`.

## Daftar level

| # | Tier | Boss | Konsep |
|---|---|---|---|
| 1 | Basic | Print Slime | `cout` / `print` |
| 2 | Basic | Var Goblin | variable |
| 3 | Basic | Operator Orc | operator |
| 4 | Medium | Fork Wraith | if-else |
| 5 | Medium | Loop Serpent | `for` |
| 6 | Medium | Function Golem | function (`void`, tanpa hasil balik) |
| 7 | Expert | Array Hydra | array (C++, JavaScript) / list (Python) |
| 8 | Expert | While Drake | `while` |
| 9 | Expert | Struct Knight | struct (C++) / class (Python, boss: Class Knight) / object (JavaScript, boss: Object Knight) |
| 10 | Expert | Segfault Dragon | gabungan: function + return + for (Python: Traceback Dragon, JavaScript: Undefined Dragon) |

Daftar boss di tabel ini adalah versi Python. Boss C++ dan JavaScript ada di bagian "Boss dan latar per bahasa" di atas.

Sprite boss baru: `function-golem.png`, `array-hydra.png`, `while-drake.png`, `struct-knight.png`, `segfault-dragon.png` di `assets/bosses/`. Belum ada? Aman, tampil emoji cadangan.

## Nambah level

**C++:** buka `js/levels.js`, copy salah satu objek di array `LEVELS`, lalu ubah isinya.

**Python:** buka `js/python.js`, tambah entri di `LEVELS_PY` pakai helper `py(indexBossDiLevelsJs, { ...yang diganti })`. Boss dan sprite ikut dari `levels.js`, jadi cukup tulis `concept`, `task`, `ghost`, dan `requires`.

**JavaScript:** buka `js/javascript.js`, tambah entri di `LEVELS_JS` pakai helper `jsl(indexBossDiLevelsJs, { ...yang diganti })`. Cara kerjanya sama persis kayak Python. Baris `ghost` ditulis lengkap dengan jorokan (4 spasi per level).

Isi level:

- `boss`: nama, file sprite, dan emoji cadangan
- `concept`: nama konsep, dipakai buat nyambungin ke materi (`LESSON_FOR_CONCEPT`)
- `task`: cerita + perintah soal
- `expected`: output persis yang harus keluar
- `ghost`: baris panduan abu-abu. Di C++ pakai `ghostFor(...)`. Cuma panduan, user tetap ngetik sendiri
- `requires`: aturan tambahan biar user ga cuma ngetik hasilnya langsung (opsional)

## Materi (gulungan belajar)

Tiap level diawali popup materi sebelum gulungan soal. Level 1 selalu diawali materi `dasar` (Level 0: Zona Latihan). Tombol **Materi** di topbar buat buka lagi kapan aja. Mentornya penyihir pixel art di `assets/mentor/mentor.png` (24x24, tampil 3x biar piksel-nya rata).

Data materi ada di `lessons.js` (C++), `python.js` (Python), dan `javascript.js` (JavaScript):

```js
LESSONS[id] = { kicker, title, slides: [
  { title, text: ['paragraf'], code: [baris, ...], tip: 'catatan' },
] }
```

- Baris kode = array potongan. Potongan bisa string biasa (ga bisa diklik) atau `[teks, 'penjelasan']` (bisa diketuk, penjelasan muncul di bawah).
- Potongan ketiga `true` (`[teks, 'penjelasan', true]`) = langsung kepilih waktu slide dibuka. Dipakai buat nandain baris yang baru di level itu.
- Contoh kode di dalam paragraf, tip, dan penjelasan ditulis di antara tanda backtick, misalnya `` `int umur = 19;` ``. Hasilnya kotak gelap huruf emas biar beda dari kertas. Jangan pakai backtick di `title` slide, judul ga diproses.
- C++: `skeletonCode(body)` bikin kerangka lengkap (`#include`, `main`, dst.) dengan baris barunya di tengah. Tiap materi konsep dibuka pakai slide ini, biar pemain tau kenapa kerangkanya selalu ada.
- Gaya nulis: kalimat pendek, kata sehari-hari, satu ide per kalimat.

Font paragraf materi pakai VT323 (`--read` di `style.css`), judul tetap Pixelify Sans.

## Editor

Editor buatan sendiri: `textarea` transparan di atas lapisan warna (`.ed-hl`) dan lapisan ghost (`.ed-mirror`).

- **Warna sintaks** gaya VS Code. Aturan token ada di `HL_LANG` (`editor.js`), warnanya di bagian paling bawah `style.css` (`.ed-hl .tk`, `.tt`, dst.). Palet sengaja tanpa merah biar kode yang benar ga kelihatan salah. Merah cuma buat error.
- **Ghost text**: baris panduan abu-abu, bisa dimatiin dari kartu soal.
- **Tombol simbol** buat HP, beda per bahasa (`CPP_KEYS`, `PY_KEYS`, `JS_KEYS`).
- Di Python, Enter habis baris berakhir `:` otomatis nambah indent.
- **Ghost baris berikutnya**: kalau baris di kursor udah persis sama baris panduan, baris panduan berikutnya muncul abu-abu di baris bawahnya (lengkap dengan jorokan), jadi pemain tau harus lanjut. Cuma muncul kalau kursor di baris terakhir.
- **Jorokan di panduan Python dan JavaScript**: baris `ghost` di `python.js` dan `javascript.js` ditulis lengkap dengan jorokan (4 spasi per level). Kalau panduan nyala, Enter ngikutin jorokan baris panduan berikutnya, jadi `else:`, `}`, dan dedent habis `def`/`for` mendarat di kolom yang bener. Panduan mati = Enter cuma nyontek jorokan baris atas (plus satu level habis `{`, atau `:` di Python). C++ ga pakai ini, baris panduannya tanpa jorokan.
- **Posisi ghost baris berikutnya = posisi setelah Enter.** Jorokan baris baru dihitung satu fungsi, `enterIndent()` di `editor.js`, dipakai Enter dan juga preview ghost. Jadi ghost ga "lompat" ke kanan waktu Enter ditekan (dulu kejadian di C++).
- **Cek kode belum selesai**: sebelum kode dikirim ke Judge0, `unfinishedHint()` (`game.js`) ngecek tiga hal: (1) semua baris user cocok berurutan dengan awal `ghost` tapi `ghost` masih lebih panjang, (2) Python: baris terakhir berakhir `:` tanpa isi, (3) C++ dan JavaScript: `{` lebih banyak dari `}`. Kalau kena, tampil pesan "Kodenya belum selesai" dan kode ga dikirim. Pesannya ga nyebut isi baris berikutnya. Jalan walau panduan abu-abu dimatiin, karena yang dibaca data `ghost`, bukan tampilannya.

## Serangan ke boss

Satu baris output = satu serangan. Soal yang outputnya 5 baris (misal level 5: 1 sampai 5) bikin hero nyerang 5 kali, tiap serangan nampilin satu baris output sebagai angka damage, dan HP boss turun bertahap (5 baris: 80%, 60%, 40%, 20%, 0%). Boss baru meledak habis serangan terakhir. Output 1 baris tetap one-hit.

Logikanya di `winSequence()` (`game.js`), tiap serangan ada di `strikeOnce()`. Kecepatan antar serangan diatur di `wait(...)` dalam `strikeOnce`. Level yang kena: level 5 (5 hit), 6 (2 hit), 7 (2 hit), 8 (3 hit), di semua bahasa.

## Layar kecil dan zoom browser

Pemain yang zoom browser 150% ke atas punya tinggi layar yang jauh lebih kecil.

- Lobby (`.lobby-inner`) selebar layar dan digulung pakai scrollbar bawaan browser. Background, sprite, dan tanah bata tetap diam di belakang.
- Selama lobby, Peta Bab, atau Pilih Level kebuka, scrollbar halaman di belakangnya dimatiin (`html:has(...)` di `style.css`) biar cuma ada satu scrollbar.
- Di layar pendek (tinggi 760px ke bawah), jarak dirapatkan, judul mengecil, dan judul disembunyiin waktu Pengaturan kebuka.
- Popup (`.modal`) juga bisa digulung.
- **Pengaturan** ditutup lewat tombol **X** merah (ikon pixel art, SVG 9x9) di pojok kartu, atau tombol **Esc**. Tombol Kembali yang lama udah dihapus. Id tombolnya tetap `settingsBack`.

## Sprite & background

Ukuran hero dan boss di arena diatur lewat `--hero-w` dan `--boss-w` di bagian atas `css/style.css`. Kalau skala pixel hero dan boss kelihatan beda, ubah dua angka itu.

Gambar belum ada? Aman, game tetap jalan dan nampilin emoji sebagai pengganti. Kalau mau pakai gambar, taruh file PNG dengan nama persis seperti ini:

| File | Isi |
|---|---|
| `assets/hero/hero.png` | hero |
| `assets/mentor/mentor.png` | mentor |
| `assets/bosses/print-slime.png` | boss level 1 |
| `assets/bosses/var-goblin.png` | boss level 2 |
| `assets/bosses/operator-orc.png` | boss level 3 |
| `assets/bosses/fork-wraith.png` | boss level 4 |
| `assets/bosses/loop-serpent.png` | boss level 5 |
| `assets/bosses/function-golem.png` | boss level 6 |
| `assets/bosses/array-hydra.png` | boss level 7 |
| `assets/bosses/while-drake.png` | boss level 8 |
| `assets/bosses/struct-knight.png` | boss level 9 |
| `assets/bosses/segfault-dragon.png` | boss level 10 |
| `assets/backgrounds/basic.png` | background tier Basic |
| `assets/backgrounds/medium.png` | background tier Medium |
| `assets/backgrounds/expert.png` | background tier Expert |

Tips biar hasil AI kelihatan pixel art beneran:

1. Hapus background gambar (hasilnya PNG transparan).
2. Perkecil ke sekitar 64-128 px pakai *nearest neighbor*.
3. Game otomatis gedein lagi dengan `image-rendering: pixelated`.

## Musik dan efek suara

Semua suara dibikin lewat kode di `js/sound.js` (Web Audio), jadi ga ada file audio.

**Musik latar:** chiptune santai ala game petualangan 8-bit: melodi ceria 8 bar yang diulang, bass memantul, dan drum sangat ringan. Satu lagu dipakai di semua tier, tapi kuncinya dan warna suara leadnya beda: Basic cerah, Medium lebih tipis, Expert sedikit lebih berani. Musik mulai setelah pemain menyentuh layar pertama kali (aturan browser), dan bisa dimatiin terpisah dari efek suara di Pengaturan. Mau ngatur? `MUSIC_LEVEL` buat volume, `BPM` buat kecepatan, `MELODY` buat nada melodi, `MOODS` buat kunci tiap tier.

**Efek suara tombol:** semua tombol otomatis bunyi lewat satu pendengar klik global di akhir `sound.js`. Tombol yang udah punya suara sendiri (whoosh, kertas, halaman materi) ga ditambah klik lagi. Ada tiga jenis:

- `Sound.click()`: tombol biasa, "blip-blip" dua nada naik plus badan rendah.
- `Sound.confirm()`: tombol utama (`.btn` tanpa `.ghost`), arpeggio naik 4 nada.
- `Sound.key()`: tombol simbol editor, "tok" pendek.

Bisa dites dari Console browser (F12): ketik `Sound.click()`, `Sound.confirm()`, atau `Sound.key()`. Mau ngatur, ubah angka `vol` dan nada di tiga fungsi itu.

## Catatan compiler

C++ dan Python: kode user dikirim ke server publik [Judge0 CE](https://ce.judge0.com) (`js/judge.js`). Gratis, tapi ada batas pemakaian. Kalau nanti pemainnya banyak dan sering kena error "server sibuk", ganti `JUDGE_URL` ke server sendiri.

JavaScript: jalan langsung di browser lewat Web Worker (`runJavaScript()` di `judge.js`), ga lewat Judge0. Gratis, tanpa batas pemakaian, dan ga butuh internet buat jalanin kodenya.

- Preamble (ngubah `console.log` jadi kirim pesan, mematikan `fetch` dan `alert`) ditaruh di baris 1 tanpa enter, jadi nomor baris error sama dengan nomor baris di editor.
- Batas waktu `JS_TIME_LIMIT` (3 detik). Lewat itu worker dimatiin dan hasilnya `timeout`, jadi `while (true)` ga bikin tab nge-hang.
- Error dikembaliin dalam format `NamaError: pesan` + `line N`, lalu dibaca `JsErrors.explain()`.

## Upload ke GitHub

1. GitHub Desktop → **File → Add local repository** → pilih folder ini (kalau diminta, klik *create a repository*).
2. Commit, lalu **Publish repository** dengan nama `Compile-and-Conquer`.
3. Biar bisa dimainin online: di GitHub buka **Settings → Pages**, pilih branch `main` folder `/ (root)`, Save.

## Rencana

- [x] Kerangka game + 3 level Basic
- [ ] Sprite hero, boss, dan background
- [x] Level 4 dan 5 (if-else, for) + sound effect
- [x] Sound effect dan musik latar
- [x] Materi (gulungan belajar) di tiap level + mentor pixel art
- [x] Warna sintaks di editor
- [x] Pilihan bahasa C++ / Python + Python level 1-5
- [x] Pilih level: ulang level yang udah kalah tanpa nunggu tamat, level belum kebuka terkunci
- [x] Peta bab: pilih bahasa lewat peta, semua bab terbuka, Python diberi label "Disarankan"
- [x] Level 6-10 untuk C++ dan Python (function, array/list, while, struct/class, final boss) + materinya
- [ ] Sprite boss level 6-10
- [x] JavaScript: level 1-10 + materi, jalan di browser pakai Web Worker (ga lewat Judge0)
- [x] Serangan ke boss per baris output (HP turun bertahap)
- [x] Ghost baris berikutnya sejajar sama posisi setelah Enter
- [x] Lobby bisa digulung di zoom browser tinggi, Pengaturan ditutup lewat tombol X atau Esc
- [ ] Self-host Judge0 kalau pemainnya banyak
