# Compile & Conquer

Game web 2D pixel art buat belajar C++. Tiap level ada satu boss. Tulis programnya dengan benar, boss-nya tumbang.

Dibuat buat temen-temen Informatika yang baru mulai ngoding.

## Cara jalanin di lokal

1. Buka folder ini di VS Code.
2. Klik kanan `index.html` → **Open with Live Server**.
3. Butuh internet, karena editor (Monaco) dan compiler C++ diambil dari online.

Jangan dibuka langsung dengan klik dua kali `index.html`, pakai Live Server aja biar editornya jalan normal.

## Struktur folder

```
compile-and-conquer/
├── index.html          halaman utama
├── css/style.css       tampilan
├── js/
│   ├── levels.js       daftar level (boss, soal, hint)
│   ├── judge.js        kirim kode ke compiler online
│   ├── editor.js       editor kode + ghost text
│   └── game.js         logika game & animasi
└── assets/
    ├── hero/           sprite hero
    ├── bosses/         sprite boss
    └── backgrounds/    background per tier
```

## Nambah level

Buka `js/levels.js`, copy salah satu objek di array `LEVELS`, lalu ubah isinya:

- `boss`: nama, file sprite, dan emoji cadangan
- `task`: cerita + perintah soal
- `expected`: output persis yang harus keluar
- `ghost`: baris hint abu-abu (user tekan Tab buat nerima)
- `requires`: aturan tambahan biar user ga cuma ngetik hasilnya langsung (opsional)

## Sprite & background

Gambar belum ada? Aman, game tetap jalan dan nampilin emoji sebagai pengganti. Kalau mau pakai gambar, taruh file PNG dengan nama persis seperti ini:

| File | Isi |
|---|---|
| `assets/hero/hero.png` | hero |
| `assets/bosses/print-slime.png` | boss level 1 |
| `assets/bosses/var-goblin.png` | boss level 2 |
| `assets/bosses/operator-orc.png` | boss level 3 |
| `assets/backgrounds/basic.png` | background tier Basic |
| `assets/backgrounds/medium.png` | background tier Medium |
| `assets/backgrounds/expert.png` | background tier Expert |

Tips biar hasil AI kelihatan pixel art beneran:

1. Hapus background gambar (hasilnya PNG transparan).
2. Perkecil ke sekitar 64-128 px pakai *nearest neighbor*.
3. Game otomatis gedein lagi dengan `image-rendering: pixelated`.

## Catatan compiler

Kode C++ user dikirim ke server publik [Judge0 CE](https://ce.judge0.com) (`js/judge.js`). Gratis, tapi ada batas pemakaian. Kalau nanti pemainnya banyak dan sering kena error "server sibuk", ganti `JUDGE_URL` ke server sendiri.

## Upload ke GitHub

1. GitHub Desktop → **File → Add local repository** → pilih folder ini (kalau diminta, klik *create a repository*).
2. Commit, lalu **Publish repository** dengan nama `Compile-and-Conquer`.
3. Biar bisa dimainin online: di GitHub buka **Settings → Pages**, pilih branch `main` folder `/ (root)`, Save.

## Rencana

- [x] Kerangka game + 3 level Basic
- [ ] Sprite hero, boss, dan background
- [ ] Level Medium (if-else, loop, function)
- [ ] Level Expert (array, struct, final boss)
- [ ] Sound & musik
