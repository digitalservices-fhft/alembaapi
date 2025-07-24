const express = require('express');
const https = require('https');
const qs = require('querystring');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const upload = multer({ dest: 'uploads/' });
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const API_USERNAME = process.env.API_USERNAME;
const API_PASSWORD = process.env.API_PASSWORD;
const API_BASE_URL = process.env.API_BASE_URL;

['CLIENT_ID', 'API_USERNAME', 'API_PASSWORD'].forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fetch a fresh token
async function getFreshToken() {
  const postData = qs.stringify({
    grant_type: 'password',
    scope: 'session-type:Analyst',
    client_id: CLIENT_ID,
    username: API_USERNAME,
    password: API_PASSWORD
  });

  const options = {
    method: 'POST',
    hostname: 'fhnhs.alembacloud.com',
    path: '/production/alemba.web/oauth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(data).toString());
          if (json.access_token) {
            resolve(json.access_token);
          } else {
            reject(new Error('No access_token in response'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

app.get('/get-token', async (req, res) => {
  try {
    const token = await getFreshToken();
    res.json({ access_token: token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/make-call', upload.single('attachment'), async (req, res) => {
  const codeType = req.query.codeType || req.body.codeType;
  const validTypes = ['call', 'inf', 'stock'];
  if (!validTypes.includes(codeType)) {
    return res.status(400).json({ message: 'Invalid codeType. Must be: call, inf, or stock' });
  }

  try {
    const token = await getFreshToken();
    if (codeType === 'call') return await handleCall(req, res, token);
    if (codeType === 'inf') return await handleInf(req, res, token);
    if (codeType === 'stock') return await handleStock(req, res, token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function handleCall(req, res, token) {
  const { receivingGroup, customString1, configurationItemId, description, type, impact, urgency } = req.query;
  const missing = [];
  if (!receivingGroup) missing.push('receivingGroup');
  if (!customString1) missing.push('customString1');
  if (!configurationItemId) missing.push('configurationItemId');
  if (!description) missing.push('description');
  if (!type) missing.push('type');
  if (!impact) missing.push('impact');
  if (!urgency) missing.push('urgency');
  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing required parameters: ${missing.join(', ')}` });
  }

  const payload = {
    Description: description,
    DescriptionHtml: `<p>${description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: parseInt(impact),
    Urgency: parseInt(urgency),
    Type: parseInt(type),
    ReceivingGroup: parseInt(receivingGroup),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId),
    User: 34419
  };

  const headers = { Authorization: `Bearer ${token}` };
  const createRes = await axios.post(`${API_BASE_URL}/alemba.api/api/v2/call?Login_Token=${token}`, payload, { headers });
  const ref = createRes.data.Ref;
  await axios.put(`${API_BASE_URL}/alemba.api/api/v2/call/${ref}/submit?Login_Token=${token}`, null, { headers });

  res.json({ message: 'Call created and submitted successfully', callRef: ref });
}

async function handleInf(req, res, token) {
  const { receivingGroup, customString1, configurationItemId, type, impact, urgency } = req.query;
  const description = req.body.description;

  const missing = [];
  if (!receivingGroup) missing.push('receivingGroup');
  if (!customString1) missing.push('customString1');
  if (!configurationItemId) missing.push('configurationItemId');
  if (!type) missing.push('type');
  if (!impact) missing.push('impact');
  if (!urgency) missing.push('urgency');
  if (!description) missing.push('description');

  if (missing.length > 0) {
    return res.status(400).json({ 
      message: `Missing required parameters: ${missing.join(', ')}` 
    });
  }

  const payload = {
    Description: description,
    DescriptionHtml: `<p>${description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: parseInt(impact),
    Urgency: parseInt(urgency),
    Type: parseInt(type),
    ReceivingGroup: parseInt(receivingGroup),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId),
    User: 34419
  };

  const headers = { Authorization: `Bearer ${token}` };

  // Create the call
  const createRes = await axios.post(
    `${API_BASE_URL}/alemba.api/api/v2/call`, 
    payload, 
    { headers }
  );
  const ref = createRes.data.Ref;

  // Upload attachment if present
  if (req.file) {
    const form = new FormData();
    form.append('attachment', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    try {
      console.log(`Uploading attachment for call ${ref}:`, req.file.originalname);
      const attachmentResponse = await axios.post(
        `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/attachments`, 
        form, 
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );
      console.log('Attachment uploaded successfully:', attachmentResponse.data);
    } catch (attachmentError) {
      console.error('Attachment upload failed:', {
        status: attachmentError.response?.status,
        statusText: attachmentError.response?.statusText,
        data: attachmentError.response?.data,
        message: attachmentError.message
      });
    } finally {
      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) console.error('Failed to cleanup temp file:', unlinkError);
      });
    }
  }

  // Submit the call
  await axios.put(
    `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/submit`, 
    null, 
    { headers }
  );

  res.json({ 
    message: 'Call created and submitted successfully', 
    callRef: ref 
  });
}

async function handleStock(req, res, token) {
  const { purchase, transactionStatus } = req.query;
  const quantity = req.body.quantity;
  const missing = [];
  if (!purchase) missing.push('purchase');
  if (!transactionStatus) missing.push('transactionStatus');
  if (!quantity) missing.push('quantity');
  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing required parameters: ${missing.join(', ')}` });
  }

  const payload = {
    Purchase: parseInt(purchase),
    TransactionStatus: parseInt(transactionStatus),
    Quantity: parseInt(quantity)
  };

  const headers = { Authorization: `Bearer ${token}` };
  const createRes = await axios.post(`${API_BASE_URL}/alemba.api/api/v2/inventory-allocation?Login_Token=${token}`, payload, { headers });
  const ref = createRes.data.Ref;
  await axios.put(`${API_BASE_URL}/alemba.api/api/v2/inventory-allocation/${ref}/submit?Login_Token=${token}`, null, { headers });

  res.json({ message: 'Stock updated successfully', callRef: ref });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});