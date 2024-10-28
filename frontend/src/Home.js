import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Divider, TextInput } from '@tremor/react';
import { Helmet } from 'react-helmet';

function Home() {
    const [urls, setUrls] = useState('');
    const navigate = useNavigate();
  
    const processUrls = (value) => {
      if (!value) {
        return { message: "No URLs provided" };
      }
  
      const validatedUrls = value
        .split("\n")
        .reduce((urls, split) => urls.concat(split.split(",")), [])
        .map(url => url.trim())
        .map(url => {
          try {
            const instance = new URL(url);
            if (!instance.origin || !instance.protocol) {
              return false;
            }
            return instance.toString();
          } catch (e) {
            return false;
          }
        });
  
      if (validatedUrls.includes(false)) {
        return { message: "One or more URLs provided are not valid" };
      }
  
      return { validUrls: validatedUrls };
    };
  
    const handleScheduleClick = () => {
      const result = processUrls(urls);
      if (result.message) {
        alert(result.message);
        return;
      }
  
      const { validUrls } = result; 
      setUrls('');
      navigate('/dashboard', { state: { urls: validUrls } });
    };  

  return (
    <main className='h-screen bg-slate-100'>
        <Helmet>
            <title>Website Analyzer Tool - Analyze your website</title>
            <meta name="description" content="A tool to analyze your website performance, network diagnostics, and security." />
            <meta name="keywords" content="website analyzer, performance, network diagnostics, security, LCP, FCP, CLS" />
            <meta property="og:title" content="Hybrid Website Analyzer Tool" />
            <meta property="og:description" content="Analyze your website for performance, network diagnostics, and security insights." />

            <meta property="og:type" content="website" />
        </Helmet>

        <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6 font-serif">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm bg-slate-200 p-8 rounded-md">
                <h3 className="text-center text-tremor-title font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    HYBRID WEBSITE ANAYLZER TOOL 
                </h3>
                <form action="#" method="post" className="mt-6 space-y-4">
                    <div>
                        <Divider>Enter Url Below</Divider>
                        <TextInput
                            id="urls"
                            name="urls"
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            placeholder="https://example.com"
                            className="mt-2"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-4 w-1/3 whitespace-nowrap rounded-tremor-default bg-tremor-brand py-2 text-center text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
                        onClick={handleScheduleClick}
                    >
                        Analyze
                    </button>
                </form>
                <Divider>what it does</Divider>
                <ol className='text-left ml-4 list-decimal'>
                    <li className="mt-4 ml-4 text-tremor-content dark:text-dark-tremor-content text-sm">
                        Website performance: 
                        <span className='ml-1'><Badge className='text-tremor-content dark:text-dark-tremor-content text-sm'>LCP</Badge></span>
                        <span className='ml-1'><Badge className='text-tremor-content dark:text-dark-tremor-content text-sm'>FCP</Badge></span>
                        <span className='ml-1'><Badge className='text-tremor-content dark:text-dark-tremor-content text-sm'>CLS</Badge></span>  
                    </li>
                    <li className="mt-4 ml-4 text-tremor-content dark:text-dark-tremor-content text-sm">
                        Network diagnostics: 
                        <span className='ml-1'><Badge className='text-tremor-content dark:text-dark-tremor-content text-sm'>Ping</Badge></span>
                        <span className='ml-1'><Badge className='text-tremor-content dark:text-dark-tremor-content text-sm'>TraceRoute</Badge></span>
                        <span className='ml-1'><Badge className='text-tremor-content dark:text-dark-tremor-content text-sm'>SSL</Badge></span>  
                    </li>
                    <li className="mt-4 ml-4 text-tremor-content dark:text-dark-tremor-content text-sm">
                        Security:
                        <span className='ml-1'><Badge className='text-tremor-content dark:text-dark-tremor-content text-sm'>ZAProxy</Badge></span>
                    </li>
                </ol>
            </div>
        </div>
        
    </main>
    
  );
}



export default Home;
