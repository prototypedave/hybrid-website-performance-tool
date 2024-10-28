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

## Set Up Environment Variables

Create a .env file in the backend directory and add your MongoDB connection string and any other required environment variables:

```bash
    MONGO_URI=your_mongodb_connection_string
    PORT=5000
```

## Start the Application

Run the backend server:

```bash
    cd backend
    npm start
```

Run the frontend application in another terminal:

```bash
    cd frontend
    npm start
```

## Access the Application

Open your web browser and navigate to http://localhost:3000 to access the Hybrid Website Performance Tool.

## Usage

   1. Enter the URLs of the websites you want to analyze in the input field.
   2. Click the "Analyze" button to start the performance analysis.
   3. Review the performance metrics displayed on the dashboard.
   4. Download reports for further analysis if needed.

## Contributing

Contributions are welcome! If you’d like to contribute, please fork the repository and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

### Steps to Contribute

    1. Fork the repository.
    2. Create your feature branch:

    ```bash
        git checkout -b feature/YourFeature
    ```

    3. Commit your changes

    ```bash
        git commit -m 'Add some feature'
    ```

    4. Push to the branch

    ```bash
        git push origin feature/YourFeature
    ```

    5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/license/mit) file for details.