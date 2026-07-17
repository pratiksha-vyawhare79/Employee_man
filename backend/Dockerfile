# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env* ./
EXPOSE 5000
CMD ["npm", "start"]
