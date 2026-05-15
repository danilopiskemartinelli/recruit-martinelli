FROM node:20-alpine

WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY packages/types ./packages/types

# Copy web app
COPY apps/web/package*.json ./apps/web/

RUN npm install --legacy-peer-deps

COPY apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "dev"]
