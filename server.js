const express  = require('express');
const https    = require('https');
const path     = require('path');
const fs       = require('fs');
const qs       = require('querystring');
const axios    = require('axios');
const multer   = require('multer');
const FormData = require('form-data');
const upload = multer({ dest: 'uploads/' });
const app    = express();
const PORT   = process.env.PORT || 3000;
//Environment
const CLIENT_ID     = process.env.CLIENT_ID     || '';
const API_USERNAME  = process.env.API_USERNAME  || '';
const API_PASSWORD  = process.env.API_PASSWORD  || '';
const API_BASE_URL  = process.env.API_BASE_URL  || 'https://fhnhs.alembacloud.com/production';

['CLIENT_ID','API_USERNAME','API_PASSWORD'].forEach(key => {
  if (!process.env[key]) {
    console.error(`Missing env var ${key}`);
    process.exit(1);
  }
});
// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

// Easter-egg demo page
app.get('/easteregg', (_req,res) =>
  res.sendFile(path.join(__dirname, 'public', 'game.html')));

// Token cache
let access_token = '';
let token_expiry = 0;

app.get('/get-token', (_req,res) => {
  const now = Date.now();
  if (access_token && now < token_expiry) {
    res.set('Cache-Control','private,max-age=300');
    return res.json({ access_token });
  }

  const postData = qs.stringify({
    grant_type:'password',
    scope:'session-type:Analyst',
    client_id:CLIENT_ID,
    username:API_USERNAME,
    password:API_PASSWORD
  });

  const opts = {
    method :'POST',
    hostname:'fhnhs.alembacloud.com',
    path   :'/production/alemba.web/oauth/login',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'Content-Length':Buffer.byteLength(postData)
    }
  };

  const req = https.request(opts, r => {
    let data=''; r.on('data',d=>data+=d);
    r.on('end', () => {
      try{
        const json = JSON.parse(data);
        if (!json.access_token) throw new Error('No access_token in response');
        access_token = json.access_token;
        token_expiry = Date.now() + 4.5*60*1000;    // 4.5 min
        res.set('Cache-Control','private,max-age=300');
        res.json({ access_token });
      }catch(e){ res.status(500).send(e.message); }
    });
  });
  req.on('error', e => res.status(500).send(e.message));
  req.write(postData); req.end();
});
// Main call handler
app.post('/make-call', upload.single('attachment'), async (req,res) => {
  try{
    // validate token
    if (!access_token || Date.now() >= token_expiry)
      return res.status(401).json({ message:'Token expired; refresh page.' });

    const codeType = req.query.codeType ?? req.body.codeType;
    if (!['call','inf','stock'].includes(codeType))
      return res.status(400).json({ message:'Invalid codeType' });

    // Branch
    if (codeType === 'inf')      return handleInfo(req,res);
    if (codeType === 'stock')    return handleStock(req,res);
    /* default call */
    return handleCall(req,res);
  }catch(e){
    console.error(e);
    res.status(500).json({ message:e.message });
  }
});
// Helpers
function api(path){ return `${API_BASE_URL}/alemba.api${path}?Login_Token=${access_token}`; }

async function createAndSubmitCall(payload){
  // 1 create
  const { data } = await axios.post(api('/api/v2/call'), payload,
    { headers:{Authorization:`Bearer ${access_token}`} });
  const ref = data.Ref;
  if (!ref) throw new Error('No Ref returned from create call');
  // 2 submit
  await axios.put(api(`/api/v2/call/${ref}/submit`), null,
    { headers:{Authorization:`Bearer ${access_token}`} });
  return ref;
}

// codeType=call
async function handleCall(req,res){
  const { receivingGroup, customString1, configurationItemId,
          description, type, impact, urgency } = req.query;

  if (!receivingGroup || !customString1 || !configurationItemId ||
      !description || !type || !impact || !urgency)
    return res.status(400).json({ message:'Missing parameters for call' });

  const payload = {
    Description:description,
    DescriptionHtml:`<p>${description}</p>`,
    IpkStatus:1,IpkStream:0,
    Impact:+impact, Urgency:+urgency, Type:+type,
    ReceivingGroup:+receivingGroup,
    CustomString1:customString1,
    ConfigurationItemId:+configurationItemId,
    User:34419
  };

  const ref = await createAndSubmitCall(payload);
  res.json({ callRef:ref });
}

// codeType=inf
async function handleInfo(req,res){
  const { receivingGroup, customString1, configurationItemId,
          type, impact, urgency } = req.query;
  const description = req.body.description;

  if (!receivingGroup||!customString1||!configurationItemId||
      !type||!impact||!urgency||!description)
    return res.status(400).json({ message:'Missing parameters for inf' });

  const payload = {
    Description:description,
    DescriptionHtml:`<p>${description}</p>`,
    IpkStatus:1,IpkStream:0,
    Impact:+impact, Urgency:+urgency, Type:+type,
    ReceivingGroup:+receivingGroup,
    CustomString1:customString1,
    ConfigurationItemId:+configurationItemId,
    User:34419
  };

  const { data } = await axios.post(api('/api/v2/call'), payload,
    { headers:{Authorization:`Bearer ${access_token}`} });
  const ref = data.Ref;
  if (!ref) return res.status(500).json({ message:'No Ref returned' });

  // attachment if present
  if (req.file){
    const fp = req.file.path;
    const form = new FormData();
    form.append('file', fs.createReadStream(fp));
    await axios.post(
      api(`/api/v2/call/${ref}/attachments`),
      form,
      { headers:{ ...form.getHeaders(), Authorization:`Bearer ${access_token}` } }
    );
    fs.unlink(fp, ()=>{});
  }

  // submit
  await axios.put(api(`/api/v2/call/${ref}/submit`), null,
    { headers:{Authorization:`Bearer ${access_token}`} });

  res.json({ callRef:ref });
}

// codeType=stock 
async function handleStock(req,res){
  const { purchase, transactionStatus } = req.query;
  const quantity = req.body.quantity;

  if (!purchase||!transactionStatus||!quantity)
    return res.status(400).json({ message:'Missing parameters for stock' });

  // 1 create
  const payload = {
    Purchase:+purchase,
    TransactionStatus:+transactionStatus,
    Quantity:+quantity
  };

  const { data } = await axios.post(api('/api/v2/inventory-allocation'),
    payload,{ headers:{Authorization:`Bearer ${access_token}`} });
  const ref = data.Ref;
  if (!ref) throw new Error('No Ref returned from create inventory');

  // 2 submit
  await axios.put(api(`/api/v2/inventory-allocation/${ref}/submit`), null,
    { headers:{Authorization:`Bearer ${access_token}`} });

  res.json({ callRef:ref });
}
// Start APP
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));