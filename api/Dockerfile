FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source
COPY . .

ENV NODE_ENV=development
EXPOSE 3000

# Start helper will wait for Postgres, run migrations, then start the API
CMD ["node", "startup.js"]
