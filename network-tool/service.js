import ping from 'ping';
import { handleMongoSave, handlePingSave, PingReport } from './model';
import { exec } from "child_process";
import { Traceroute } from './schemas.js';
import { IPinfoWrapper } from "node-ipinfo";

const ipinfo = new IPinfoWrapper("69a7f3d8d38d29");

export async function performPing(url) {
    try {
        const hostname = new URL(url).hostname;
        const pingResults = [];
  
        // Perform 6 pings
        for (let i = 0; i < 6; i++) {
            const response = await ping.promise.probe(hostname, { timeout: 1 });
            if (response.alive) {
                pingResults.push(response.time);
            }
        }
  
        if (pingResults.length === 0) {
            // All pings failed
            const pingMetrics = { host: hostname, alive: false, time: null, min: null, max: null, avg: null, packetLoss: '100.00',};
            console.log(`All pings failed for ${url}`);
            await handlePingSave(PingReport, { url: url }, {pingMetrics});
        }
  
        // Calculate statistics if pings succeeded
        const min = Math.min(...pingResults);
        const max = Math.max(...pingResults);
        const avg = pingResults.reduce((acc, val) => acc + val, 0) / pingResults.length;
        const packetLoss = ((6 - pingResults.length) / 6) * 100; 
  
        const pingMetrics = { host: hostname, alive: true, time: pingResults[pingResults.length - 1], min, max, avg, packetLoss: packetLoss.toFixed(2),};
        console.log(`Done getting ping for ${url}`);
        await handlePingSave(PingReport, { url: url }, {pingMetrics});
    } catch (error) {
        console.error(`Error performing ping for ${url}:`, error);
    }
}

export function performSSLCheck(url) {
    return new Promise((resolve, reject) => {
        try {
            const hostname = new URL(url).hostname;
    
            // Updated openssl command to retrieve more certificate details
            const command = `echo | openssl s_client -connect ${hostname}:443 -servername ${hostname} 2>/dev/null | openssl x509 -noout -text`;
    
            exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing SSL check: ${stderr}`);
                reject(`Error executing SSL check: ${stderr || err.message}`);
            } else {
                const output = stdout.trim();
                
                // Extract relevant SSL information
                const version = output.match(/Version: (.*)/)?.[1];
                const serialNumber = output.match(/Serial Number:\n\s*(.*)/)?.[1];
                const signatureAlgorithm = output.match(/Signature Algorithm: (.*)/)?.[1];
                const issuer = output.match(/Issuer:\n\s*(.*)/)?.[1];
                const subject = output.match(/Subject:\n\s*(.*)/)?.[1];
                const publicKeyAlgorithm = output.match(/Public Key Algorithm: (.*)/)?.[1];
                const rsaPublicKey = output.match(/RSA Public-Key: \((.*)\)/)?.[1];
                
                // Extract and calculate validity (days remaining)
                const notAfterMatch = output.match(/Not After : (.*)/);
                let diffDays = null;
                if (notAfterMatch) {
                const expiryDate = new Date(notAfterMatch[1]);
                const currentDate = new Date();
                const diffTime = Math.max(expiryDate - currentDate, 0);
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                
                // Build the SSL data object
                const sslInfo = {
                version,
                serialNumber,
                signatureAlgorithm,
                issuer,
                validity: diffDays ? `${diffDays} days remaining` : 'Unknown',
                subject,
                publicKeyAlgorithm,
                rsaPublicKey,
                };
    
                resolve(sslInfo);
            }
            });
            console.log(`Done checking SSL for ${url}`);
        } catch (error) {
            reject(`Error processing URL: ${error.message}`);
        }
    });
}

function performTraceroute(url) {
    return new Promise((resolve, reject) => {
        try {
            const { hostname } = new URL(url);
            const command = process.platform === 'win32' ? `tracert ${hostname}` : `traceroute ${hostname}`;
    
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    reject(`Error executing traceroute: ${stderr || err.message}`);
                } else {
                    resolve(stdout);
                }
            });
            console.log(`Done getting traceroute for ${url}`);
        } catch (error) {
            reject(`Error processing URL: ${error.message}`);
        }
    });
}

function parseTracerouteOutput(output) {
    const lines = output.split('\n');
    const regex = /(\d+)\s+.*\(([\d.]+)\).*?([\d.]+) ms/;
    const results = [];
  
    lines.forEach(line => {
        const match = regex.exec(line);
        if (match) {
            const hopNumber = match[1];
            const ipAddress = match[2];
            const latency = match[3];
            results.push({ hopNumber, ipAddress, latency });
        }
    });
  
    return results;
}

export async function traceRoute(url) {
    performTraceroute(url)
        .then((output) => {
            const parsedData = parseTracerouteOutput(output);
            handleMongoSave(Traceroute, { url: url }, parsedData);
        })
        .catch((error) => {
            console.error('Error:', error);
    });
}

export async function getCoordinates(ip) {
    try {
        const response = await ipinfo.lookupIp(ip);

        if (response.loc) {
            const [latitude, longitude] = response.loc.split(',').map(coord => parseFloat(coord));
            return { 
                coordinates: { latitude, longitude }
            };
        } else {
            // Improved error handling
            throw new Error(`Coordinates not found for IP: ${ip}`);
        }
    } catch (error) {
        console.error(`Failed to fetch coordinates for IP ${ip}:`, error.message);
        throw error;
    }
}
