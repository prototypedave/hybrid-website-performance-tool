import mongoose from 'mongoose';
import moment from 'moment';

export async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/webtoolDB', {});
        console.log('Successfully connected to webtoolDB');
    } catch (error) {
        console.error('Error connecting to webtoolDB:', error);
    }
}

export async function disconnectDatabase() {
    mongoose.disconnect();
}

// Returns given number of records from the database history
export async function getMetricsByUrl(url, limit = 5, db) {
    try {
        const metricsHistory = await db.find({ url })
            .sort({ collectedAt: -1 })
            .limit(limit)   
            .exec();

        if (metricsHistory.length > 0) {
            return metricsHistory;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error retrieving metrics:', error);
        return null;
    } finally {
        //mongoose.connection.close();  
    }
}

// Returns records for the given time range
export async function getMetricsByUrlAndTimeRange(url, timeRange, db) {
    try {
        let timeFilter = {};
        let dateFilter;
        
        switch (timeRange) {
            case '1h':
                dateFilter = moment().subtract(1, 'hours').toDate();
                timeFilter = { collectedAt: { $gte: dateFilter } };
                break;
            case '24h':
                dateFilter = moment().subtract(24, 'hours').toDate();
                timeFilter = { collectedAt: { $gte: dateFilter } };
                break;
            case '1w':
                dateFilter = moment().subtract(1, 'week').toDate();
                timeFilter = { collectedAt: { $gte: dateFilter } };
                break;
            case '1m':
                dateFilter = moment().subtract(1, 'month').toDate();
                timeFilter = { collectedAt: { $gte: dateFilter } };
                break;
            default:
                throw new Error('Invalid time range. Use "1h", "24h", "1w", or "1m".');
        }

        console.log('Time Filter:', timeFilter); // Log to debug
        
        // Query the parent document in the collection (Alert or performanceMetrics)
        const metricsHistory = await db.find({ url, ...timeFilter })
            .sort({ collectedAt: -1 })
            .exec();

        if (metricsHistory.length > 0) {
            return metricsHistory;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error retrieving metrics:', error);
        return null;
    }
}