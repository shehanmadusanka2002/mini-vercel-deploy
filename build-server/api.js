const express = require('express');
const cors = require('cors');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const Docker = require('dockerode');
const tar = require('tar-fs');
const Redis = require('ioredis');
const axios = require('axios');

const app = express();
app.use(express.json()); 
app.use(cors()); 

const git = simpleGit();
const docker = new Docker();
const redis = new Redis();

const API_PORT = 4000;

// 🔥 ඔයාගේ Keys මෙතන තියෙනවා
const CLIENT_ID = "Ov23lieyKoq6qVqRns2k";
const CLIENT_SECRET = "7fab0a76466c6856236472843cb941c53e6de739";

// --- Helper Functions ---

function getRandomPort() {
    return Math.floor(Math.random() * (10000 - 8000 + 1)) + 8000;
}

async function cloneRepository(gitUrl, projectId) {
    const outputDir = path.join(__dirname, 'output', projectId);
    console.log(`⬇️  Cloning ${gitUrl}...`);
    try {
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
        await git.clone(gitUrl, outputDir);
        return outputDir;
    } catch (error) {
        console.error("❌ Cloning Failed:", error);
        throw new Error("Cloning failed");
    }
}

function createDockerfile(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const dockerContent = `
            FROM node:18-alpine
            WORKDIR /app
            COPY package*.json ./
            RUN npm install
            COPY . .
            RUN npm run build
            RUN npm install -g serve
            CMD ["serve", "-s", "dist", "-l", "3000"] 
            EXPOSE 3000
        `;
        fs.writeFileSync(path.join(projectPath, 'Dockerfile'), dockerContent);
    }
}

async function buildImage(projectId, projectPath) {
    const imageName = `mini-vercel-${projectId}:latest`;
    const tarStream = tar.pack(projectPath);
    const stream = await docker.buildImage(tarStream, { t: imageName });

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, 
            (err, res) => err ? reject(err) : resolve(res)
        );
    });
    return imageName;
}

async function runContainer(projectId, imageName, port) {
    const containerName = `container-${projectId}`;
    try {
        const oldContainer = docker.getContainer(containerName);
        await oldContainer.remove({ force: true });
    } catch (e) {}

    const container = await docker.createContainer({
        Image: imageName,
        name: containerName,
        HostConfig: {
            PortBindings: { '3000/tcp': [{ HostPort: String(port) }] }
        }
    });

    await container.start();
    return `http://${projectId}.localhost`;
}

// --- API ROUTES ---

// 1. GitHub Auth Callback
app.get('/auth/github/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code
        }, {
            headers: { accept: 'application/json' }
        });
        const accessToken = response.data.access_token;
        res.redirect(`http://localhost:5173?token=${accessToken}`);
    } catch (error) {
        res.status(500).json({ error: "GitHub Login Failed" });
    }
});

// 2. User Repos Fetch
app.get('/repos', async (req, res) => {
    const token = req.headers.authorization;
    try {
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const repos = response.data.map(repo => ({
            name: repo.name,
            url: repo.clone_url
        }));
        res.json(repos);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch repos" });
    }
});

// 3. Get Deployed Projects List (Dashboard එකට)
app.get('/deployments', async (req, res) => {
    try {
        const keys = await redis.keys('details:*');
        if (keys.length === 0) {
            return res.json([]); 
        }
        const values = await redis.mget(keys);
        const deployments = values.map(v => JSON.parse(v));
        res.json(deployments);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch deployments" });
    }
});

// 4. Deploy Project (Main Route)
app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;

    if (!gitURL || !slug) return res.status(400).json({ status: 'error', message: 'Missing details' });

    // Safe Slug Clean up
    const safeSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    console.log(`🚀 New Deployment Request: ${safeSlug}`);

    try {
        const PORT = getRandomPort();
        const projectPath = await cloneRepository(gitURL, safeSlug);
        createDockerfile(projectPath);
        const imageName = await buildImage(safeSlug, projectPath);
        const url = await runContainer(safeSlug, imageName, PORT);

        // --- REDIS SAVING ---
        
        // A. Proxy එක සඳහා
        await redis.set(`project:${safeSlug}`, PORT);

        // B. Dashboard List එක සඳහා (මේක තමයි අලුත් කොටස)
        const projectDetails = {
            name: safeSlug,
            url: url,
            port: PORT,
            gitURL: gitURL,
            date: new Date().toLocaleString()
        };
        await redis.set(`details:${safeSlug}`, JSON.stringify(projectDetails));

        return res.json({ status: 'success', url: url, message: 'Deployment Successful!' });

    } catch (error) {
        console.error("Deploy Error:", error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(API_PORT, () => console.log(`⚙️  API Server Running on http://localhost:${API_PORT}`));