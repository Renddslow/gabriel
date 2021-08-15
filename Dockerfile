FROM node:14.17-alpine AS build

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn
COPY . .
RUN yarn build

FROM node:14.17-alpine

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --production

COPY --from=build /usr/src/app/dist dist

EXPOSE 8080
CMD ["yarn", "start"]
