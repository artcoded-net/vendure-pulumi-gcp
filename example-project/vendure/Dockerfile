FROM node:lts
WORKDIR /usr/src/app

COPY package.json ./
RUN yarn
COPY . .
RUN chmod +x ./wait-for-it.sh
RUN yarn build