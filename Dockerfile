# Build frontend
FROM node:18-alpine AS build-frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
COPY frontend/ ./frontend/
RUN cd frontend && npm ci && npm run build

# Build backend
FROM node:18-alpine AS build-backend
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./backend/
COPY backend/ ./backend/
# Copy built frontend into backend
COPY --from=build-frontend /app/frontend/dist ./frontend/dist
RUN cd backend && npm ci --production

# Final image
FROM node:18-alpine
WORKDIR /app
COPY --from=build-backend /app/backend ./backend
COPY --from=build-backend /app/frontend/dist ./frontend/dist
WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "index.js"]
