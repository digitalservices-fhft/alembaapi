const path = require('path');
const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const qs = require('querystring');
const helmet = require('helmet');
require('dotenv').config();


const {
  PORT = 3000,
  CLIENT_ID,
  API_USERNAME,
  API_PASSWORD
} = process.env;

// Validate required environment variables
['CLIENT_ID', 'API_USERNAME', 'API_PASSWORD'].forEach((v) => {
  if (!process.env[v]) {
    console.error(`❌ Missing required environment variable: ${v}`);
    process.exit(1);
  }
});


const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5_000_000 }, // 5 MB
  fileFilter: (_, file, cb) => {
    const ok = /jpeg|jpg|png|gif/.test(file.mimetype);
    cb(null, ok);
  }
});

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'https://alembaapi-test.onrender.com',
  'https://qrcodeapp-wbey.onrender.com',
  'https://digitalservices.frimleyhealth.nhs.uk',
  'https://fhnhs.alembacloud.com'
];

// CORS middleware setup with recommended changes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],   // Added 'OPTIONS' for preflight requests
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // If cookies or credentials are used
}));

// Middleware to set Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://ajax.googleapis.com https://cdn.jsdelivr.net 'unsafe-inline'; " +
    "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; " +
    "font-src 'self' https://r2cdn.perplexity.ai; " +
    "img-src 'self' data:; " +
    "connect-src 'self' https://fhnhs.alembacloud.com;"
  );
  next();
});

app.use(helmet());

// CSP header
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://ajax.googleapis.com https://cdn.jsdelivr.net 'unsafe-inline'; " +
    "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; " +
    "font-src 'self' https://r2cdn.perplexity.ai; " +
    "img-src 'self' data:; " +
    "connect-src 'self';"
  );
  next();
});

app.use(express.static('public', { extensions: ['html'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getFreshToken = async () => {
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
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString());
          if (json.access_token) resolve(json.access_token);
          else reject(new Error('No access_token in response'));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

app.get('/get-token', async (_req, res) => {
  try {
    res.json({ access_token: await getFreshToken() });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/make-call', upload.single('attachment'), async (req, res) => {
  const codeType = req.query.codeType || req.body.codeType;
  const valid = ['call', 'inf', 'stock'];
  if (!valid.includes(codeType)) {
    return res.status(400).json({ message: 'Invalid codeType.' });
  }
  try {
    const token = await getFreshToken();
    if (codeType === 'call') return handleCall(req, res, token);
    if (codeType === 'inf') return handleInf(req, res, token);
    return handleStock(req, res, token);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

const api = (token) =>
  axios.create({
    baseURL: `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/`,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30_000
  });

async function handleCall(req, res, token) {
  const required = [
    'receivingGroup',
    'customString1',
    'configurationItemId',
    'description',
    'type',
    'impact',
    'urgency'
  ];
  const missing = required.filter((p) => !req.query[p]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });
  }
  const payload = {
    Description: req.query.description,
    DescriptionHtml: `<p>${req.query.description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: +req.query.impact,
    Urgency: +req.query.urgency,
    Type: +req.query.type,
    ReceivingGroup: +req.query.receivingGroup,
    CustomString1: req.query.customString1,
    ConfigurationItemId: +req.query.configurationItemId,
    User: 34419
  };
  const ref = (await api(token).post('call', payload)).data.Ref;
  await api(token).put(`call/${ref}/submit`);
  res.json({ message: 'Call created.', callRef: ref });
}

async function handleInf(req, res, token) {
  const required = [
    'receivingGroup',
    'customString1',
    'configurationItemId',
    'type',
    'impact',
    'urgency'
  ];
  const missing = required.filter((p) => !req.query[p]);
  if (missing.length || !req.body.description) {
    return res.status(400).json({ message: `Missing: ${missing.join(', ')} or description` });
  }
  const payload = {
    Description: req.body.description,
    DescriptionHtml: `<p>${req.body.description}</p>`,
    IpkStatus: 1,
    IpkStream: 0,
    Impact: +req.query.impact,
    Urgency: +req.query.urgency,
    Type: +req.query.type,
    ReceivingGroup: +req.query.receivingGroup,
    CustomString1: req.query.customString1,
    ConfigurationItemId: +req.query.configurationItemId,
    User: 34419
  };
  const ref = (await api(token).post('call', payload)).data.Ref;
  if (req.file) {
    const form = new FormData();
    form.append('attachment', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    await axios.post(
      `https://fhnhs.alembacloud.com/production/alemba.api/api/v2/call/${ref}/attachments`,
      form,
      {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity
      }
    );
    fs.unlink(req.file.path, () => {});
  }
  await api(token).put(`call/${ref}/submit`);
  res.json({ message: 'Info call created.', callRef: ref });
}

async function handleInf(req, res, token) {
  const { LinkedAsset, TransactionStatus } = req.query;
  const { Quantity } = req.body;

  const missing = [];
  if (!LinkedAsset) missing.push('LinkedAsset');
  if (!TransactionStatus) missing.push('TransactionStatus');
  if (!Quantity) missing.push('Quantity');

  if (missing.length) {
    return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });
  }

  const payload = {
    Person: 34419,
    LinkedAsset: +LinkedAsset,
    Quantity: +Quantity,
    TransactionStatus: +TransactionStatus
  };

  const ref = (await api(token).post('inventory-allocation', payload)).data.Ref;
  await api(token).put(`inventory-allocation/${ref}/submit`);
  res.json({ message: 'Inventory allocation created.', allocationRef: ref });
}

app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));