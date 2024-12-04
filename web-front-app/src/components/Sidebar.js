import { useURL } from './URLContext.js';
import React, { useState } from 'react';
import { MdWidgets } from 'react-icons/md';
import { FaChartLine, FaShieldAlt, FaRobot, FaQuestionCircle, FaCog, FaUserCircle } from 'react-icons/fa';
import {  FaCaretDown, FaCaretUp} from "react-icons/fa";
import { HiLogout } from "react-icons/hi";

function DashboardSidebar() {
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

            <div className='bg-sidebar-bg w-side h-screen shadow-2xl'>
                <button onClick={toggleExpand} className='flex items-center justify-between w-full p-4 text-left text-side-text hover:bg-side-hover focus:bg-side-hover'>
                    <div className='flex flex-row gap-2 text-base font-semibold'>
                        <MdWidgets size={20} />
                        <h3>Dashboard</h3>
                    </div>
                    {isExpanded ? <FaCaretUp /> : <FaCaretDown />}
                </button>

                {isExpanded && (
                    <div className='flex flex-col gap-2 p-4'>
                        <button className='flex flex-row gap-2 ml-6 pl-2 text-side-link hover:bg-side-hover focus:bg-side-focus'>
                            <FaChartLine size={20}/>
                            Performance
                        </button>
                        <button className='flex flex-row gap-2 ml-6 pl-2 text-side-link hover:bg-side-hover focus:bg-side-focus'>
                            <FaShieldAlt size={20}/>
                            Security
                        </button>
                        <button className='flex flex-row gap-2 ml-6 pl-2 text-side-link hover:bg-side-hover focus:bg-side-focus'>
                            <FaRobot size={20}/>
                            AI Alerts
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardSidebar;

