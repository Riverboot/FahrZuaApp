# Use an official Node.js 20 runtime as a parent image (Alpine for smaller size)
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Install dependencies needed for 'sharp' and potentially other native modules
# python3, make, g++ are common requirements for node-gyp
RUN apk add --no-cache build-base python3

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies using npm ci for potentially faster/more reliable installs
# If package-lock.json isn't present, use npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# The rest of the application code will be mounted via docker-compose volume
# COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run the app (will be overridden by docker-compose command in dev)
CMD ["npm", "run", "start"]
