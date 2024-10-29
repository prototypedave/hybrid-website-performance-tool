import React, { useState } from 'react';
import Navbar from './components/Navbar';
import { WelcomeSection } from './components/Sections';

function Home () {
    return (
        <>
            <Navbar />
            <WelcomeSection />
            
        </>
    );
}

export default Home;