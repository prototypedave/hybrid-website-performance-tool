import mongoose from 'mongoose';
import moment from 'moment';
import { getMetricsByUrl } from './main.js';

mongoose.connect('mongodb://localhost:27017/securityDB', {});

const alertSchema = new mongoose.Schema({
    url: { type: String, required: true },
    alerts: [
        {
            name: String,
            risk: String,
            confidence: String,
            url: String,
            description: String,
            solution: String,
            reference: String,
        },
    ],
    timestamp: { type: Date, default: Date.now },
});
export const Alert = mongoose.model('Alert', alertSchema);

export async function saveAlertsToMongo(bulkData) {
    try {
        await Alert.insertMany(bulkData);
        console.log(`Results saved for ${bulkData.length} URLs`);
    } catch (error) {
        console.error('Error saving results:', error.message);
    }
}

// classification of alerts based on severity of the attack
function getVulnerabilityScore(metrics) {
    const vuln = {info: {sum: 0, alerts: []}, high: {sum: 0, alerts: []}, low: {sum: 0, alerts: []}, medium: {sum: 0, alerts: []}};
    for (let i = 0; i < metrics.length; i++) {
        for (let j = 0; j < metrics[i].alerts.length; j++) {
            if (metrics[i].alerts[j].risk === "High") {
                vuln.high.sum += 1;
                vuln.high.alerts.push(metrics[i].alerts[j]);
            } else if (metrics[i].alerts[j].risk === "Medium") {
                vuln.medium.sum += 1;
                vuln.medium.alerts.push(metrics[i].alerts[j]);
            } else if (metrics[i].alerts[j].risk === "Low") {
                vuln.low.sum += 1;
                vuln.low.alerts.push(metrics[i].alerts[j]);
            } else if (metrics[i].alerts[j].risk === "Informational") {
                vuln.info.sum += 1;
                vuln.info.alerts.push(metrics[i].alerts[j]);
            } else {
                console.log(`Invalid Risk ${metrics[i].alerts[j].risk}`);
            }
        }
    }
    return vuln;
}

// get average overtime
function getAverageVulnerabilityScore(metrics) {
    let vuln = getVulnerabilityScore(metrics);
    // get average
    vuln = {info: {sum: Math.ceil(vuln.info.sum / metrics.length), alerts: vuln.info.alerts},
            high: {sum: Math.ceil(vuln.high.sum / metrics.length), alerts: vuln.high.alerts},
            low: {sum: Math.ceil(vuln.low.sum / metrics.length), alerts: vuln.low.alerts},
            medium: {sum: Math.ceil(vuln.medium.sum / metrics.length), alerts: vuln.medium.alerts}
    }
    return vuln;
}

// gets the percentage of the scores
function getVulnerabilityByPercentage(metrics, AVG=false) {
    let vuln = AVG? getAverageVulnerabilityScore(metrics) : getVulnerabilityScore(metrics);
    
    const sum = vuln.info + vuln.high + vuln.medium + vuln.low;
    // percentage
    vuln = {
        info: (vuln.info / sum * 100),
        high: (vuln.high / sum * 100),
        medium: (vuln.medium / sum * 100),
        low: (vuln.low / sum * 100)
    }
    console.log(vuln);
    
}

// get alerts by name
function getAlertsByName(metrics) {
    let alerts = {
        sql: {sum:0, alert:[]}, cross: {sum:0, alert:[]}, 
        forge: {sum:0, alert:[]}, expose: {sum:0, alert:[]}, 
        headers: {sum:0, alert:[], other: []}
    };

    for (let i = 0; i < metrics.length; i++) {
        for (let j = 0; j < metrics[i].alerts.length; j++) {
            // SQL
            if (metrics[i].alerts[j].name.toLowerCase().includes('sql')) {
                alerts.sql.sum += 1;
                alerts.sql.alert.push(metrics[i].alerts[j]);
            } else if (metrics[i].alerts[j].name.toLowerCase().includes('scripting')) {
                alerts.cross.sum += 1;
                alerts.cross.alert.push(metrics[i].alerts[j]);
            } else if (metrics[i].alerts[j].name.toLowerCase().includes('forgery')) {
                alerts.forge.sum += 1;
                alerts.forge.alert.push(metrics[i].alerts[j]);
            } else if (metrics[i].alerts[j].name.toLowerCase().includes('disclosure')) {
                alerts.expose.sum += 1;
                alerts.expose.alert.push(metrics[i].alerts[j]);
            } else if (metrics[i].alerts[j].name.toLowerCase().includes('missing')) {
                alerts.headers.sum += 1;
                alerts.headers.alert.push(metrics[i].alerts[j]);
            } else {
                alerts.other.push(metrics[i].alerts[j]);
            }
        }
    }
    return alerts;
}

// fetch security data
export async function ParseSecurityResults(url, time, Alert) {
    if (time != 6) {
        const metrics = await getMetricsByUrlAndTimeRange(url, time, Alert);
        if (metrics != null) {
            const vulnerabilityAssessment = getVulnerabilityByPercentage(metrics, true);
            const alertsByName = getAlertsByName(metrics);
            const security = {
                vulnerability : vulnerabilityAssessment,
                alertByName : alertsByName,
            }
            return security;
        }
    } else {
        const metrics = await getMetricsByUrl(url, 1, Alert) 
        if (metrics != null) {
            const vulnerabilityAssessment = getVulnerabilityByPercentage(metrics);
            const alertsByName = getAlertsByName(metrics);
            const security = {
                vulnerability : vulnerabilityAssessment,
                alertByName : alertsByName,
            }
            return security;
        }
        
    }
}
