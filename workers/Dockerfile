FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --silent

COPY . .

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
