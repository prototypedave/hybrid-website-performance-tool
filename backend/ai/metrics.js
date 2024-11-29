import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { getMetricsByUrlAndTimeRange } from '../db/main.js';
import { Alert, getLatestSuggestions, getSecurityScoreOverTime } from '../db/security.js';
import { performanceMetrics } from '../db/performance.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SECURITY_PROMPT = `Using the following dataset, analyze trends and anomalies for each metric found under the dataset object. For each metric (e.g., info, low, high, medium):
- Identify the metric name (e.g., info, low, high, medium).
- Determine whether there is a trend (e.g., "increasing," "decreasing," "stable") or an anomaly (a significant deviation from other values).
- If no trend or anomaly is detected, do not return that metric.
- Provide a probable reason for the observed trend or anomaly. If possible, suggest potential causes for the trend or anomaly.
- Include a field anomaly with a boolean value (true or false) to explicitly indicate whether an anomaly was detected for that metric.
Ensure that the analysis works for different variations of the dataset, and the output is structured in a consistent JSON format where each metric is represented as an object containing:
- metricName (name of the metric),
- trend (observed trend or null if no trend is detected),
- anomaly (true if an anomaly is detected, false otherwise),
- reason (a detailed explanation of the reason for the trend or anomaly).

The output should be structured so that individual results for each metric can be extracted and interpreted independently.
Important: Do not provide explanations, code, or any additional information outside the requested structured JSON format. Return only the JSON object as specified.
Use the following dataset: {{metrics}}`;

const PERFORMANCE_PROMPT = `Using the following dataset, analyze trends and anomalies for each metric found under the dataset object. 
For each metric: Identify the metric name (e.g., pageLoadTime, lcp). 
Determine whether there is a trend (e.g., "increasing," "decreasing," "stable") or an anomaly (a significant deviation from other values). 
If no trend or anomaly is detected, do not return that metric. Provide a probable reason for the observed trend or anomaly. If possible, suggest potential causes for the trend or anomaly. 
Include a field anomaly with a boolean value (true or false) to explicitly indicate whether an anomaly was detected for that metric. 
The output should be in a JSON format where each metric is represented as an object containing: The metric name (metricName). The observed trend (trend), or null if no trend is detected. 
A flag indicating the presence of an anomaly (anomaly). A detailed explanation of the reason for the trend or anomaly (reason). Ensure the output is structured so that individual results for each metric (e.g., pageLoadTime, lcp) can be extracted and interpreted independently. 
Use the following dataset: {{metrics}}`;

function generatePrompt(template, metrics) {
    return template.replace("{{metrics}}", JSON.stringify(metrics));
}

export async function getAnomalies(url) {
    let metricsSecurity = await getMetricsByUrlAndTimeRange(url, '1w', Alert);
    metricsSecurity = getSecurityScoreOverTime(metricsSecurity);
    let securityPrompt = generatePrompt(SECURITY_PROMPT, metricsSecurity);
    let securitySuggestions = await getSecuritySuggestions(url);

    let metricsPerformance = await getMetricsByUrlAndTimeRange(url, '1w', performanceMetrics);
    let performancePrompt = generatePrompt(PERFORMANCE_PROMPT, metricsPerformance);
    let performanceSuggestions = getPerformanceSuggestions(metricsPerformance);
    
    const securityAnalysis = await getGroqChatCompletion(securityPrompt);
    const performanceAnalysis = await getGroqChatCompletion(performancePrompt);

    const securityResponse = securityAnalysis.choices[0]?.message?.content || "";
    let security = processResponse(securityResponse);

    const performanceResponse = performanceAnalysis.choices[0]?.message?.content || "";
    let performance = processResponse(performanceResponse);
    const trends = checkTrends(performance, security);
    const anomalies = checkAnomalies(performance, security);

    return {
        trend : trends,
        anomalies: anomalies,
        performanceSuggestions: performanceSuggestions,
        securitySuggestions: securitySuggestions,
    };
}
  
export async function getGroqChatCompletion(prompt) { 
    return groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "llama3-8b-8192",
    });
}

function extractJson(content) {
    const jsonStart = content.indexOf("[");
    const jsonEnd = content.lastIndexOf("]") + 1;

    if (jsonStart !== -1 && jsonEnd !== -1) {
        return content.substring(jsonStart, jsonEnd);
    }
    return null;
}

function getPerformanceSuggestions(metrics) {
    let suggestions = [];
    for (let i = 0; i < metrics.length; i++) {
        for (let j = 0; j < metrics[i].suggestions; j++) {
            if (metrics[i].suggestions[j].score > 500) {
                suggestions.push(metrics[i].suggestions[j]);
            }
        }
    }
    return suggestions;
}

async function getSecuritySuggestions(url) {
    const checks = ['High', 'Medium', 'Low', 'Informational'];
    for (const check of checks) {
        const suggestions = await getLatestSuggestions(url, [check]);
        if (suggestions.length > 0) {
            return suggestions;
        }
    }
    return []; 
}

function processResponse(content) {
    try {
        const str = extractJson(content);
        const parsedData = JSON.parse(str);
        if (!Array.isArray(parsedData) && typeof parsedData === "object") {
            return Object.values(parsedData);
        }
        return parsedData;
    } catch (e) {
        console.error("Failed to parse or process response content:", e);
        console.error("Response content was:", content);
        return null;
    }
}

function checkAnomalies(metricOne, metricTwo) {
    return [...metricOne, ...metricTwo].filter(metric => metric.anomaly);
}

function checkTrends(metricOne, metricTwo) {
    return [...metricOne, ...metricTwo].filter(
        metric => metric.trend === 'increasing' || metric.trend === 'decreasing'
    );
}


