const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const qs = require('querystring');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

// Environment variables
const CLIENT_ID = process.env.CLIENT_ID || 'your_client_id';
const API_USERNAME = process.env.API_USERNAME || 'your_api_username';
const API_PASSWORD = process.env.API_PASSWORD || 'your_api_password';

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token cache
let accessToken = '';
let tokenExpiry = 0;

// Utility: Get or refresh Alemba token
async function getToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) return accessToken;

  const postData = qs.stringify({
    grant_type: 'password',
    scope: 'session-type:Analyst',
    client_id: CLIENT_ID,
    username: API_USERNAME,
    password: API_PASSWORD,
  });

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(data).toString());
          if (json.access_token) {
            accessToken = json.access_token;
            tokenExpiry = Date.now() + 4.5 * 60 * 1000;
            resolve(accessToken);
          } else {
            reject(new Error('No access_token in response'));
          }
        } catch (err) {
          reject(new Error('Failed to parse token response'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

// Route: Get token (for front-end use)
app.get('/get-token', async (req, res) => {
  try {
    const token = await getToken();
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ access_token: token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Route: Submit call or stock update
app.post('/make-call', upload.single('attachment'), async (req, res) => {
  try {
    const token = await getToken();
    const codeType = req.query.codeType || req.body.codeType;

    if (codeType === 'inf') {
      await handleInfCall(req, res, token);
    } else if (codeType === 'stock') {
      await handleStockUpdate(req, res, token);
    } else {
      await handleDefaultCall(req, res, token);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Handler: Information call with optional attachment
async function handleInfCall(req, res, token) {
  const {
    receivingGroup,
    customString1,
    configurationItemId,
    type,
    impact,
    urgency,
  } = req.query;
  const { description } = req.body;

  if (!description || !impact || !urgency || !customString1) {
    return res.status(400).send('Missing required parameters for inf call');
  }

  const payload = {
    Description: description,
    DescriptionHtml: `<div>${description}</div>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: parseInt(impact),
    Urgency: parseInt(urgency),
    CustomString1: customString1,
    User: 34419,
  };

  if (receivingGroup) payload.ReceivingGroup = parseInt(receivingGroup);
  if (type) payload.Type = parseInt(type);
  if (configurationItemId) payload.ConfigurationItemId = parseInt(configurationItemId);

  const createRes = await axios.post(
    `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call?Login_Token=${token}`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const callRef = createRes.data.Ref;
  if (!callRef) return res.status(500).send('Call created but no Ref returned.');

  await axios.put(
    `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call/${callRef}/submit?Login_Token=${token}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (req.file) {
    await uploadAttachment(callRef, req.file, token);
  }

  res.send({ message: 'Call created and submitted successfully', callRef });
}

// Handler: Stock update
async function handleStockUpdate(req, res, token) {
  const { purchase, transactionStatus, quantity } = req.body;

  const payload = {
    Person: 34419,
    Purchase: parseInt(purchase),
    Quantity: parseInt(quantity),
    TransactionStatus: parseInt(transactionStatus),
  };

  const createRes = await axios.post(
    `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/inventory-allocation?Login_Token=${token}`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const ref = createRes.data.Ref;
  if (!ref) return res.status(500).send('No Ref returned from inventory allocation');

  const submitRes = await axios.put(
    `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/inventory-allocation/${ref}/submit?Login_Token=${token}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  res.send({
    message: 'Inventory allocation created and submitted successfully',
    callRef: ref,
    submitResponse: submitRes.data,
  });
}

// Handler: Default call
async function handleDefaultCall(req, res, token) {
  const {
    receivingGroup,
    customString1,
    configurationItemId,
    type,
    impact,
    urgency,
    description,
  } = req.query;

  if (!receivingGroup || !customString1 || !configurationItemId || !type || !impact || !urgency || !description) {
    return res.status(400).send('Missing required parameters for call creation');
  }

  const payload = {
    Description: description,
    DescriptionHtml: `<p>${description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: parseInt(impact),
    Urgency: parseInt(urgency),
    ReceivingGroup: parseInt(receivingGroup),
    Type: parseInt(type),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId),
    User: 34419,
  };

  const createRes = await axios.post(
    `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call?Login_Token=${token}`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const ref = createRes.data.Ref;
  if (!ref) return res.status(500).send('Call created but no Ref returned.');

  const submitRes = await axios.put(
    `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call/${ref}/submit?Login_Token=${token}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  res.send({
    message: 'Call created and submitted successfully',
    callRef: ref,
    submitResponse: submitRes.data,
  });
}

// Upload attachment to Alemba
async function uploadAttachment(callRef, file, token) {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const fileContent = fs.readFileSync(file.path);
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.originalname}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  await new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: 'fhnhs.alembacloud.com',
      path: `/production/alemba.api/api/v2/call/${callRef}/attachment?Login_Token=${token}`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`,
        'Content-Length': payload.length,
      },
    }, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  fs.unlink(file.path, (err) => {
    if (err) console.error('Failed to delete uploaded file:', err);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});