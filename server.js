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

// Environment variables for Render deployment
const CLIENT_ID = process.env.CLIENT_ID;
const API_USERNAME = process.env.API_USERNAME;
const API_PASSWORD = process.env.API_PASSWORD;
const API_BASE_URL = process.env.API_BASE_URL || 'https://fhnhs.alembacloud.com/production';

// Validate required environment variables
const requiredEnvVars = ['CLIENT_ID', 'API_USERNAME', 'API_PASSWORD'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`âŒ Missing required environment variable: ${envVar}`);
    console.error('Please set this in your Render dashboard under Environment settings.');
    process.exit(1);
  }
});

console.log('âœ… All required environment variables found');
console.log(`ðŸš€ API Base URL: ${API_BASE_URL}`);

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route '/easteregg' to send game.html
app.get('/easteregg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Token cache
let access_token = '';
let token_expiry = 0;

// Auth token endpoint required for all applications
app.get('/get-token', (req, res) => {
  const now = Date.now();
  
  // Return cached token if still valid
  if (access_token && now < token_expiry) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ access_token });
  }

  // Request new token
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

  const request = https.request(options, (response) => {
    let chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      try {
        const json = JSON.parse(body);
        if (json.access_token) {
          access_token = json.access_token;
          token_expiry = Date.now() + (4.5 * 60 * 1000); // 4.5 minutes
          res.set('Cache-Control', 'private, max-age=300');
          res.json({ access_token });
        } else {
          console.error('âŒ No access_token in response:', json);
          res.status(500).json({ message: 'No access_token in response' });
        }
      } catch (e) {
        console.error('âŒ Failed to parse token response:', e);
        res.status(500).json({ message: 'Failed to parse token response' });
      }
    });
  });

  request.on('error', (e) => {
    console.error('âŒ Error requesting token:', e);
    res.status(500).json({ message: 'Error requesting token: ' + e.message });
  });

  request.write(postData);
  request.end();
});

// Main API endpoint for calls
app.post('/make-call', upload.single('attachment'), async (req, res) => {
  const now = Date.now();
  
  // Check token validity
  if (!access_token || now >= token_expiry) {
    return res.status(401).json({ 
      message: 'Access token expired or missing. Please refresh the page.' 
    });
  }

  const codeType = req.query.codeType || req.body.codeType;
  const validTypes = ['call', 'stock', 'inf'];
  
  if (!validTypes.includes(codeType)) {
    return res.status(400).json({ message: 'Invalid codeType' });
  }

  try {
    // Handle different codeTypes
    if (codeType === 'call') {
      await handleCallType(req, res);
    } else if (codeType === 'inf') {
      await handleInfType(req, res);
    } else if (codeType === 'stock') {
      await handleStockType(req, res);
    }
  } catch (error) {
    console.error('âŒ Error in make-call:', error);
    res.status(500).json({ 
      message: error.response?.data?.Message || error.message || 'Unknown error occurred'
    });
  }
});

// Handle codeType=call
async function handleCallType(req, res) {
  const { receivingGroup, customString1, configurationItemId, description, type, impact, urgency } = req.query;

  // Validate required parameters
  if (!receivingGroup || !customString1 || !configurationItemId || !description || !type || !impact || !urgency) {
    return res.status(400).json({ message: 'Missing required parameters for call type' });
  }

  const callPayload = {
    Description: description,
    DescriptionHtml: `<p>${description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: parseInt(impact, 10),
    Urgency: parseInt(urgency, 10),
    Type: parseInt(type, 10),
    ReceivingGroup: parseInt(receivingGroup, 10),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId, 10),
    User: 34419
  };

  const ref = await createAndSubmitCall(callPayload);
  res.json({ message: 'Call created and submitted successfully', callRef: ref });
}

// Handle codeType=inf
async function handleInfType(req, res) {
  const { receivingGroup, customString1, configurationItemId, type, impact, urgency } = req.query;
  const description = req.body.description;

  // Validate required parameters
  if (!receivingGroup || !customString1 || !configurationItemId || !type || !impact || !urgency || !description) {
    return res.status(400).json({ message: 'Missing required parameters for inf type' });
  }

  const callPayload = {
    Description: description,
    DescriptionHtml: `<p>${description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: parseInt(impact, 10),
    Urgency: parseInt(urgency, 10),
    Type: parseInt(type, 10),
    ReceivingGroup: parseInt(receivingGroup, 10),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId, 10),
    User: 34419
  };

  // Create the call first
  const createRes = await axios.post(
    `${API_BASE_URL}/alemba.api/api/v2/call?Login_Token=${access_token}`,
    callPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    }
  );

  const ref = createRes.data.Ref;
  if (!ref) {
    throw new Error('Call created but no Ref returned');
  }

  // Handle attachment if present
  if (req.file) {
    const attachmentPath = req.file.path;
    const form = new FormData();
    form.append('file', fs.createReadStream(attachmentPath));

    await axios.post(
      `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/attachments?Login_Token=${access_token}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    // Clean up uploaded file
    fs.unlink(attachmentPath, (err) => {
      if (err) console.warn('âš ï¸  Could not delete temp file:', attachmentPath);
    });
  }

  // Submit the call
  await axios.put(
    `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/submit?Login_Token=${access_token}`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }
  );

  res.json({ message: 'Call created and submitted successfully', callRef: ref });
}

// Handle codeType=stock
async function handleStockType(req, res) {
  const { purchase, transactionStatus } = req.query;
  const quantity = req.body.quantity;

  // Validate required parameters
  if (!purchase || !transactionStatus || !quantity) {
    return res.status(400).json({ message: 'Missing required parameters for stock type' });
  }

  const payload = {
    Purchase: parseInt(purchase, 10),
    TransactionStatus: parseInt(transactionStatus, 10),
    Quantity: parseInt(quantity, 10)
  };

  // Create inventory allocation
  const createRes = await axios.post(
    `${API_BASE_URL}/alemba.api/api/v2/inventory-allocation?Login_Token=${access_token}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    }
  );

  const ref = createRes.data.Ref;
  if (!ref) {
    throw new Error('Inventory allocation created but no Ref returned');
  }

  // Submit the inventory allocation
  await axios.put(
    `${API_BASE_URL}/alemba.api/api/v2/inventory-allocation/${ref}/submit?Login_Token=${access_token}`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }
  );

  res.json({ message: 'Stock updated successfully', callRef: ref });
}

// Helper function to create and submit a call
async function createAndSubmitCall(payload) {
  // Create call
  const createRes = await axios.post(
    `${API_BASE_URL}/alemba.api/api/v2/call?Login_Token=${access_token}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    }
  );

  const ref = createRes.data.Ref;
  if (!ref) {
    throw new Error('Call created but no Ref returned');
  }

  // Submit call
  await axios.put(
    `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/submit?Login_Token=${access_token}`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }
  );

  return ref;
}

// Start server
app.listen(PORT, () => {
  console.log(`ðŸš€ Server running on port ${PORT}`);
  console.log(`ðŸ“± Mobile-first UI ready for deployment`);
});