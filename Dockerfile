# Base
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./

# Dev deps
FROM base AS dev
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
EXPOSE 3000
CMD [ "npm", "run", "dev" ]

# Build
FROM base AS build
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prod runtime
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD [ "npm", "start" ]

