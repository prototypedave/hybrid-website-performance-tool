import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './db/main.js';
import { getAllUrls, saveUrl } from './db/url.js';
import { startPeriodicExecution } from './performance/metrics.js';
import { startPeriodicExecutionSecurity } from './security/metrics.js';
import { ParsePerformanceResults } from './db/performance.js';
import { ParseSecurityResults } from './db/security.js';
import { getAnomalies } from './ai/metrics.js';

const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(cors());

// Start database connection
await connectToDatabase();

// URL storage
let urls = [];

// Function to load URLs periodically
async function urlsParser() {
    urls = await getAllUrls();
    setInterval(async () => {
        urls = await getAllUrls();
    }, 10 * 60 * 1000); // Refresh every 10 minutes
}

// Continuous running
urlsParser();
startPeriodicExecution(urls);
startPeriodicExecutionSecurity(urls);


app.post('/api/save-url', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'URL is required.' });
    }

    try {
        await saveUrl(url);
        urls.push({ url }); 
        return res.status(201).json({ message: 'URL saved successfully.' });
    } catch (error) {
        console.error(`Error saving URL: ${error.message}`);
        return res.status(500).json({ message: 'Failed to save URL.' });
    }
});

app.get('/api/performance-results', async (req, res) => {
    try {
        const { url, time } = req.query;
        const allowedValues = [6, '1h', '24h', '1w', '1m'];

        if (!allowedValues.includes(time)) {
            return res.status(404).json({ message: 'Invalid time parameter.' });
        }
        const performanceResults = await ParsePerformanceResults(url, time); 
        return res.status(200).json(performanceResults);
    } catch (error) {
        console.error(`Error fetching performance results: ${error.message}`);
        return res.status(500).json({ message: 'Failed to fetch performance results.' });
    }
});

app.get('/api/security-results', async (req, res) => {
    try {
        const { url, time } = req.query;
        const allowedValues = [6, '1h', '24h', '1w', '1m'];

        if (!allowedValues.includes(time)) {
            return res.status(404).json({ message: 'Invalid time parameter.' });
        }
        const securityResults = await ParseSecurityResults(url, time); 
        return res.status(200).json(securityResults);
    } catch (error) {
        console.error(`Error fetching security results: ${error.message}`);
        return res.status(500).json({ message: 'Failed to fetch security results.' });
    }
});

app.get('/api/ai', async (req, res) => {
    try {
        const { url } = req.query;
        const suggestions = await getAnomalies(url); 
        return res.status(200).json(suggestions);
    } catch (error) {
        console.error(`Error fetching suggestions: ${error.message}`);
        return res.status(500).json({ message: 'Failed to fetch suggestions.' });
    }
});

let server;
function shutdownServer() {
    console.log('Shutting down server...');
    if (server) {
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    }
}

server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);
