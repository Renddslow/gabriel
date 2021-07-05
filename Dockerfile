FROM node:14.17-alpine AS build

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn
COPY . .
RUN yarn build

FROM node:14.17-alpine
RUN apk --no-cache add git openssh

ARG SSH_PRIVATE_KEY
RUN mkdir ~/.ssh/
RUN echo "${SSH_PRIVATE_KEY}" > ~/.ssh/id_ed22519
RUN chmod 600 ~/.ssh/id_ed22519
RUN ssh-keyscan github.com >> ~/.ssh/known_hosts

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --production

COPY --from=build /usr/src/app/dist dist

EXPOSE 8080
CMD ["yarn", "start:docker"]
