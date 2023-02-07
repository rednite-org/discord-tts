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

CMD yarn docker