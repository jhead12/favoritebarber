FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Install dependencies (build tools for native modules), then install npm deps
COPY package*.json ./
RUN apt-get update \
 && apt-get install -y build-essential python3 --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* \
 && npm ci --silent

# Copy source
COPY . .

ENV NODE_ENV=development
EXPOSE 3000

# Start helper will wait for Postgres, run migrations, then start the API
CMD ["node", "startup.js"]
