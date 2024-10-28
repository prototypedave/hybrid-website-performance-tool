import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    OWASP_2021_A05: { type: String },
    OWASP_2017_A06: { type: String }
});

// Define the schema for alerts within security reports
const alertsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    risk: { type: String, required: true },
    description: { type: String, required: true },
    confidence: { type: String, required: true },
    evidence: { type: String, required: true },
    solution: { type: String, required: true },
    reference: { type: String, required: true },
    attacks: { type: String },
    cweid: { type: Number, required: true },
    wascid: { type: Number, required: true },
    alertRef: { type: String, required: true },
    tags: { type: tagSchema }
});

// Define the schema for the security report
const securitySchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    alerts: { type: [alertsSchema], required: true },
    timestamp: { type: Date, default: Date.now }
});

export const Security = mongoose.model('Security', securitySchema);


export async function Save(model, query, update) {
    try {
        await model.findOneAndUpdate(
            query,
            { $set: { alerts: update, timestamp: new Date() } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`Error saving to MongoDB:`, error);
        throw error;
    }
}
