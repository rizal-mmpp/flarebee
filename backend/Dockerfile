
# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's source code from your context
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run your app
CMD [ "npm", "start" ]
