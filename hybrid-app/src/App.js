import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import Dashboard from './Dashboard.js';
import Networks from './Network';
import Performance from './Performance';
import Security from './Security.js';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path='/networks' element={<Networks />} />
        <Route path='/performance' element={<Performance />} />
        <Route path="/security" element={<Security />} />
      </Routes>
    </div>
  );
}

export default App;