import React, { createContext, useContext } from 'react';

const URLContext = createContext();
const ResultsContext = createContext();

export function URLProvider({ children, value, results }) {
    return (
        <URLContext.Provider value={value}>
            <ResultsContext.Provider value={results}>
                {children}
            </ResultsContext.Provider>
        </URLContext.Provider>
    );
}

export function useURL() {
    return useContext(URLContext);
}

export function useResults() {
    return useContext(ResultsContext);
}
