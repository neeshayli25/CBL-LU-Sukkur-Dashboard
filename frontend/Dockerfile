FROM node:18-alpine

WORKDIR /app

COPY package*.json turbo.json ./
COPY apps/management-dashboard/package.json apps/management-dashboard/
COPY packages/ packages/

RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]
