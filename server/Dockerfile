FROM node:18-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create the dist directory and ensure it exists
RUN mkdir -p dist

# Build TypeScript
RUN npm run build

EXPOSE 3009
CMD ["npm", "start"] 