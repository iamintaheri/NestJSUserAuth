FROM node:lts AS builder
WORKDIR /app
COPY ./package.json /app

RUN npm install
COPY . .
RUN npm run build


CMD ["node", "dist/main"]
