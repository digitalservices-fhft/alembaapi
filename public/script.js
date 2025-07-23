// Wait for the DOM to be fully loaded before running the app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Will hold the token retrieved from the server
let accessToken = '';

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

// Initializes the app: fetches token, sets up UI, and binds button click
async function initializeApp() {
  try {
    accessToken = await fetchToken(); // Get access token from server
    setupUI(); // Adjust UI based on query parameters
    const btn = document.getElementById('callApiBtn');
    btn.style.display = 'block'; // Show the button once token is ready
    btn.addEventListener('click', handleButtonClick); // Bind click handler
  } catch (err) {
    showResponse(`Failed to retrieve token: ${err.message}`, 'danger');
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
    setTimeout(() => {
      window.location.href = 'https://fhnhs.alembacloud.com/production/portal.aspx';
    }, 3000);
    return;
  }

  const btn = document.getElementById('callApiBtn');
  const imageContainer = document.getElementById('image-container');
  const boardTitle = getParam('title');
  const heading = document.querySelector('h1.mb-4');

  // Set title
  if (!boardTitle && heading) {
    heading.textContent = 'If you are seeing this you have not passed the correct title parameter!';
  }

  if (boardTitle && heading) {
    heading.textContent = boardTitle;
  }

  // Display image based on title keyword match
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

  // Show/hide form sections based on codeType
  const infFields = document.getElementById('infFields');
  const stockFields = document.getElementById('stockFields');
  
  switch (codeType) {
    case 'call':
      btn.textContent = 'Let us know!';
      if (infFields) infFields.style.display = 'none';
      if (stockFields) stockFields.style.display = 'none';
      break;
    case 'stock':
      btn.textContent = 'Update stock';
      if (stockFields) stockFields.style.display = 'block';
      if (infFields) infFields.style.display = 'none';
      break;
    case 'inf':
      btn.textContent = 'Submit';
      if (infFields) infFields.style.display = 'block';
      if (stockFields) stockFields.style.display = 'none';
      break;
    default:
      btn.textContent = 'Submit';
      if (infFields) infFields.style.display = 'none';
      if (stockFields) stockFields.style.display = 'none';
  }
}

// Handles the main button click and routes to the appropriate submission function
async function handleButtonClick() {
  hideResponse();
  
  // FIX: Get codeType in the correct scope
  const codeType = getParam('codeType', 'call');
  
  // Hide button and show progress bar as required
  const btn = document.getElementById('callApiBtn');
  btn.style.display = 'none';
  showProgressBar();
  
  try {
    if (codeType === 'inf') {
      await submitInfo(); // Submit information with optional file
    } else if (codeType === 'stock') {
      await submitStock(); // Submit stock update
    } else {
      await submitCall(); // Submit a general call
    }
  } catch (err) {
    showResponse(`Submission error: ${err.message}`, 'danger');
    // Show button again on error
    btn.style.display = 'block';
  } finally {
    hideProgressBar();
  }
}

// Submits an information call with optional image attachment
async function submitInfo() {
  const description = document.getElementById('descriptionInput').value;
  const imageFile = document.getElementById('imageInput').files[0];
  
  if (!description.trim()) {
    showResponse('Description is required.', 'danger');
    return;
  }

  const formData = new FormData();
  formData.append('description', description);
  if (imageFile) {
    formData.append('file', imageFile); // Correct field name for attachment
  }

  const urlParams = new URLSearchParams(window.location.search);
  const url = `/make-call?${urlParams.toString()}`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const result = await res.json();
  
  if (res.ok) {
    showResponse(`Call submitted successfully!\\nReference: **${result.callRef}**`, 'success');
  } else {
    throw new Error(result.message || 'Unknown error');
  }
}

// Submits a stock update request
async function submitStock() {
  const quantity = document.getElementById('quantityInput').value;
  
  if (!quantity || quantity <= 0) {
    showResponse('Please enter a valid quantity.', 'danger');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const url = `/make-call?${urlParams.toString()}`;
  const payload = { quantity: parseInt(quantity, 10) };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  
  if (res.ok) {
    showResponse(`Stock updated successfully!\\nReference: **${result.callRef}**`, 'success');
  } else {
    throw new Error(result.message || 'Unknown error');
  }
}

// Submits a general call using query parameters
async function submitCall() {
  const urlParams = new URLSearchParams(window.location.search);
  const url = `/make-call?${urlParams.toString()}`;

  const res = await fetch(url, {
    method: 'POST',
  });

  const result = await res.json();
  
  if (res.ok) {
    showResponse(`Call submitted successfully!\\nReference: **${result.callRef}**`, 'success');
  } else {
    throw new Error(result.message || 'Unknown error');
  }
}

// Shows a Bootstrap progress bar in the response output
function showProgressBar() {
  const responseBox = document.getElementById('responseOutput');
  responseBox.innerHTML = `
    <div class="progress mb-3" style="height: 20px;">
      <div class="progress-bar progress-bar-striped progress-bar-animated" 
           role="progressbar" 
           style="width: 100%; background-color: var(--primary-color);">
        Processing...
      </div>
    </div>
  `;
  responseBox.style.display = 'block';
}

// Hides the progress bar
function hideProgressBar() {
  const responseBox = document.getElementById('responseOutput');
  const progressBar = responseBox.querySelector('.progress');
  if (progressBar) {
    progressBar.remove();
  }
}

// Shows a response message with appropriate styling
function showResponse(message, type = 'info') {
  const responseBox = document.getElementById('responseOutput');
  const alertClass = type === 'success' ? 'alert-success' : type === 'danger' ? 'alert-danger' : 'alert-info';
  
  // Convert markdown-style bold text to HTML
  const formattedMessage = message.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
  
  responseBox.innerHTML = `
    <div class="alert ${alertClass}" role="alert">
      ${formattedMessage.replace(/\\n/g, '<br>')}
    </div>
  `;
  responseBox.style.display = 'block';
}

// Hides the response output
function hideResponse() {
  const responseBox = document.getElementById('responseOutput');
  responseBox.style.display = 'none';
  responseBox.innerHTML = '';
}