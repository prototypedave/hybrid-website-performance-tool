import express from 'express';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import { format } from 'date-fns';
import { createBrowser, createReportWithBrowser } from './performance-tool/lighthouse-util.js';
import { Report, Rep } from './performance-tool/model.js';
import { PingReport, Traceroute } from './network-tool/model.js';
import { performPing, performSSLCheck, traceRoute } from './network-tool/service.js';
import { Security } from './security-tool/model.js';
import { SecurityScan } from './security-tool/security.js';
import cors from 'cors';

const app = express();
const port = 8080;
app.use(express.json());
app.use(cors());

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
        const existing = await collection.findOne({ url });
        if (existing) {
            console.log(`[${getCurrentTime()}] URL ${url} already exists in the continuous queue database.`);
            return;
        }
        await collection.insertOne({ url, addedAt: new Date() });
        console.log(`[${getCurrentTime()}] Saved ${url} to continuous queue database.`);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to save URL to MongoDB`, error);
    }
}

async function retrieveContinuousQueue() {
    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const urls = await collection.find().sort({ addedAt: 1 }).toArray();
        return urls.map(doc => doc.url);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to retrieve continuous queue from MongoDB`, error);
        return [];
    }
}

async function removeFromContinuousQueue(url) {
    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        await collection.deleteOne({ url });
        console.log(`[${getCurrentTime()}] Removed ${url} from continuous queue database.`);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to remove URL from MongoDB`, error);
    }
}

let immediateQueue = [];
let continuousQueue = [];
let isProcessingImmediate = false;
let isProcessingContinuous = false;
let isProcessingNewUrl = false;

function getCurrentTime() {
    return format(new Date(), 'MM/dd/yyyy hh:mm:ss a');
}

async function processUrl(url) {
    const browser = await createBrowser();
    try {
        await createReportWithBrowser(browser, url, { output: 'html' });
        await performPing(url);
        await traceRoute(url);
        await SecurityScan(url);
        console.log(`[${getCurrentTime()}] Report generated for ${url}`);
    } catch (error) {
        console.error(`[${getCurrentTime()}] Failed to create report for ${url}:`, error);
    } finally {
        await browser.close();
    }
}

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
        processContinuousQueue().catch(error => console.error(`[${getCurrentTime()}] Error processing continuous queue:`, error));
    }
}

async function processContinuousQueue() {
    isProcessingContinuous = true;
    while (continuousQueue.length > 0) {
        if (immediateQueue.length > 0 && isProcessingImmediate) {
            isProcessingNewUrl = true;
            break;
        }
        const url = continuousQueue.shift();
        await processUrl(url);
        await removeFromContinuousQueue(url);
    }
    isProcessingContinuous = false;
}

async function initializeQueueFromDb() {
    const savedUrls = await retrieveContinuousQueue();
    continuousQueue = [...savedUrls];
    console.log(`[${getCurrentTime()}] Loaded ${savedUrls.length} URLs from MongoDB into the continuous queue.`);
}

const interval = 5 * 60 * 1000;
setInterval(() => {
    if (continuousQueue.length > 0 && !isProcessingContinuous && !isProcessingImmediate) {
        processContinuousQueue().catch(error => console.error(`[${getCurrentTime()}] Error processing continuous queue:`, error));
    }
}, interval);

app.post('/report', express.json(), async (request, response, next) => {
    if (!Array.isArray(request.body)) {
        console.error('Bad request: Expected an array');
        return response.sendStatus(400);
    }

    try {
        const { immediateQueue, continuousQueue, retrieveContinuousQueue, saveToContinuousQueue, isProcessingContinuous, isProcessingImmediate, processImmediateQueue, getCurrentTime } = request.app.locals;

        // Loop through the URLs provided in the request body
        const identifiers = await Promise.all(
            request.body.map(async ({ url, options }) => {
                assert(typeof url === 'string', 'Expected url to be provided');

                // Retrieve all the current URLs in the queues
                const allQueueUrls = [...immediateQueue, ...continuousQueue, ...(await retrieveContinuousQueue())];

                // Check if the URL is already in the queue
                if (!allQueueUrls.includes(url)) {
                    // If processing is happening, add to continuous queue, otherwise immediate queue
                    if (isProcessingContinuous) {
                        continuousQueue.unshift(url);
                        console.log(`[${getCurrentTime()}] Added ${url} to the top of the continuous queue.`);
                    } else {
                        immediateQueue.push(url);
                        console.log(`[${getCurrentTime()}] Added ${url} to the immediate queue.`);
                        // Trigger immediate queue processing if not already happening
                        if (!isProcessingImmediate) {
                            processImmediateQueue().catch(error => console.error(`[${getCurrentTime()}] Error processing immediate queue:`, error));
                        }
                    }
                    await saveToContinuousQueue(url);
                }
            })
        );

        // Return the URL and identifier for each successfully processed URL
        response.send(identifiers);
    } catch (error) {
        console.error('Error processing request:', error);
        next(error);
    }
});


initializeQueueFromDb().catch(error => console.error(`[${getCurrentTime()}] Failed to initialize continuous queue from database:`, error));

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

app.get('/security/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await Security.findOne({ url }).exec();
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

