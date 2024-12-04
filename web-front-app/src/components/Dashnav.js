import { useURL } from './URLContext.js';
import React, { useState } from 'react';

function Dashbar() {
    const [isExpanded, setIsExpanded] = useState(false); 
    const url = useURL();

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className='fixed font-serif'>
            {/* Navbar */}
            <div className='bg-navbar-bg w-screen h-14 shadow-lg hover:bg-nav-focus'>
                <div className='flex flex-row p-2 gap-4'>
                    <img src='vbsap.png' className='h-8 w-8 ml-2' alt='logo' />
                    <h1 className='uppercase text-nav-text pt-1'>
                        <a href={url} className='hover:text-nav-hover'>{url}</a>
                    </h1>
                </div>
            </div>
        </div>
    );
}

export default Dashbar;
