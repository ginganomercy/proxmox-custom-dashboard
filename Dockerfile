# Build Stage
FROM node:22-alpine AS build

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

# Production-grade Nginx config with split cache strategy:
#   /assets/*  → Vite content-hashed files → 1 year immutable (safe: hash = unique per content)
#   /favicon.svg, /index.html, /*.ico → public/ files without hash → always revalidate
#   /*.js, /*.css in /assets/ → covered by the /assets/ block above
RUN printf 'server {\n\
    listen 80;\n\
\n\
    # SPA fallback — serve index.html for all unknown routes\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
        # index.html must never be cached\n\
        add_header Cache-Control "no-cache, must-revalidate";\n\
    }\n\
\n\
    # Vite hashed assets (/assets/name.HASH.ext) — safe to cache forever\n\
    location /assets/ {\n\
        root /usr/share/nginx/html;\n\
        try_files $uri =404;\n\
        expires 1y;\n\
        add_header Cache-Control "public, max-age=31536000, immutable";\n\
    }\n\
\n\
    # Public root files: favicon.svg, robots.txt etc. — NO hash, must revalidate\n\
    location ~* ^/(favicon\\.svg|favicon\\.ico|robots\\.txt|site\\.webmanifest)$ {\n\
        root /usr/share/nginx/html;\n\
        try_files $uri =404;\n\
        expires -1;\n\
        add_header Cache-Control "no-cache, must-revalidate";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
