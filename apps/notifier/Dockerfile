# Use Node.js official image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy everything from current directory to working directory
COPY . .

# Install PM2 globally
RUN npm install pm2 -g

# Install any needed packages specified in package.json
RUN npm install

RUN npm run build

# Start the applications with PM2
CMD ["pm2-runtime", "pm2.config.js"]