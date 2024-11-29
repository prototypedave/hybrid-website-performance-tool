import mongoose from 'mongoose';
import { getMetricsByUrl, getMetricsByUrlAndTimeRange } from './main.js';

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
            evidence: String,
        },
    ],
    collectedAt: { type: Date, default: Date.now }, 
});
alertSchema.index({ url: 1, collectedAt: -1 });
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
    
    const sum = vuln.info.sum + vuln.high.sum + vuln.medium.sum + vuln.low.sum;
    // percentage
    vuln = {
        info: (vuln.info.sum / sum * 100),
        high: (vuln.high.sum / sum * 100),
        medium: (vuln.medium.sum / sum * 100),
        low: (vuln.low.sum / sum * 100)
    }
    return vuln;
    
}

// get alerts by name
function getAlertsByName(metrics) {
    let alerts = {
        sql: {sum:0, alert:[]}, cross: {sum:0, alert:[]}, 
        forge: {sum:0, alert:[]}, expose: {sum:0, alert:[]}, 
        headers: {sum:0, alert:[]}, other: []
    }

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

export function getSecurityScoreOverTime(metrics) {
    let vulnList = [];
    for (let i = 0; i < metrics.length; i++) {
        let vuln = {info: 0, low: 0, high: 0, medium: 0};
        for (let j = 0; j < metrics[i].alerts.length; j++) {
            if (metrics[i].alerts[j].risk === "High") {
                vuln.high += 1;
            } else if (metrics[i].alerts[j].risk === "Medium") {
                vuln.medium += 1;
            } else if (metrics[i].alerts[j].risk === "Low") {
                vuln.low += 1;
            } else if (metrics[i].alerts[j].risk === "Informational") {
                vuln.info += 1;
            } else {
                console.log(`Invalid Risk ${metrics[i].alerts[j].risk}`);
            }
        }
        vulnList.push(vuln);
    }
    return vulnList;
}

export async function getLatestSuggestions(url, checks) {
    const metrics = await getMetricsByUrl(url, 1, Alert);
    const suggList = [];
    if (metrics != null) {
        for (let i = 0; i < metrics[0].alerts.length; i++) {
            if (metrics[0].alerts[i].risk.includes(checks)) {
                let sugg = {
                    name: metrics[0].alerts[i].name, 
                    desc: metrics[0].alerts[i].description,
                    soln: metrics[0].alerts[i].solution, 
                    ref: metrics[0].alerts[i].reference,
                    evidence: metrics[0].alerts[i].reference
                };
                suggList.push(sugg);
            }
        }
    }
    return suggList;
}

// fetch security data
export async function ParseSecurityResults(url, time, db=Alert) {
    if (time != 6) {
        const metrics = await getMetricsByUrlAndTimeRange(url, time, db);
        if (metrics != null) {
            const vulnerabilityAssessment = getVulnerabilityByPercentage(metrics, true);
            const alertsByName = getAlertsByName(metrics);
            const scores = getSecurityScoreOverTime(metrics);
            const security = {
                vulnerability : vulnerabilityAssessment,
                alertByName : alertsByName,
                score : scores,
            }
            return security;
        }
    } else {
        const metrics = await getMetricsByUrl(url, 1, db) 
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