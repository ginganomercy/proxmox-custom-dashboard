# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Add custom nginx config for SPA routing (fallback to index.html)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(svg)$ { \
        root /usr/share/nginx/html; \
        try_files $uri =404; \
        expires -1; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ { \
        root /usr/share/nginx/html; \
        try_files $uri =404; \
        expires 1y; \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
