# Use an official Node.js runtime as a parent image
FROM node:14-alpine

# Install Git
RUN apk add --no-cache git

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm cache clean -f
RUN rm -rf node_modules
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 8080
EXPOSE 4001

# Set environment variable for the port
ENV PORT=4001

# Start the application
CMD ["npm", "start"]
