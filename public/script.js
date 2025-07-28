// Helper functions
const el = id => document.getElementById(id);
const qs = (key, defaultValue = null) => {
  const params = new URLSearchParams(window.location.search);
  return params.has(key) ? params.get(key) : defaultValue;
};
const api = async (path, opts = {}) => {
  const response = await fetch(path, opts);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
};

// Image map
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

// UI initialization
async function initializeApp() {
  try {
    applyQueryToUI();
    const btn = el("callApiBtn");
    btn.classList.remove("hidden");
    btn.onclick = handleButtonClick;
  } catch (err) {
    showResponse(`⛔️ ${err.message}`, "danger");
  }
}

// Apply query parameters to UI
function applyQueryToUI() {
  const codeType = (qs("codeType") || "").toLowerCase();
  const title = qs("title") || "Missing title parameter";
  const heading = document.querySelector("h1.mb-4.text-center");
  if (heading) heading.textContent = title;

  if (codeType === "stock") {
    const keyword = Object.keys(imageMap).find(k => title.toLowerCase().includes(k));
    if (keyword) {
      const img = new Image();
      img.src = `img/${imageMap[keyword]}`;
      img.alt = keyword;
      img.className = "img-fluid d-block mx-auto";
      const container = el("image-container");
      if (container) {
        container.innerHTML = "";
        container.appendChild(img);
      }
    }
  }

  el("infFields")?.classList.toggle("hidden", codeType !== "inf");
  el("stockFields")?.classList.toggle("hidden", codeType !== "stock");
  el("callFields")?.classList.toggle("hidden", codeType !== "call");
}

// Button click handler
async function handleButtonClick() {
  try {
    hideResponse();
    showProgressBar();
    const codeType = qs("codeType", "call");
    if (codeType === "inf") await submitInf();
    else if (codeType === "stock") await submitStock();
    else await submitCall();
  } catch (e) {
    hideProgressBar();
    showResponse(`⛔️ ${e.message}`, "danger");
  }
}

// Token fetch
const fetchToken = () => api("/get-token", { method: "GET" }).then(d => d.access_token);

// Submit call
async function submitCall() {
  const token = await fetchToken();

  const receivingGroup = qs("receivingGroup");
  const customString1 = qs("customString1");
  const configurationItemId = qs("configurationItemId");
  const description = qs("description") ?? "";
  const type = qs("type");
  const impact = qs("impact");
  const urgency = qs("urgency");

  if (!receivingGroup || !customString1 || !configurationItemId || !description || !type || !impact || !urgency) {
    throw new Error("Missing one or more required parameters for call submission.");
  }

  const params = new URLSearchParams({
    receivingGroup,
    customString1,
    configurationItemId,
    description,
    type,
    impact,
    urgency,
    codeType: "call"
  });

  const url = `/make-call?${params.toString()}`;

  const out = await api(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  hideProgressBar();
  showResponse(`🎉 Success! Your ref is: <strong>${out.callRef}</strong>`, "success");
}

// Submit inf
async function submitInf() {
  const token = await fetchToken();

  const description = el("descriptionInput")?.value;
  if (!description) throw new Error("Description is required");

  const attachmentInput = el("attachmentInput");
  const attachment = attachmentInput?.files?.[0];

  const requiredParams = [
    "receivingGroup",
    "customString1",
    "configurationItemId",
    "type",
    "impact",
    "urgency"
  ];

  const queryParams = new URLSearchParams();
  for (const param of requiredParams) {
    const value = qs(param);
    if (!value) throw new Error(`Missing required parameter: ${param}`);
    queryParams.append(param, value);
  }

  queryParams.append("codeType", "inf");

  const formData = new FormData();
  formData.append("description", description);
  if (attachment) {
    formData.append("attachment", attachment);
  }

  const url = `/make-call?${queryParams.toString()}`;
  const out = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }).then(r => {
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    return r.json();
  });

  hideProgressBar();
  showResponse(`🎉 Success! Your ref is: <strong>${out.callRef}</strong>`, "success");
}

// Submit stock
async function submitStock() {
  const token = await fetchToken();
  const quantity = el("quantityInput")?.value;
  if (!quantity) throw new Error("Quantity required");

  const params = new URLSearchParams(window.location.search);
  const url = `/make-call?${params.toString()}&codeType=stock`;

  const out = await api(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ Quantity: +quantity })
  });

  hideProgressBar();
  showResponse(`🎉 Success! Your ref is: <strong>${out.allocationRef}</strong>`, "success");
}

// UI feedback
function showResponse(msg, kind = "info") {
  const box = el("responseOutput");
  box.style.display = "block";
  box.className = `alert alert-${kind}`;
  box.innerHTML = msg;
}
function hideResponse() {
  const box = el("responseOutput");
  box.style.display = "none";
  box.textContent = "";
}
function showProgressBar() {
  const box = el("responseOutput");
  box.style.display = "block";
  box.innerHTML = `<div class="progress"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div></div>`;
}
function hideProgressBar() {
  el("responseOutput").style.display = "none";
}

// Start app
document.addEventListener("DOMContentLoaded", initializeApp);