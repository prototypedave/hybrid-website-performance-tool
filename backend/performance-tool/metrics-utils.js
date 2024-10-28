// filters diagnostics object
export function filterAndTransform(diagnostics) {
    return diagnostics.map(item => {
        return {
            title: item.title || '',
            description: item.description || '',
            info: item.info || '',
            link: item.link || '',
            metrics: item.metrics || '',
            level: item.level || '',
            savings: item.savings || '',
            headings: item.details?.headings || [],
            items: item.details?.items || []
        };
    }).sort((a, b) => a.level - b.level);
}

// calculates metric value
export function calculateMetricValue(value, min, max, equivalentMin, equivalentMax) {
    if (value <= min) return equivalentMin;
    if (value >= max) return equivalentMax;
    return 100 - ((value - min) / (max - min)) * (100 - equivalentMax);
}

//gets metric parameters based on form factor
function getMetricParameters(formFactor) {
    if (formFactor === 'mobile') {
        return {
            fcp: { min: 1000, max: 6000, equivalentMin: 100, equivalentMax: 4 },
            si: { min: 1000, max: 12000, equivalentMin: 100, equivalentMax: 4 },
            lcp: { min: 1000, max: 8000, equivalentMin: 100, equivalentMax: 3 },
            tbt: { min: 0, max: 3000, equivalentMin: 100, equivalentMax: 3 },
            cls: { min: 0.00, max: 0.82, equivalentMin: 100, equivalentMax: 5 },
            weights: { fcp: 0.1, si: 0.1, lcp: 0.25, tbt: 0.3, cls: 0.25 }
        };
    } else {
        return {
            fcp: { min: 0, max: 4000, equivalentMin: 100, equivalentMax: 1 },
            si: { min: 0, max: 5000, equivalentMin: 100, equivalentMax: 4 },
            lcp: { min: 0, max: 6000, equivalentMin: 100, equivalentMax: 5 },
            tbt: { min: 0, max: 2000, equivalentMin: 100, equivalentMax: 0 },
            cls: { min: 0.00, max: 0.82, equivalentMin: 100, equivalentMax: 5 },
            weights: { fcp: 0.1, si: 0.1, lcp: 0.25, tbt: 0.3, cls: 0.25 }
        };
    }
}

// calculate metric values
function calculateMetrics(metrics, parameters) {
    return {
        fcp: calculateMetricValue(metrics.fcp, parameters.fcp.min, parameters.fcp.max, parameters.fcp.equivalentMin, parameters.fcp.equivalentMax),
        si: calculateMetricValue(metrics.si, parameters.si.min, parameters.si.max, parameters.si.equivalentMin, parameters.si.equivalentMax),
        lcp: calculateMetricValue(metrics.lcp, parameters.lcp.min, parameters.lcp.max, parameters.lcp.equivalentMin, parameters.lcp.equivalentMax),
        tbt: calculateMetricValue(metrics.tbt, parameters.tbt.min, parameters.tbt.max, parameters.tbt.equivalentMin, parameters.tbt.equivalentMax),
        cls: calculateMetricValue(metrics.cls, parameters.cls.min, parameters.cls.max, parameters.cls.equivalentMin, parameters.cls.equivalentMax)
    };
}

// Function to calculate total performance score
function calculateTotalPerformance(values, weights) {
    return (values.fcp * weights.fcp) +
           (values.si * weights.si) +
           (values.lcp * weights.lcp) +
           (values.tbt * weights.tbt) +
           (values.cls * weights.cls);
}

// calculates performance metrics
export function calculatePerformanceMetrics(metrics, formFactor) {
    const parameters = getMetricParameters(formFactor);
    
    // Calculate metrics
    const calculatedValues = calculateMetrics(metrics, parameters);
    
    // Calculate total performance score
    const totalPerformance = calculateTotalPerformance(calculatedValues, parameters.weights);

    // Return the results
    return {
        fcp: { value: calculatedValues.fcp, time: metrics.fcp },
        si: { value: calculatedValues.si, time: metrics.si },
        lcp: { value: calculatedValues.lcp, time: metrics.lcp },
        tbt: { value: calculatedValues.tbt, time: metrics.tbt },
        cls: { value: calculatedValues.cls, time: metrics.cls },
        totalPerformance
    };
}