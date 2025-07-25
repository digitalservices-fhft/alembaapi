// Helper functions (declare before use)
const el    = id => document.getElementById(id);
const qs    = (key, defaultValue = null) => { /* … */ };
const api   = async (path, opts = {}) => { /* … */ };

/* Map keywords to image filenames */
const imageMap = {
  smartcard: 'smartcardkeyboard.png',
  docking: 'dockingstation.png',
  mouse: 'mouse.png',
  barcode: 'scanner.png',
  keyboard: 'keyboard.png',
  rover: 'rover.png',
  powermic: 'powermic.png',
  monitor: 'monitor.png',
};

/* Initialize UI */
async function initializeApp() {
  try {
    applyQueryToUI();
    const btn = document.getElementById('callApiBtn');
    btn.classList.remove('hidden');
    btn.onclick = handleButtonClick;
  } catch (err) {
    showResponse(`⛔️ ${err.message}`, 'danger');
  }
}

/* Populate title and image */
function applyQueryToUI() {
  const rawCodeType = qs('codeType');
  const codeType = rawCodeType ? rawCodeType.toLowerCase() : '';

  const title = qs('title') || 'Missing title parameter';
  const heading = document.querySelector('h1.mb-4.text-center');
  if (heading) {
    heading.textContent = title;
  }
    if (codeType === 'stock') {
    const keyword = Object.keys(imageMap).find((k) =>
      title.toLowerCase().includes(k)
    );
    if (keyword) {
      const img = new Image();
      img.src = `img/${imageMap[keyword]}`;
      img.alt = keyword;
      img.className = 'img-fluid d-block mx-auto';
      const container = el('image-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(img);
      }
    }
  }

  const infFields = el('infFields');
  if (infFields) infFields.classList.toggle('hidden', codeType !== 'inf');

  const stockFields = el('stockFields');
  if (stockFields) stockFields.classList.toggle('hidden', codeType !== 'stock');

  const callFields = el('callFields');
  if (callFields) callFields.classList.toggle('hidden', codeType !== 'call');
}

/* Handle button click */
async function handleButtonClick() {
  try {
    hideResponse();
    showProgressBar();
    const codeType = qs('codeType', 'call');
    if (codeType === 'inf') await submitInf();
    else if (codeType === 'stock') await submitStock();
    else await submitCall();
  } catch (e) {
    hideProgressBar();
    showResponse(`⛔️ ${e.message}`, 'danger');
  }
}

// Bootstrap application after DOM ready
document.addEventListener('DOMContentLoaded', initializeApp);

/* Fetch auth token */
const fetchToken = () =>
  api(`https://fhnhs.alembacloud.com/production/alemba.api/api/v2/token`, { method: 'GET' }).then(
    (d) => d.access_token
);

/* Sub-flows */
async function submitCall() {
  const token = await fetchToken();
  const params = new URLSearchParams(window.location.search);
  const url = `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call?${params}`;
  const out = await api(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  hideProgressBar();
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

  const params = new URLSearchParams(window.location.search);
  const url = `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call?${params}`;
  const out = await api(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  hideProgressBar();
  showResponse(`🎉 Success! Ref **${out.callRef}**`, 'success');
}

async function submitStock() {
  const token = await fetchToken();
  const quantity = el('quantityInput').value;
  if (!quantity) throw new Error('Quantity required');
  const params = new URLSearchParams(window.location.search);
  const url = `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/inventory-allocation?${params}`;
  const out = await api(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });
  hideProgressBar();
  showResponse(`🎉 Success! Ref **${out.allocationRef}**`, 'success');
}

/* UI feedback */
function showResponse(msg, kind = 'info') {
  const box = el('responseOutput');
  box.style.display = 'block';
  box.className = `alert alert-${kind}`;
  box.innerHTML = msg;
}

function hideResponse() {
  const box = el('responseOutput');
  box.style.display = 'none';
  box.textContent = '';
}

function showProgressBar() {
  const box = el('responseOutput');
  box.style.display = 'block';
  box.innerHTML = `<div class="progress"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div></div>`;
}

function hideProgressBar() {
  el('responseOutput').style.display = 'none';
}