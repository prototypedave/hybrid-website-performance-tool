FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Serve the app using a simple HTTP server
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "build", "-l", "3000", "start"]