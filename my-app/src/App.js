import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import { Features } from './components/Features.js';
import Pricing from './components/Pricing.js';
import {Login, Register} from './components/Login.js';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;
