FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --silent || npm install --silent

COPY . .

ENV NODE_ENV=development
EXPOSE 3000

CMD ["npm", "run", "dev"]
