# Multi-stage Dockerfile for PayFlow React Frontend
# Stage 1: Build production bundle
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx unprivileged
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (non-root standard for nginx-unprivileged)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
