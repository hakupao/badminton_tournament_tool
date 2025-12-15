
# Stage 1: Build Frontend (with Local Server Config)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
# Bake in the configuration for Local Mode
ENV VITE_USE_LOCAL_SERVER=true
ENV VITE_API_ENDPOINT=/api
RUN npm run build

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server ./
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine
WORKDIR /app

# Copy Server Dependencies and Built Code
COPY --from=server-builder /app/server/package*.json ./
RUN npm ci --only=production
COPY --from=server-builder /app/server/dist ./dist

# Copy Frontend Build to public folder for serving
COPY --from=frontend-builder /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
