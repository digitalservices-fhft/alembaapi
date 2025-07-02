const express = require('express');
const https = require('follow-redirects').https;
const qs = require('querystring');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/token', (req, res) => {
    const options = {
        method: 'GET',
        hostname: 'fhnhs.alembacloud.com',
        path: '/production/alemba.web/oauth/login',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': process.env.AUTHORIZATION_HEADER
        },
        maxRedirects: 20
    };

    const apiReq = https.request(options, function (apiRes) {
        let chunks = [];

        apiRes.on("data", function (chunk) {
            chunks.push(chunk);
        });

        apiRes.on("end", function () {
            const body = Buffer.concat(chunks).toString();
            try {
                const json = JSON.parse(body);
                res.json({ access_token: json.access_token });
            } catch (e) {
                res.status(500).send("Failed to parse response");
            }
        });

        apiRes.on("error", function (error) {
            res.status(500).send("API request error: " + error.message);
        });
    });

    const postData = qs.stringify({
        'Grant_type': 'password',
        'Scope': 'session-type:Analyst',
        'Client_id': process.env.CLIENT_ID,
        'Username': process.env.USERNAME,
        'Password': process.env.PASSWORD
    });

    apiReq.write(postData);
    apiReq.end();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
