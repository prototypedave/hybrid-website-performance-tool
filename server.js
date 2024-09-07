import express from 'express';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import { format } from 'date-fns';
import { createBrowser, createReportWithBrowser } from './performance-tool/lighthouse-util.js';
import { Report, Rep } from './performance-tool/model.js';
import { PingReport, Traceroute } from './network-tool/model.js';
import { performPing, performSSLCheck, traceRoute } from './network-tool/service.js';

const app = express();
const port = 3000;
app.use(express.json());

// MongoDB setup
const mongoUri = 'mongodb://localhost:27017';
const client = new MongoClient(mongoUri, {});
const dbName = 'lighthouseQueueDB';
const collectionName = 'continuousQueue';

// Connect to MongoDB
async function connectToDb() {
    try {
        await client.connect();
        console.log(`[${getCurrentTime()}] Connected to MongoDB`);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to connect to MongoDB`, error);
        process.exit(1);
    }
}

// Connect to Mongoose
async function connectToMongoose() {
    try {
        await mongoose.connect('mongodb://localhost:27017/lighthouseQueueDB', {});
        console.log(`[${getCurrentTime()}] Connected to MongoDB with Mongoose`);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to connect to MongoDB with Mongoose`, error);
        process.exit(1);
    }
}

connectToDb();
connectToMongoose();

async function saveToContinuousQueue(url) {
    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        // Check if URL already exists in the collection
        const existing = await collection.findOne({ url });
        if (existing) {
            console.log(`[${getCurrentTime()}] URL ${url} already exists in database.`);
            return;
        }
        
        await collection.insertOne({ url, addedAt: new Date() });
        console.log(`[${getCurrentTime()}] Saved ${url} to database.`);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to save to MongoDB`, error);
    }
}

async function retrieveContinuousQueue() {
    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const urls = await collection.find().sort({ addedAt: 1 }).toArray();
        return urls.map(doc => doc.url);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to retrieve from MongoDB`, error);
        return [];
    }
}

async function removeFromContinuousQueue(url) {
    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        await collection.deleteOne({ url });
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to remove from MongoDB`, error);
    }
}

let immediateQueue = [];
let continuousQueue = [];
let isProcessingImmediate = false;
let isProcessingContinuous = false;
let isProcessingNewUrl = false;

// format date and time
function getCurrentTime() {
    return format(new Date(), 'MM/dd/yyyy hh:mm:ss a');
}

// process urls
async function processUrl(url) {
    const browser = await createBrowser();
    try {
        await createReportWithBrowser(browser, url, { output: 'html' });
        await performPing(url);
        await traceRoute(url);
        console.log(`[${getCurrentTime()}] Report generated for ${url}`);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to create report for ${url}:`, error);
    } finally {
        await browser.close();
    }
}

// process new urls
async function processImmediateQueue() {
    isProcessingImmediate = true;

    while (immediateQueue.length > 0) {
        const url = immediateQueue.shift();
        await processUrl(url);
        continuousQueue.unshift(url); 
        await saveToContinuousQueue(url); 
    }

    isProcessingImmediate = false;

    if (isProcessingNewUrl) {
        isProcessingNewUrl = false;
        processContinuousQueue().catch(error => {
            console.error(`[${getCurrentTime()}] Error during continuous queue processing:`, error);
        });
    }
}

// process saved urls
async function processContinuousQueue() {
    isProcessingContinuous = true;

    while (continuousQueue.length > 0) {
        if (immediateQueue.length > 0 && isProcessingImmediate) {
            // Pause continuous processing if a new URL is being processed
            isProcessingNewUrl = true;
            break;
        }
        const url = continuousQueue.shift();
        await processUrl(url);
        await removeFromContinuousQueue(url); 
    }
    isProcessingContinuous = false;
}

// Schedule continuous processing every 5 minutes
const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
setInterval(() => {
    if (continuousQueue.length > 0 && !isProcessingContinuous && !isProcessingImmediate) {
        processContinuousQueue().catch(error => {
            console.error(`[${getCurrentTime()}] Error during continuous queue processing:`, error);
        });
    }
}, interval);

// Endpoint to add a new URL to the queue
app.post('/add-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send('URL is required.');
    }

    // Check if the URL is already in the database
    if ((await retrieveContinuousQueue()).includes(url)) {
        return res.status(409).send('URL has already been added.');
    }

    // Check if the URL is in the immediate queue
    if (immediateQueue.includes(url)) {
        return res.status(409).send('URL is already in the immediate queue.');
    }

    if (isProcessingContinuous) {
        // Add new URL to the top of the continuous queue
        continuousQueue.unshift(url); 
        console.log(`[${getCurrentTime()}] Added ${url} to the top of the continuous queue.`);
    } else {
        // Add new URL to the immediate queue
        immediateQueue.push(url);
        console.log(`[${getCurrentTime()}] Added ${url} to the immediate queue.`);
        
        // If not processing immediately, trigger immediate processing
        if (!isProcessingImmediate) {
            console.log(`[${getCurrentTime()}] Starting immediate processing of the queue...`);
            processImmediateQueue().catch(error => {
                console.error(`[${getCurrentTime()}] Error during immediate processing:`, error);
            });
        }
    }

    // Save the new URL to MongoDB
    await saveToContinuousQueue(url);

    res.status(200).send(`Added ${url} to the queue.`);
});


app.post('/run-reports', (req, res) => {
    if (immediateQueue.length === 0 && continuousQueue.length === 0) {
        return res.status(200).send('No URLs in the queues.');
    }

    if (!isProcessingImmediate && !isProcessingContinuous) {
        console.log(`[${getCurrentTime()}] Starting immediate processing of the queue...`);
        processImmediateQueue().then(() => {
            console.log(`[${getCurrentTime()}] Immediate processing complete. Starting continuous processing if needed...`);
            processContinuousQueue().catch(error => {
                console.error(`[${getCurrentTime()}] Error during processing:`, error);
            });
        }).catch(error => {
            res.status(500).send(`Error processing reports: ${error.message}`);
        });
    } else {
        res.status(200).send('Already processing the queues.');
    }
});

// Initialize queues from MongoDB on server start
async function initializeQueues() {
    const savedUrls = await retrieveContinuousQueue();
    continuousQueue = savedUrls;
    console.log(`[${getCurrentTime()}] Initialized continuous queue from MongoDB.`);
    if (continuousQueue.length > 0) {
        console.log(`[${getCurrentTime()}] Starting initial processing of the continuous queue...`);
        processContinuousQueue().catch(error => {
            console.error(`[${getCurrentTime()}] Error during initial continuous queue processing:`, error);
        });
    }
}

initializeQueues();

// Start the server
app.listen(port, () => {
    console.log(`[${getCurrentTime()}] Express server is running on http://localhost:${port}`);
});

// Fetch the performance metrics from the Report collection
app.get('/report/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await Report.findOne({ url }).exec();
        const rep = await Rep.findOne({ url }).exec();

        if (report && rep) {
            // Extract performance metrics
            const mobile = report.performanceMetrics?.mobile || {};
            const desktop = { ...report.performanceMetrics?.desktop } || {};

            // Add diagnostics to the performance metrics
            mobile.diagnostics = rep.mobileDiagnostics || [];
            desktop.diagnostics = rep.desktopDiagnostics || [];

            // Construct the final performanceMetrics object
            const finalPerformanceMetrics = {
                mobile,
                desktop
            };
            return res.json({ ...report._doc, performanceMetrics: finalPerformanceMetrics });
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch ping
app.get('/ping/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await PingReport.findOne({ url }).exec();
        if (report) {
            return res.json(report);
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch trace data 
app.get('/trace/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await Traceroute.findOne({ url }).exec();
        if (report) {
            return res.json(report);
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});

// fetch SSL certificate
app.get('/SSL/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await performSSLCheck(url);
        if (report) {
            return res.json(report);
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/coord/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await Traceroute.findOne({ url }).exec();
        if (report) {
            // Extract IP addresses from the report
            const hops = report.tracerouteData;
            
            // Create promises to get coordinates for each IP address
            const coordinatePromises = hops.map(async (hop) => {
                const { ipAddress } = hop;
                
                if (isPrivateIP(ipAddress)) {
                    // Return null coordinates for private IP addresses
                    return [null, null];
                }
                
                try {
                    const { coordinates } = await getCoordinates(ipAddress);
                    return coordinates ? [coordinates.latitude, coordinates.longitude] : [null, null];
                } catch (error) {
                    // Log error if needed
                    console.error(`Error fetching coordinates for IP ${ipAddress}:`, error.message);
                    return [null, null]; // Return default coordinates on error
                }
            });

            // Wait for all coordinate lookups to complete
            const coordinatesList = await Promise.all(coordinatePromises);
            return res.json(coordinatesList); // Return the list of coordinates
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});


const isPrivateIP = (ip) => {
    const parts = ip.split('.').map(Number);
    return (
        (parts[0] === 10) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168)
    );
};
