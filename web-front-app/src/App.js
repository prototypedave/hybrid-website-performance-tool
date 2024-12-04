import React, { useEffect, useState } from "react";
import DashboardSidebar from "./components/Sidebar";
import { URLProvider } from './components/URLContext';
import Performance from "./components/Performance";

function App() {
  const myUrl = "https://example.com";
  const [performanceData, setPerformanceData] = useState(null);
  useEffect(() => {
    // Function to fetch performance data
    const fetchPerformanceData = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/performance-results?url=${myUrl}&time=1h`);
            if (!response.ok) {
                throw new Error('Failed to fetch performance data');
            }
            const data = await response.json();
            setPerformanceData(data); // Assuming setPerformanceData is a setter function from useState
        } catch (err) {
            console.log(err.message);
        }
    };

    // Initial data fetch
    fetchPerformanceData();

    // Set up polling every 9 minutes (9 minutes = 540000 ms)
    const intervalId = setInterval(() => {
        fetchPerformanceData();
    }, 540000); // 540000 ms = 9 minutes

    // Clean up the interval on component unmount or dependency change
    return () => clearInterval(intervalId);

}, [myUrl]); 
  return (
  <div className="flex h-screen">
  <URLProvider value={myUrl} results={performanceData}>
    <DashboardSidebar />
    <div className="flex-grow ml-side mt-14 w-main">
                <Performance />
            </div>
  </URLProvider>
  </div>);
}

export default App;
