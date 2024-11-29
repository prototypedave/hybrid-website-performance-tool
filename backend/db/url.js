import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    addedAt: { type: Date, default: Date.now },
});
urlSchema.index({ url: 1 });

const urlMetric = mongoose.model('Urls', urlSchema);

export async function saveUrl(url) {
    try {
        // Check if the URL already exists in the database
        const existingUrl = await urlMetric.findOne({ url });
        if (existingUrl) {
            console.log(`URL already exists: ${url}`);
            return 'Already exists';
        }
        const newUrl = new urlMetric({ url });
        await newUrl.save();
        console.log(`URL saved: ${url}`);
        return 'Success';
    } catch (error) {
        console.error(`Error saving URL: ${error.message}`);
    }
}

export async function getAllUrls() {
    try {
        const df = [];
        const urls = await urlMetric.find();
        for (let i = 0; i < urls.length; i++) {
            df.push(urls[i].url);
        }
        return df;
    } catch (error) {
        console.error(`Error retrieving URLs: ${error.message}`);
    }
}
