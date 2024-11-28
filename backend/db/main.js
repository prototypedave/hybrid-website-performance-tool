import moment from 'moment';


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
        switch (timeRange) {
            case '1h':
                timeFilter = { collectedAt: { $gte: moment().subtract(1, 'hours').toDate() } };
                break;
            case '24h':
                timeFilter = { collectedAt: { $gte: moment().subtract(24, 'hours').toDate() } };
                break;
            case '1w':
                timeFilter = { collectedAt: { $gte: moment().subtract(1, 'week').toDate() } };
                break;
            case '1m':
                timeFilter = { collectedAt: { $gte: moment().subtract(1, 'month').toDate() } };
                break;
            default:
                throw new Error('Invalid time range. Use "1h", "24h", "1w", or "1m".');
        }

        // Retrieve the metrics based on the time range
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
    } finally {
        //mongoose.connection.close();
    }
}


