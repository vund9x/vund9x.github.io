// ---------- Helpers ----------
const enc = new TextEncoder();

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const eyeIcon = btn.querySelector('.eye-icon');
  const eyeOffIcon = btn.querySelector('.eye-off-icon');
  if (input.type === 'password') {
    input.type = 'text';
    eyeIcon.style.display = 'none';
    eyeOffIcon.style.display = 'block';
  } else {
    input.type = 'password';
    eyeIcon.style.display = 'block';
    eyeOffIcon.style.display = 'none';
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');
}

// base64 encode (RawStdEncoding, no padding)
function base64RawStd(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/=+$/, '');
}

async function sha256Bytes(str) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return new Uint8Array(buf);
}

async function deterministicSalt(hint, pepper, saltLength) {
  const sum = await sha256Bytes('salt|' + pepper + '|' + hint);
  const salt = new Uint8Array(saltLength);
  if (saltLength > sum.length) {
    let offset = 0;
    while (offset < saltLength) {
      const chunk = sum.subarray(0, saltLength - offset);
      salt.set(chunk, offset);
      offset += chunk.length;
    }
  } else {
    salt.set(sum.subarray(0, saltLength));
  }
  return salt;
}

function randomSalt(saltLength) {
  const salt = new Uint8Array(saltLength);
  crypto.getRandomValues(salt);
  return salt;
}

function buildHashInput(hint, pepper) {
  return pepper ? ('input|' + pepper + '|' + hint) : hint;
}

// ---------- Argon2id form ----------
const form = document.getElementById('argon-form');
const submitBtn = document.getElementById('submit-btn');
const errorBox = document.getElementById('error-box');
const resultBox = document.getElementById('result-box');
const pepperWarning = document.getElementById('pepper-warning');
const masterKeyInput = document.getElementById('master_key');
const deterministicCb = document.getElementById('deterministic');

function updatePepperWarning() {
  const show = deterministicCb.checked && !masterKeyInput.value.trim();
  pepperWarning.style.display = show ? 'block' : 'none';
}
if (masterKeyInput && deterministicCb) {
  masterKeyInput.addEventListener('input', updatePepperWarning);
  deterministicCb.addEventListener('change', updatePepperWarning);
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  resultBox.style.display = 'none';
}
function clearError() {
  errorBox.style.display = 'none';
  errorBox.textContent = '';
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const hint = document.getElementById('hint').value.trim();
    const pepper = masterKeyInput.value.trim();
    const deterministic = deterministicCb.checked;

    if (!hint) {
      showError('Vui lòng nhập từ gợi nhớ trước khi tạo mã.');
      return;
    }

    const timeCost = Math.max(1, parseInt(document.getElementById('timeCost').value) || 2);
    const memoryCostMB = Math.max(1, parseInt(document.getElementById('memoryCostMB').value) || 64);
    const memoryCost = memoryCostMB * 1024; // KB
    const threads = Math.max(1, parseInt(document.getElementById('threads').value) || 2);
    const keyLength = Math.max(16, parseInt(document.getElementById('keyLength').value) || 16);
    const saltLength = Math.max(8, parseInt(document.getElementById('saltLength').value) || 16);

    if (deterministic && !pepper) {
      showError('Thiếu master key bí mật. Hãy nhập tại form trước khi dùng chế độ chuỗi cố định.');
      return;
    }

    if (typeof hashwasm === 'undefined' || !hashwasm.argon2id) {
      showError('Không tải được thư viện Argon2 (hash-wasm). Vui lòng kiểm tra kết nối mạng và thử lại.');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Đang tính toán...';

    try {
      const salt = deterministic
        ? await deterministicSalt(hint, pepper, saltLength)
        : randomSalt(saltLength);

      const hashInput = buildHashInput(hint, pepper);

      const hashBytes = await hashwasm.argon2id({
        password: enc.encode(hashInput),
        salt: salt,
        parallelism: threads,
        iterations: timeCost,
        memorySize: memoryCost, // KB
        hashLength: keyLength,
        outputType: 'binary',
      });

      const saltB64 = base64RawStd(salt);
      const hashB64 = base64RawStd(hashBytes);
      const encoded = `$argon2id$v=19$m=${memoryCost},t=${timeCost},p=${threads}$${saltB64}$${hashB64}`;

      document.getElementById('hash_result').value = hashB64;
      document.getElementById('encoded-result').textContent = encoded;
      document.getElementById('hash-length').textContent = `(${hashB64.length} ký tự)`;
      resultBox.style.display = 'block';
    } catch (err) {
      console.error(err);
      showError('Có lỗi xảy ra khi tạo mã hóa Argon2id: ' + (err && err.message ? err.message : err));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function copyHash(btn) {
  const input = document.getElementById('hash_result');
  input.select();
  input.setSelectionRange(0, 99999);
  const done = () => {
    const original = btn.innerText;
    btn.innerText = 'Đã copy!';
    setTimeout(() => { btn.innerText = original; }, 2000);
  };
  navigator.clipboard.writeText(input.value).then(done).catch(() => {
    document.execCommand('copy');
    done();
  });
}

// ---------- Random password ----------
function generateRandomPassword() {
  const length = parseInt(document.getElementById('rand-length').value) || 16;
  const incUpper = document.getElementById('inc-uppercase').checked;
  const incLower = document.getElementById('inc-lowercase').checked;
  const incNum = document.getElementById('inc-numbers').checked;
  const incSym = document.getElementById('inc-symbols').checked;
  const minNum = parseInt(document.getElementById('min-numbers').value) || 0;
  const minSym = parseInt(document.getElementById('min-special').value) || 0;
  const avoidAmb = document.getElementById('avoid-ambiguous').checked;

  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let numChars = '0123456789';
  let symChars = '!@#$%^&*';

  if (avoidAmb) {
    upperChars = upperChars.replace(/[IO]/g, '');
    lowerChars = lowerChars.replace(/[ilo]/g, '');
    numChars = numChars.replace(/[01]/g, '');
  }

  let allChars = '';
  if (incUpper) allChars += upperChars;
  if (incLower) allChars += lowerChars;
  if (incNum) allChars += numChars;
  if (incSym) allChars += symChars;

  if (allChars.length === 0) {
    document.getElementById('rand-pwd-result').textContent = 'Chọn ít nhất 1 loại ký tự';
    return;
  }

  const pickSecure = (pool) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return pool.charAt(buf[0] % pool.length);
  };

  const requiredChars = [];
  if (incNum) for (let i = 0; i < minNum; i++) if (numChars.length) requiredChars.push(pickSecure(numChars));
  if (incSym) for (let i = 0; i < minSym; i++) if (symChars.length) requiredChars.push(pickSecure(symChars));

  const remainingLength = Math.max(0, length - requiredChars.length);
  let body = '';
  for (let i = 0; i < remainingLength; i++) body += pickSecure(allChars);

  let arr = (body + requiredChars.join('')).split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    const temp = Reflect.get(arr, i);
    Reflect.set(arr, i, Reflect.get(arr, j));
    Reflect.set(arr, j, temp);
  }
  document.getElementById('rand-pwd-result').textContent = arr.join('').slice(0, length);
}

function copyRandomPassword() {
  const pwd = document.getElementById('rand-pwd-result').textContent;
  if (!pwd || pwd === 'Chọn ít nhất 1 loại ký tự') return;
  const btn = document.getElementById('rand-copy-btn');
  const copyIcon = btn.querySelector('.copy-icon');
  const checkIcon = btn.querySelector('.check-icon');
  if (!copyIcon || !checkIcon) return;

  navigator.clipboard.writeText(pwd).then(() => {
    copyIcon.style.display = 'none';
    checkIcon.style.display = 'block';
    setTimeout(() => {
      copyIcon.style.display = 'block';
      checkIcon.style.display = 'none';
    }, 2000);
  }).catch((err) => console.error('Lỗi khi copy:', err));
}

window.addEventListener('DOMContentLoaded', () => {
  generateRandomPassword();
});
