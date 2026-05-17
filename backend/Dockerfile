FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -S medai && adduser -S medai -G medai
USER medai

EXPOSE 4000

CMD ["node", "src/server.js"]
