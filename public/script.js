// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});
// Globals
let accessToken = '';                // current OAuth token
const imageMap = {                   // stock images
  smartcard:'smartcardkeyboard.png',
  docking:'dockingstation.png',
  mouse:'mouse.png',
  barcode:'scanner.png',
  keyboard:'keyboard.png',
  rover:'rover.png',
  powermic:'powermic.png',
  monitor:'monitor.png'
};
// Initialise
async function initializeApp() {
  try {
    accessToken = await fetchToken();

    setupUI();                       // build the interface

    const btn = document.getElementById('callApiBtn');
    btn.style.display = 'block';
    btn.addEventListener('click', handleButtonClick);
  } catch (err) {
    showResponse(`Failed to retrieve token: ${err.message}`, 'danger');
  }
}
// Helper utilities
async function fetchToken() {
  const res = await fetch('/get-token');
  if (!res.ok) throw new Error(await res.text());
  const { access_token } = await res.json();
  return access_token;
}

function getParam(name, def = null) {
  const params = new URLSearchParams(window.location.search);
  return params.has(name) ? params.get(name) : def;
}
// UI setup
function setupUI() {
  const codeType = getParam('codeType', 'call');
  const valid = ['call', 'stock', 'inf'];
  if (!valid.includes(codeType)) {
    showResponse('Invalid codeType specified in URL.', 'danger');
    return;
  }

  /** heading / image */
  const title = getParam('title');
  const heading = document.querySelector('h1');
  heading.textContent = title ? title : 'Missing title parameter!';

  if (title) showProductImage(title);

  /** show correct fields & button label */
  const btn = document.getElementById('callApiBtn');
  const infFields   = document.getElementById('infFields');
  const stockFields = document.getElementById('stockFields');

  infFields.style.display   = codeType === 'inf'   ? 'block' : 'none';
  stockFields.style.display = codeType === 'stock' ? 'block' : 'none';

  btn.textContent = codeType === 'call'
    ? 'Let us know!'
    : codeType === 'stock'
      ? 'Update stock'
      : 'Submit';

  /** tiny preview for chosen file */
  const chooser = document.getElementById('imageInput');
  const fname   = document.getElementById('fileName');
  chooser?.addEventListener('change', e => {
    fname.textContent = e.target.files.length ? e.target.files[0].name : '';
  });
}

function showProductImage(title) {
  const keyword = Object.keys(imageMap).find(k =>
    title.toLowerCase().includes(k));
  if (!keyword) return;

  const img = document.createElement('img');
  img.src   = `img/${imageMap[keyword]}`;
  img.alt   = keyword;
  img.className = 'img-fluid d-block mx-auto';

  const holder = document.getElementById('image-container');
  holder.innerHTML = '';
  holder.appendChild(img);
}
// Main button handler
async function handleButtonClick() {
  hideResponse();
  const codeType = getParam('codeType', 'call');

  try {
    if      (codeType === 'inf')   await submitInfo();
    else if (codeType === 'stock') await submitStock();
    else                           await submitCall();
  } catch (err) {
    showResponse(`Submission error: ${err.message}`, 'danger');
  }
}
// Submit flows
async function submitInfo() {
  const description = document.getElementById('descriptionInput').value.trim();
  const file        = document.getElementById('imageInput').files[0];

  if (!description) {
    showResponse('Description is required.', 'danger');
    return;
  }

  const form = new FormData();
  form.append('description', description);
  if (file) form.append('attachment', file);          // FIELD NAME FIX

  await postData(form);
}

async function submitStock() {
  const qty = document.getElementById('quantityInput').value;
  await postData(JSON.stringify({ quantity: qty }), 'application/json');
}

async function submitCall() {
  await postData(null);
}

// POST wrapper
async function postData(body, type) {
  const url = `/make-call?${new URLSearchParams(window.location.search)}`;
  showProgressBar();

  const res = await fetch(url, {
    method : 'POST',
    headers: type ? { 'Content-Type': type } : undefined,
    body
  });

  hideProgressBar();
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Unknown error');

  document.getElementById('callApiBtn').style.display = 'none';
  showResponse(`Success! Reference **${data.callRef}**`, 'success');
}
// Progress / response helpers
function showProgressBar() {
  document.getElementById('responseOutput').innerHTML =
    '<div class="progress"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div></div>';
}
function hideProgressBar() {
  document.getElementById('responseOutput').innerHTML = '';
}

function showResponse(msg, cls='info') {
  document.getElementById('responseOutput').innerHTML =
    `<div class="alert alert-${cls}" role="alert">${msg}</div>`;
}
function hideResponse(){ document.getElementById('responseOutput').innerHTML=''; }