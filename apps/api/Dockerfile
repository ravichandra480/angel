FROM node:alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY dist/apps/api /usr/src/app

RUN npm install

EXPOSE 3000

CMD [ "node", "/usr/src/app/main.js" ]
