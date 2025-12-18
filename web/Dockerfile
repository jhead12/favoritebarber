FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --silent || npm install --silent

# Install curl for debugging inside the container
RUN apk add --no-cache curl

COPY . .

ENV NODE_ENV=development
EXPOSE 3000

# Start Next.js and bind to 0.0.0.0 for container accessibility
CMD ["npx", "next", "dev", "-p", "3001", "-H", "0.0.0.0"]
