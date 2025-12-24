const express = require('express');
const httpProxy = require('http-proxy');
const Redis = require('ioredis'); // Redis සම්බන්ධ කරගන්නවා

const app = express();
const proxy = httpProxy.createProxyServer();
const redis = new Redis(); // Default localhost:6379 ට connect වෙනවා

const PORT = 80;

app.use(async (req, res) => {
    const hostname = req.headers.host;
    const subdomain = hostname.split('.')[0]; // Ex: "portfolio"

    // 1. කලින් අපි බැලුවේ variable එකකින්. දැන් අහන්නේ Redis එකෙන්.
    // අපි Data save කරන්නේ මෙහෙමයි: KEY="project:portfolio", VALUE="9000"
    const port = await redis.get(`project:${subdomain}`);

    if (!port) {
        return res.status(404).send(`
            <h1>404 Not Found</h1>
            <p>Oops! Project '${subdomain}' is not deployed yet.</p>
        `);
    }

    const targetUrl = `http://localhost:${port}`;
    console.log(`🚀 Found in Redis! Redirecting ${hostname} -> ${targetUrl}`);
    
    proxy.web(req, res, { target: targetUrl, changeOrigin: true }, (err) => {
        console.error("Proxy Error:", err);
        res.status(500).send("Proxy Error");
    });
});

app.listen(PORT, () => console.log(`🌍 Dynamic Proxy Running on Port ${PORT}`));