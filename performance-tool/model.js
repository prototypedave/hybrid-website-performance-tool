import mongoose from 'mongoose';

// schemas for optimization
const headingSchema = new mongoose.Schema({
    name: String, 
    value: String
});
  
const itemSchema = new mongoose.Schema({
    name: String, 
    value: String
});
  
// Define the main schema for diagnostics
const diagnosticSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    info: String,
    link: String,
    metrics: String,
    level: Number,
    savings: String, 
    headings: [headingSchema],  
    items: [itemSchema]  
});
  
const repSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    mobileDiagnostics: [diagnosticSchema],  
    desktopDiagnostics: [diagnosticSchema]  
});

export async function saveDiagnostics(mobile, desktop, url) {
    const query = { url: url };  
    const update = {
        $set: { mobileDiagnostics: mobile, desktopDiagnostics: desktop }
    };

    await handleSave(Rep, query, update);
}

// Create the models
export const Rep = mongoose.model('Rep', repSchema);

async function handleSave(model, query, update) {
    try {
        await model.findOneAndUpdate(query, update, { upsert: true, new: true });
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        throw error;
    }
}


// Performance Metrics
const metricSchema = new mongoose.Schema({
    value: { type: Number, required: true },
});

const performanceMetricsSchema = new mongoose.Schema({
    mobile: {
        fcp: { type: metricSchema, required: true },
        si: { type: metricSchema, required: true },
        lcp: { type: metricSchema, required: true },
        tbt: { type: metricSchema, required: true },
        cls: { type: metricSchema, required: true },
        totalPerformance: { type: Number, required: true }
    },
    desktop: {
        fcp: { type: metricSchema, required: true },
        si: { type: metricSchema, required: true },
        lcp: { type: metricSchema, required: true },
        tbt: { type: metricSchema, required: true },
        cls: { type: metricSchema, required: true },
        totalPerformance: { type: Number, required: true }
    }
});


const reportSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },  
    performanceMetrics: { type: performanceMetricsSchema, required: true },
    timestamp: { type: Date, default: Date.now }
});

export const Report = mongoose.model('Report', reportSchema);

export async function handleReportSave(model, query, update) {
    try {
        await model.findOneAndUpdate(query, update, { upsert: true, new: true });
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        throw error;
    }
}
