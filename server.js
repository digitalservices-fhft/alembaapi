const express = require('express');
const https = require('https');
const qs = require('querystring');
const path = require('path');
const fs = require('fs');
const app = express();
const FormData = require('form-data');
const axios = require('axios');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const PORT = process.env.PORT || 3000;

// Environment variables - Render will inject these automatically
const CLIENT_ID = process.env.CLIENT_ID;
const API_USERNAME = process.env.API_USERNAME;
const API_PASSWORD = process.env.API_PASSWORD;
const API_BASE_URL = process.env.API_BASE_URL;

// Validate required environment variables
if (!CLIENT_ID || !API_USERNAME || !API_PASSWORD) {
  console.error('Missing required environment variables:');
  if (!CLIENT_ID) console.error('- CLIENT_ID is required');
  if (!API_USERNAME) console.error('- API_USERNAME is required');
  if (!API_PASSWORD) console.error('- API_PASSWORD is required');
  console.error('Please set these environment variables in your Render dashboard.');
  process.exit(1);
}

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route '/easteregg' to send game.html
app.get('/easteregg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Function to get a fresh access token for every API call
async function getFreshToken() {
  return new Promise((resolve, reject) => {
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
      },
      maxRedirects: 20
    };

    const request = https.request(options, (response) => {
      let chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          const json = JSON.parse(body);
          if (json.access_token) {
            resolve(json.access_token);
          } else {
            reject(new Error('No access_token in response'));
          }
        } catch (e) {
          reject(new Error('Failed to parse token response'));
        }
      });
    });

    request.on('error', (e) => {
      reject(new Error('Error requesting token: ' + e.message));
    });

    request.write(postData);
    request.end();
  });
}

// Token cache for initial page load
let access_token = '';
let token_expiry = 0;

// Auth token endpoint for initial page load
app.get('/get-token', (req, res) => {
  const now = Date.now();
  if (access_token && now < token_expiry) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ access_token });
  }

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
    },
    maxRedirects: 20
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
          token_expiry = Date.now() + (4.5 * 60 * 1000);
          res.set('Cache-Control', 'private, max-age=300');
          res.json({ access_token });
        } else {
          res.status(500).send('No access_token in response');
        }
      } catch (e) {
        res.status(500).send('Failed to parse token response');
      }
    });
  });

  request.on('error', (e) => {
    res.status(500).send('Error requesting token: ' + e.message);
  });

  request.write(postData);
  request.end();
});

// Main API endpoint for calls
app.post('/make-call', upload.single('file'), async (req, res) => {
  try {
    // Get fresh token for every API call as required
    const freshToken = await getFreshToken();

    const codeType = req.query.codeType || req.body.codeType;
    const validTypes = ['call', 'stock', 'inf'];

    if (!validTypes.includes(codeType)) {
      return res.status(400).json({ message: 'Invalid codeType' });
    }

    switch (codeType) {
      case 'call':
        await handleCallType(req, res, freshToken);
        break;
      case 'inf':
        await handleInfType(req, res, freshToken);
        break;
      case 'stock':
        await handleStockType(req, res, freshToken);
        break;
      default:
        return res.status(400).json({ message: 'Invalid codeType' });
    }
  } catch (error) {
    console.error('Error in /make-call:', error);
    res.status(500).json({ 
      message: 'Failed to get fresh token: ' + error.message 
    });
  }
});

// Handle call type
async function handleCallType(req, res, token) {
  const { receivingGroup, customString1, configurationItemId, description, type, impact, urgency } = req.query;

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
    ReceivingGroup: parseInt(receivingGroup, 10),
    Type: parseInt(type, 10),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId, 10),
    User: 34419
  };

  try {
    // Create call
    const createRes = await axios.post(
      `${API_BASE_URL}/alemba.api/api/v2/call?Login_Token=${token}`,
      callPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const ref = createRes.data.Ref;
    if (!ref) {
      return res.status(500).json({
        message: 'Call created but no Ref returned',
        response: createRes.data
      });
    }

    // Submit call
    const submitRes = await axios.put(
      `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/submit?Login_Token=${token}`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json({
      message: 'Call created and submitted successfully',
      callRef: ref,
      submitResponse: submitRes.data
    });

  } catch (error) {
    console.error('Error in handleCallType:', error);
    res.status(500).json({
      message: 'Error creating or submitting call: ' + (error.response?.data ? JSON.stringify(error.response.data) : error.message)
    });
  }
}

// Handle inf type with optional file attachment
async function handleInfType(req, res, token) {
  const { receivingGroup, customString1, configurationItemId, type, impact, urgency } = req.query;
  const description = req.body.description;

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
    ReceivingGroup: parseInt(receivingGroup, 10),
    Type: parseInt(type, 10),
    CustomString1: customString1,
    ConfigurationItemId: parseInt(configurationItemId, 10),
    User: 34419
  };

  try {
    // Create call
    const createRes = await axios.post(
      `${API_BASE_URL}/alemba.api/api/v2/call?Login_Token=${token}`,
      callPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const ref = createRes.data.Ref;
    if (!ref) {
      return res.status(500).json({
        message: 'Call created but no Ref returned',
        response: createRes.data
      });
    }

    // Handle file attachment if present
    if (req.file) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), {
          filename: req.file.originalname || 'attachment',
          contentType: req.file.mimetype || 'application/octet-stream'
        });

        await axios.post(
          `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/attachment?Login_Token=${token}`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (attachError) {
        console.error('Error uploading attachment:', attachError);
        // Continue with call submission even if attachment fails
      }
    }

    // Submit call
    const submitRes = await axios.put(
      `${API_BASE_URL}/alemba.api/api/v2/call/${ref}/submit?Login_Token=${token}`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json({
      message: 'Call created and submitted successfully',
      callRef: ref,
      submitResponse: submitRes.data
    });

  } catch (error) {
    console.error('Error in handleInfType:', error);
    res.status(500).json({
      message: 'Error creating or submitting call: ' + (error.response?.data ? JSON.stringify(error.response.data) : error.message)
    });
  }
}

// Handle stock type
async function handleStockType(req, res, token) {
  const { purchase, transactionStatus } = req.query;
  const quantity = req.body.quantity;

  if (!purchase || !transactionStatus) {
    return res.status(400).json({ message: 'Missing required parameters for stock type' });
  }

  const stockPayload = {
    Purchase: parseInt(purchase, 10),
    TransactionStatus: parseInt(transactionStatus, 10),
    Quantity: quantity ? parseInt(quantity, 10) : 1
  };

  try {
    // Create inventory allocation
    const createRes = await axios.post(
      `${API_BASE_URL}/alemba.api/api/v2/inventory-allocation?Login_Token=${token}`,
      stockPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const ref = createRes.data.Ref;
    if (!ref) {
      return res.status(500).json({
        message: 'Inventory allocation created but no Ref returned',
        response: createRes.data
      });
    }

    // Submit inventory allocation
    const submitRes = await axios.put(
      `${API_BASE_URL}/alemba.api/api/v2/inventory-allocation/${ref}/submit?Login_Token=${token}`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json({
      message: 'Stock updated successfully',
      callRef: ref,
      submitResponse: submitRes.data
    });

  } catch (error) {
    console.error('Error in handleStockType:', error);
    res.status(500).json({
      message: 'Error creating or submitting inventory allocation: ' + (error.response?.data ? JSON.stringify(error.response.data) : error.message)
    });
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
});