FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Copy only api package files and install dependencies
COPY api/package*.json ./
RUN apt-get update \
 && apt-get install -y build-essential python3 --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* \
 && npm ci --silent

# Copy api source and workers into the image so runtime requires resolve
COPY api/ ./
RUN echo "build-ts=$(date +%s)" > /tmp/.docker_cache_bust
COPY workers/ ./workers/

ENV NODE_ENV=development
EXPOSE 3000

# Start the API startup script - keep workdir at /usr/src/app so relative paths resolve
WORKDIR /usr/src/app
CMD ["node", "api/startup.js"]
