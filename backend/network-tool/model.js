import mongoose from 'mongoose';

// Define the schema for ping results
const pingSchema = new mongoose.Schema({
    host: { type: String, required: true },
    alive: { type: Boolean, required: true },
    time: { type: Number }, 
    min: { type: Number },  
    max: { type: Number },  
    avg: { type: Number },  
    packetLoss: { type: String }, 
}, { timestamps: true });


const pingMetricsSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },  
    pingMetrics: { type: pingSchema, required: true }
});

export async function handlePingSave(model, query, update) {
    try {
        await model.findOneAndUpdate(query, update, { upsert: true, new: true });
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        throw error;
    }
}

export const PingReport = mongoose.model('Ping', pingMetricsSchema);

const HopSchema = new mongoose.Schema({
    hopNumber: { type: Number, required: true },
    ipAddress: { type: String, required: true },
    latency: { type: Number, required: true }
});

const TracerouteSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    tracerouteData: { type: [HopSchema], required: true },
    timestamp: { type: Date, default: Date.now }
});

export async function handleMongoSave(model, query, tracerouteData) {
    try {
        await model.findOneAndUpdate(
            query,
            { $set: { tracerouteData, timestamp: new Date() } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`Error saving to MongoDB:`, error);
        throw error;
    }
}

export const Traceroute = mongoose.model('Traceroute', TracerouteSchema);