// Ngirim kode C++ ke compiler online (Judge0 CE), terus ambil hasilnya.
//
// Catatan:
// - Server publik ini gratis tapi ada batas pemakaian. Kalau nanti rame,
//   ganti JUDGE_URL ke server sendiri.
// - 54 = C++ (GCC 9.2.0) di Judge0 CE.

const JUDGE_URL = 'https://ce.judge0.com';
const CPP_LANGUAGE_ID = 54;

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
async function runCpp(code) {
  let response;
  try {
    response = await fetch(`${JUDGE_URL}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: toBase64(code),
        language_id: CPP_LANGUAGE_ID,
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

  return {
    kind,
    statusText: data.status ? data.status.description : '',
    stdout: fromBase64(data.stdout),
    stderr: fromBase64(data.stderr),
    compileOutput: fromBase64(data.compile_output),
  };
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
