// Wait for the DOM to be fully loaded before running the app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Define imageMap for stock items
const imageMap = {
  smartcard: "smartcardkeyboard.png",
  docking: "dockingstation.png",
  mouse: "mouse.png",
  barcode: "scanner.png",
  keyboard: "keyboard.png",
  rover: "rover.png",
  powermic: "powermic.png",
  monitor: "monitor.png"
};

// Initialises the app: sets up UI and binds button click
async function initializeApp() {
  try {
    setupUI(); // Adjust UI based on query parameters
    const btn = document.getElementById('callApiBtn');
    btn.style.display = 'block'; // Show the button
    btn.addEventListener('click', handleButtonClick); // Bind click handler
  } catch (err) {
    showResponse(`Failed to initialise app: ${err.message}`, 'danger');
  }
}

// Fetches the access token from the server
async function fetchToken() {
  const response = await fetch('/get-token');
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.access_token;
}

// Utility to get a query parameter from the URL
function getParam(param, defaultValue = null) {
  const params = new URLSearchParams(window.location.search);
  return params.has(param) ? params.get(param) : defaultValue;
}

// Sets up the UI based on the codeType parameter (title, call, stock, inf)
function setupUI() {
  const validTypes = ['call', 'stock', 'inf'];
  const codeType = getParam('codeType', 'call');

  if (!validTypes.includes(codeType)) {
    showResponse('Invalid codeType specified in URL.', 'danger');
    return;
  }

  const btn = document.getElementById('callApiBtn');
  const imageContainer = document.getElementById('image-container');
  const boardTitle = getParam('title');
  const heading = document.querySelector('h1.mb-4');

  if (!boardTitle && heading) {
    heading.textContent = 'If you are seeing this you have not passed the correct title parameter!';
  }

  if (boardTitle && heading) {
    heading.textContent = boardTitle;
  }

  if (boardTitle && imageContainer) {
    imageContainer.innerHTML = '';
    const keyword = Object.keys(imageMap).find(k =>
      boardTitle.toLowerCase().includes(k)
    );
    if (keyword) {
      const img = document.createElement('img');
      img.src = `img/${imageMap[keyword]}`;
      img.alt = keyword;
      img.className = 'img-fluid d-block mx-auto';
      img.onerror = () => (img.style.display = 'none');
      imageContainer.appendChild(img);
    } else {
      imageContainer.textContent = 'No matching image found.';
    }
  }

  const infFields = document.getElementById('infFields');
  const stockFields = document.getElementById('stockFields');

  switch (codeType) {
    case 'call':
      btn.textContent = 'Let us know!';
      infFields.style.display = 'none';
      stockFields.style.display = 'none';
      break;
    case 'stock':
      btn.textContent = 'Update stock';
      stockFields.style.display = 'block';
      infFields.style.display = 'none';
      break;
    case 'inf':
      btn.textContent = 'Submit';
      infFields.style.display = 'block';
      stockFields.style.display = 'none';
      break;
    default:
      btn.textContent = 'Submit';
      infFields.style.display = 'none';
      stockFields.style.display = 'none';
  }

  const imageControl = document.getElementById('imageInput');
  const imageFile    = imageControl ? imageControl.files[0] : null;
  if (imageControl && fileName) {
    imageControl.addEventListener('change', (e) => {
      fileName.textContent = e.target.files.length > 0 ? e.target.files[0].name : '';
    });
  }
}

// Handles the main button click and routes to the appropriate submission function
async function handleButtonClick() {
  hideResponse();
  const codeType = getParam('codeType', 'call');

  try {
    if (codeType === 'inf') {
      await submitInfo();
    } else if (codeType === 'stock') {
      await submitStock();
    } else {
      await submitCall();
    }
  } catch (err) {
    showResponse(`Submission error: ${err.message}`, 'danger');
  }
}

// Submits a general call using query parameters
async function submitCall() {
  const token = await fetchToken();
  const btn = document.getElementById('callApiBtn');
  if (btn) btn.style.display = 'none';
  showProgressBar();

  const urlParams = new URLSearchParams(window.location.search);
  const url = `/make-call?${urlParams.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  hideProgressBar();
  const result = await res.json();
  if (res.ok) {
    showResponse(`Call submitted, ref: **${result.callRef}**`, 'success');
  } else {
    throw new Error(result.message || 'Unknown error');
  }
}

// Submits an information call with optional image attachment
async function submitInfo() {
  const token = await fetchToken();
  const btn = document.getElementById('callApiBtn');
  if (btn) btn.style.display = 'none';
  showProgressBar();

  const description = document.getElementById('descriptionInput').value;
  const imageControl = document.getElementById('imageInput');
  const imageFile    = imageControl ? imageControl.files[0] : null;

  if (!description) {
    showResponse('Description is required.', 'danger');
    return;
  }

  const formData = new FormData();
  formData.append('description', description);
  if (imageFile) formData.append('attachment', imageFile);

  const urlParams = new URLSearchParams(window.location.search);
  const url = `/make-call?${urlParams.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  hideProgressBar();
  const result = await res.json();
  if (res.ok) {
    showResponse(`Success 🎉 your reference is: <strong>${result.callRef}</strong>`, 'success');
  } else {
    throw new Error(result.message || 'Unknown error');
  }
}

// Submits a stock update request
async function submitStock() {
  const token = await fetchToken();
  const btn = document.getElementById('callApiBtn');
  if (btn) btn.style.display = 'none';
  showProgressBar();

  const quantity = document.getElementById('quantityInput').value;
  if (!quantity) {
    showResponse('Quantity is required.', 'danger');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const url = `/make-call?${urlParams.toString()}`;
  const payload = { quantity };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  hideProgressBar();
  const result = await res.json();
  if (res.ok) {
    showResponse(`Success 🎉 your reference is: <strong>${result.callRef}</strong>`, 'success');
  } else {
    throw new Error(result.message || 'Unknown error');
  }
}

// Shows a Bootstrap progress bar in the response output
function showProgressBar() {
  const responseBox = document.getElementById('responseOutput');
  responseBox.style.display = 'block';
  responseBox.innerHTML = `
<div class="progress">
  <div class="progress-bar progress-bar-striped progress-bar-animated"
    style="width:100%"></div>
</div>`;
}

// Hides the progress bar
function hideProgressBar() {
  const responseBox = document.getElementById('responseOutput');
  responseBox.innerHTML = '';
  responseBox.style.display = 'none;'
}

// Shows a response message with Bootstrap alert styling
function showResponse(message, type = 'info') {
  const responseBox = document.getElementById('responseOutput');
  responseBox.style.display = 'block';
  responseBox.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

// Hides the response message
function hideResponse() {
  const responseBox = document.getElementById('responseOutput');
  responseBox.innerHTML = '';
  responseBox.style.display = 'none';
}