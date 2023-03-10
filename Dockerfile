# First stage: Build the TypeScript code
FROM node:16 as builder

WORKDIR /app

COPY ./package.json yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn build

# Second stage: Create the runtime image
FROM node:16

WORKDIR /app

COPY ./package.json yarn.lock ./

RUN yarn install --prod

COPY --from=builder /app/dist ./dist

RUN sed '1361i\    this.configureNetworking();' -i node_modules/@discordjs/voice/dist/index.js

CMD yarn docker