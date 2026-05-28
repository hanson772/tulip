# Stage 1: Build frontend
FROM node:24-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
ARG VUE_APP_API_URL=/api
ENV VUE_APP_API_URL=$VUE_APP_API_URL
RUN npm run build

# Stage 2: Backend with static files
FROM node:24-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ .
COPY --from=frontend /app/dist /app/public
EXPOSE 5000
VOLUME /app/data
CMD ["node", "server.js"]
