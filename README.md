# Hybrid Website Performance Tool

## Overview

The **Hybrid Website Performance Tool** is a web application built using the MERN stack (MongoDB, Express, React, Node.js) designed to analyze and optimize the performance of websites. This tool allows users to assess various performance metrics, including load times, responsiveness, and overall user experience.

## Features

- **Real-time Performance Analysis**: Monitor key performance indicators (KPIs) of your websites in real-time.
- **User-Friendly Dashboard**: Intuitive UI built with React for a seamless user experience.
- **Data Storage**: Performance metrics stored in MongoDB for easy access and retrieval.
- **RESTful API**: Backend services powered by Express and Node.js to handle requests and responses.
- **Multi-URL Testing**: Analyze multiple URLs simultaneously for comparative performance analysis.
- **Custom Reports**: Generate detailed performance reports that can be downloaded for offline analysis.

## Technologies Used

- **Frontend**: 
  - React
  - Tailwind CSS
  - Axios (for HTTP requests)
  - Tremor
  
- **Backend**: 
  - Node.js
  - Express.js
  - MongoDB (with Mongoose)
  - Lighthouse
  - Puppeteer
  - Zaproxy

- **DevOps**:
  - Git
  - GitHub (for version control)
  - AWS (for deployment)

## Installation

### Prerequisites

- Node.js and npm installed on your machine.
- MongoDB server running locally or access to a MongoDB Atlas account.

### Clone the Repository

    ```bash
    git clone https://github.com/prototypedave/hybrid-website-performance-tool.git
    cd hybrid-website-performance-tool
    ```

## Install Dependencies

Navigate to both the frontend and backend directories and install the required dependencies.

    ```bash
    # For the backend
    cd backend
    npm install

    # For the frontend
    cd ../frontend
    npm install
    ```