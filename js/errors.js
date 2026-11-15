// Ngubah pesan error compiler (GCC) yang serem jadi penjelasan ramah.
// Hasilnya: nomor baris, isi baris itu, dan penjelasan singkat.
//
// Catatan: GCC sering nunjuk baris SETELAH titik koma yang ketinggalan
// ("expected ';' before 'return'"), jadi kasus itu dimundurin ke baris atasnya.

const ErrorHelp = (() => {
  const KNOWN = ['cout', 'cin', 'endl', 'int', 'return', 'main', 'if', 'else', 'for', 'while', 'string', 'include', 'using', 'namespace', 'std'];

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

  function closestKeyword(word) {
    const lower = word.toLowerCase();
    let best = null;
    let bestScore = 3;
    KNOWN.forEach((kw) => {
      const score = distance(lower, kw);
      if (score < bestScore) { best = kw; bestScore = score; }
    });
    return best;
  }

  function lastCodeLine(lines) {
    for (let i = lines.length - 1; i >= 0; i--) if (lines[i].trim()) return i + 1;
    return 1;
  }

  // Baris kode non-kosong sebelum baris `n` (1-based).
  function prevCodeLine(lines, n) {
    for (let i = n - 2; i >= 0; i--) if (lines[i].trim()) return i + 1;
    return n;
  }

  function notDeclared(name) {
    if (['cout', 'cin', 'endl'].includes(name)) {
      return `'${name}' belum dikenal. Cek dua baris paling atas: #include <iostream> dan using namespace std; harus ada dan ditulis benar.`;
    }
    const near = closestKeyword(name);
    if (near && near !== name) {
      return near === name.toLowerCase()
        ? `Huruf besar-kecil ngaruh di C++. Tulis '${near}', bukan '${name}'.`
        : `'${name}' ga dikenal. Mungkin salah ketik, maksudmu '${near}'?`;
    }
    return `'${name}' belum dikenal. Kemungkinan salah ketik, atau variable-nya belum dibuat. Cek huruf besar-kecilnya juga.`;
  }

  function explain(output, code) {
    const lines = code.split('\n');
    const match = output.match(/^[^\s:]+:(\d+):(\d+):\s*(?:fatal )?error:\s*(.+)$/m);
    if (!match) {
      return { line: 0, codeLine: '', message: 'Ada yang salah ketik atau simbolnya kurang. Baca lagi kodenya pelan-pelan.', raw: output.trim().split('\n')[0] || '' };
    }

    let line = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);
    const text = match[3].trim();
    const raw = match[0];
    let message = null;
    let m;

    if (/missing terminating > character/.test(text)) {
      message = 'Tanda > penutup di #include belum ada. Harusnya: #include <iostream>';
    } else if (/missing terminating " character/.test(text)) {
      message = 'Tanda kutip penutup (") belum ada di baris ini. Teks harus diapit dua tanda kutip.';
    } else if (/expected (?:',' or )?';'/.test(text)) {
      if (/at end of input/.test(text)) {
        line = lastCodeLine(lines);
      } else if (/before/.test(text)) {
        const before = (lines[line - 1] || '').slice(0, Math.max(col - 1, 0));
        if (before.trim() === '') line = prevCodeLine(lines, line);
      }
      message = `Titik koma (;) kemungkinan kurang di akhir baris ${line}. Hampir semua perintah C++ diakhiri ;`;
    } else if (/expected '\}' at end of input/.test(text)) {
      line = lastCodeLine(lines);
      message = 'Kodenya belum selesai: ada { yang belum ditutup. Tiap { harus punya pasangan }.';
    } else if (/expected (?:declaration|unqualified-id) before '\}' token/.test(text)) {
      message = 'Ada } berlebih, atau ada baris yang nyasar di luar main().';
    } else if ((m = text.match(/'(.+)' was not declared in this scope/))) {
      message = notDeclared(m[1]);
    } else if ((m = text.match(/'(.+)' does not name a type/))) {
      message = `'${m[1]}' ketemu di luar main() atau salah ketik. Perintah harus ada di dalam int main() { ... }.`;
    } else if (/expected '\)'/.test(text)) {
      message = 'Kurung tutup ) kurang di baris ini. Tiap ( harus punya pasangan ).';
    } else if (/expected '\('/.test(text)) {
      message = 'Kurung buka ( kurang di baris ini.';
    } else if (/expected '\{'/.test(text)) {
      message = 'Kurung kurawal buka { kurang di sini.';
    } else if ((m = text.match(/stray '(.+)' in program/))) {
      message = 'Ada karakter aneh. Biasanya tanda kutip lengkung hasil copy-paste. Ketik ulang tanda kutipnya langsung dari keyboard.';
    } else if (/no match for 'operator<<'/.test(text)) {
      message = 'Cek tanda << nya. Untuk cout harus dua tanda < berurutan: cout << ...';
    } else if (/No such file or directory/.test(text)) {
      message = 'Nama header ga ketemu. Cek tulisan #include <iostream>, semuanya huruf kecil.';
    } else if (/'else' without a previous 'if'/.test(text)) {
      message = 'else harus langsung setelah blok if. Cek kurung kurawal } sebelum else.';
    } else if (/main/.test(text) && /(must return 'int'|forbids declaration)/.test(text)) {
      message = "Tulis int main() { ... }, jangan lupa kata 'int' di depan main.";
    } else if (/expected primary-expression before '(.+)' token/.test(text)) {
      const token = text.match(/before '(.+)' token/)[1];
      message = `Ada bagian yang belum lengkap dekat '${token}'. Contoh: operator tanpa angka, atau tanda kutip ketinggalan.`;
    } else {
      message = 'Ada yang salah ketik atau simbolnya kurang di sekitar baris ini.';
    }

    return { line, codeLine: (lines[line - 1] || '').trim(), message, raw };
  }

  return { explain };
})();