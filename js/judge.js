// Ngirim kode C++ ke compiler online (Judge0 CE), terus ambil hasilnya.
//
// Catatan:
// - Server publik ini gratis tapi ada batas pemakaian. Kalau nanti rame,
//   ganti JUDGE_URL ke server sendiri.
// - ID bahasa (C++ = 54, Python = 71) ada di lang.js.

const JUDGE_URL = 'https://ce.judge0.com';

// Judge0 minta/ngasih teks dalam base64 (aman buat karakter spesial).
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(b64) {
  if (!b64) return '';
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Hasil yang dikembalikan selalu punya field `kind`:
//   'ok'       -> program jalan, lihat `stdout`
//   'compile'  -> error pas compile, lihat `compileOutput`
//   'runtime'  -> crash pas jalan, lihat `stderr`
//   'timeout'  -> kelamaan (biasanya infinite loop)
//   'network'  -> ga bisa nyambung ke server, lihat `message`
async function runCode(code) {
  if (Lang.current() === 'javascript') return runJavaScript(code);
  let response;
  try {
    response = await fetch(`${JUDGE_URL}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: toBase64(code),
        language_id: Lang.info().judgeId,
        stdin: '',
      }),
    });
  } catch (err) {
    return {
      kind: 'network',
      message: 'Ga bisa nyambung ke server compiler. Cek internet kamu, lalu coba lagi.',
    };
  }

  if (!response.ok) {
    return {
      kind: 'network',
      message: `Server compiler lagi sibuk (kode ${response.status}). Tunggu sebentar, lalu coba lagi.`,
    };
  }

  const data = await response.json();
  const statusId = data.status && data.status.id;

  let kind = 'runtime';
  if (statusId === 3) kind = 'ok';
  else if (statusId === 6) kind = 'compile';
  else if (statusId === 5) kind = 'timeout';

  const stderr = fromBase64(data.stderr);
  let compileOutput = fromBase64(data.compile_output);
  // Python ga punya tahap compile. SyntaxError dan error lain keluar sebagai
  // Traceback di stderr, jadi diperlakukan kayak error compile biar dapat
  // penjelasan ramah.
  if (Lang.current() === 'python' && kind === 'runtime' && stderr.trim()) {
    kind = 'compile';
    compileOutput = stderr;
  }

  return {
    kind,
    statusText: data.status ? data.status.description : '',
    stdout: fromBase64(data.stdout),
    stderr,
    compileOutput,
  };
}

// JavaScript jalan langsung di browser lewat Web Worker (ga lewat Judge0).
// - Preamble ditaruh di baris 1 tanpa enter, jadi nomor baris error = nomor baris di editor.
// - console.log dikirim balik per baris. Worker dimatiin kalau lewat batas waktu
//   (while (true) ga bikin tab nge-hang).
// - Semua error (SyntaxError maupun runtime) dikembaliin sebagai kind 'compile'
//   dengan format "NamaError: pesan" + "line N", dibaca JsErrors.explain().
const JS_TIME_LIMIT = 3000;
const JS_PREAMBLE = "const __fmt=(x)=>typeof x==='object'&&x!==null?JSON.stringify(x):String(x);"
  + "console.log=console.info=console.warn=console.error=(...a)=>self.postMessage({out:a.map(__fmt).join(' ')});"
  + "self.alert=self.prompt=self.fetch=self.XMLHttpRequest=self.WebSocket=undefined;";

function runJavaScript(code) {
  return new Promise((resolve) => {
    if (typeof Worker === 'undefined') {
      resolve({ kind: 'network', message: 'Browser ini ga mendukung Web Worker, jadi JavaScript belum bisa dijalankan.' });
      return;
    }
    const source = `${JS_PREAMBLE}${code}\n;self.postMessage({done:true});`;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);
    const out = [];
    let finished = false;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ statusText: '', stderr: '', compileOutput: '', stdout: out.join('\n'), ...result });
    };

    const timer = setTimeout(() => finish({ kind: 'timeout' }), JS_TIME_LIMIT);
    worker.onmessage = (event) => {
      const data = event.data || {};
      if (typeof data.out === 'string') out.push(data.out);
      else if (data.done) finish({ kind: 'ok' });
    };
    worker.onerror = (event) => {
      event.preventDefault();
      const match = String(event.message || '').match(/^(?:Uncaught\s+)?(\w*Error):\s*(.*)$/);
      const name = match ? match[1] : 'Error';
      const text = match ? match[2] : String(event.message || '');
      finish({ kind: 'compile', compileOutput: `${name}: ${text}\nline ${event.lineno || 0}`, stderr: text });
    };
  });
}

// Bandingin output: spasi/enter di ujung baris diabaikan.
function normalizeOutput(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function sameOutput(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}