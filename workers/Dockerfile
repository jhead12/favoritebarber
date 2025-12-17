FROM node:18-alpine

WORKDIR /usr/src/app

# Install Playwright dependencies (Chromium requires additional libs)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Playwright to use the system chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci --silent

COPY . .

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
