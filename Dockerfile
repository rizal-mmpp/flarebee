# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json to leverage Docker cache
COPY package.json ./

# Install app dependencies
RUN npm install

# The application's code will be mounted as a volume in docker-compose.yml
# No need to COPY the rest of the source code here for development.

# The app will run on port 9002 as per the dev script
EXPOSE 9002

# Command to run the app
CMD ["npm", "run", "dev"]
