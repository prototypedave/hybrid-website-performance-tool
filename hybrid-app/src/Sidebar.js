import React from 'react';
import { AiOutlineGlobal } from "react-icons/ai";
import { MdSecurity } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

function Sidebar({ url }) {
    const navigate = useNavigate();

    const handleNavigation = (href, replace = false) => {
        navigate(href, { state: { urls: url }, replace });
    }

    return (
        <div className='font-serif'>
            <button 
                data-drawer-target="default-sidebar" 
                data-drawer-toggle="default-sidebar" 
                aria-controls="default-sidebar" 
                type="button" 
                className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            >
                <span className="sr-only">Open sidebar</span>
                <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                </svg>
            </button>

            <aside id="default-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 bg-gray-200" aria-label="Sidebar">
                <div className="h-full px-3 py-4 overflow-y-auto bg-gray-100 dark:bg-gray-800">
                    <ul className="space-y-2 font-medium">
                        <li>
                            <a onClick={() => handleNavigation('/dashboard')} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group ml-2">
                                <svg className="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
                                    <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
                                    <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
                                </svg>
                                <span className="ms-5">{new URL(url).hostname}</span>
                            </a>
                        </li>
                        <li>
                            <a onClick={() => handleNavigation('/performance')} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                <AiOutlineGlobal style={{ fontSize: '24px' }}/>
                                <span className="flex-1 whitespace-nowrap">Performance Metrics</span>
                            </a>
                        </li>
                        <li>
                            <a onClick={() => handleNavigation('/networks')} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path fill="currentColor" d="M8 1V0v1Zm4 0V0v1Zm2 4v1h1V5h-1ZM6 5H5v1h1V5Zm2-3h4V0H8v2Zm4 0a1 1 0 0 1 .707.293L14.121.879A3 3 0 0 0 12 0v2Zm.707.293A1 1 0 0 1 13 3h2a3 3 0 0 0-.879-2.121l-1.414 1.414ZM13 3v2h2V3h-2Zm1 1H6v2h8V4ZM7 5V3H5v2h2Zm0-2a1 1 0 0 1 .293-.707L5.879.879A3 3 0 0 0 5 3h2Zm.293-.707A1 1 0 0 1 8 2V0a3 3 0 0 0-2.121.879l1.414 1.414ZM2 6h16V4H2v2Zm16 0h2a2 2 0 0 0-2-2v2Zm0 0v12h2V6h-2Zm0 12v2a2 2 0 0 0 2-2h-2Zm0 0H2v2h16v-2ZM2 18H0a2 2 0 0 0 2 2v-2Zm0 0V6H0v12h2ZM2 6V4a2 2 0 0 0-2 2h2Zm16.293 3.293C16.557 11.029 13.366 12 10 12c-3.366 0-6.557-.97-8.293-2.707L.293 10.707C2.557 12.971 6.366 14 10 14c3.634 0 7.444-1.03 9.707-3.293l-1.414-1.414ZM10 9v2a2 2 0 0 0 2-2h-2Zm0 0H8a2 2 0 0 0 2 2V9Zm0 0V7a2 2 0 0 0-2 2h2Zm0 0h2a2 2 0 0 0-2-2v2Z"/>
                                </svg>
                                <span className="flex-1 whitespace-nowrap">Network Diagnostics</span>
                            </a>
                        </li>
                        <li>
                            <a onClick={() => handleNavigation('/security')} className="flex p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                <MdSecurity style={{ fontSize: '24px' }}/>
                                <span className="ms-7 whitespace-nowrap">Security Analysis</span>
                            </a>
                        </li>
                        <li>
                            <a onClick={() => handleNavigation('/', true)} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/>
                                </svg>
                                <span className="ms-8 whitespace-nowrap">Change URL</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </aside>
        </div>
    );
}

export default Sidebar;
