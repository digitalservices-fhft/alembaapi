/* global FormData */
document.addEventListener('DOMContentLoaded', () => initializeApp());

/* Globals */
const imageMap = {
  smartcard: 'smartcardkeyboard.png',
  docking: 'dockingstation.png',
  mouse: 'mouse.png',
  barcode: 'scanner.png',
  keyboard: 'keyboard.png',
  rover: 'rover.png',
  powermic: 'powermic.png',
  monitor: 'monitor.png'
};

/* Init */
async function initializeApp() {
  try {
    applyQueryToUI();
    const btn = el('callApiBtn');
    btn.classList.remove('hidden');
    btn.onclick = handleButtonClick;
  } catch (err) {
    showResponse(`⛔️ ${err.message}`, 'danger');
  }
}

/* Helpers */
const el = (id) => document.getElementById(id);
const qs = (key, d = null) =>
  new URLSearchParams(window.location.search).get(key) ?? d;
const api = (path, opts) => fetch(path, opts).then(async (r) => {
  const body = await r.json();
  if (!r.ok) throw new Error(body.message);
  return body;
});

function applyQueryToUI() {
  const codeType = qs('codeType', 'call').toLowerCase();
  const title = qs('title');
  const heading = el('boardTitle');
  if (heading) heading.textContent = title || 'Missing title parameter';

  // Show image if keyword matches
  if (codeType === 'stock') {
    const keyword = Object.keys(imageMap).find((k) =>
      title?.toLowerCase().includes(k)
    );
    if (keyword) {
      const img = new Image();
      img.src = `img/${imageMap[keyword]}`;
      img.alt = keyword;
      img.className = 'img-fluid d-block mx-auto';
      heading?.after(img);
    }
  }

  // Toggle field sets
  el('infFields').classList.toggle('hidden', codeType !== 'inf');
  el('stockFields').classList.toggle('hidden', codeType !== 'stock');

  // Button label
  const btn = el('callApiBtn');
  btn.textContent =
    codeType === 'call'
      ? 'Let us know!'
      : codeType === 'inf'
      ? 'Submit'
      : 'Update stock';
}

/* Submission orchestrator */
async function handleButtonClick() {
  try {
    hideResponse();
    showProgressBar();
    const codeType = qs('codeType', 'call');
    if (codeType === 'inf') await submitInf();
    else if (codeType === 'stock') await submitStock();
    else await submitCall();
    hideProgressBar();
  } catch (e) {
    hideProgressBar();
    showResponse(`⛔️ ${e.message}`, 'danger');
  }
}

/* Token helper */
const fetchToken = () => api('/get-token').then((d) => d.access_token);

/* Sub-flows */
async function submitCall() {
  const token = await fetchToken();
  const url = `/make-call?${new URLSearchParams(window.location.search)}`;
  const out = await api(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  showResponse(`🎉 Success! Ref **${out.callRef}**`, 'success');
}

async function submitInf() {
  const token = await fetchToken();
  const description = el('descriptionInput').value.trim();
  if (!description) throw new Error('Description required');
  const fd = new FormData();
  fd.append('description', description);
  const file = el('imageInput').files[0];
  if (file) fd.append('attachment', file);
  const url = `/make-call?${new URLSearchParams(window.location.search)}`;
  const out = await api(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  showResponse(`🎉 Success! Ref **${out.callRef}**`, 'success');
}

async function submitStock() {
  const token = await fetchToken();
  const quantity = el('quantityInput').value;
  if (!quantity) throw new Error('Quantity required');
  const url = `/make-call?${new URLSearchParams(window.location.search)}`;
  const out = await api(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ quantity })
  });
  showResponse(`🎉 Success! Ref **${out.callRef}**`, 'success');
}

/* UI feedback helpers */
function showResponse(msg, kind = 'info') {
  const box = el('responseOutput');
  box.style.display = 'block';
  box.className = `alert alert-${kind}`;
  box.innerHTML = msg;
  el('callApiBtn').classList.remove('hidden');
}

function hideResponse() {
  const box = el('responseOutput');
  box.style.display = 'none';
  box.textContent = '';
}

function showProgressBar() {
  const box = el('responseOutput');
  box.style.display = 'block';
  box.innerHTML = `
  <div class="progress">
    <div class="progress-bar progress-bar-striped progress-bar-animated"
    style="width:100%"></div>
  </div>`;
  el('callApiBtn').classList.add('hidden');
  el('callApiBtn').setAttribute('aria-busy', 'true');
}

function hideProgressBar() {
  const box = el('responseOutput');
  if (box) box.style.display = 'none';
  el('callApiBtn').removeAttribute('aria-busy');
}