FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose server port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]
