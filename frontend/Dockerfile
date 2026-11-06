# ==========================================
# STAGE 1: BUILD
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (tumia --no-audit --no-fund kwa kasi)
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# ✅ Badilisha jina la ARG hapa pia
ARG VITE_API_BASE_URL=https://api.sokomkononi.co.tz/api
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_APPLE_CLIENT_ID=""
ARG VITE_APPLE_REDIRECT_URI=https://www.sokomkononi.co.tz/auth/apple/callback
ARG VITE_TURNSTILE_SITE_ID=""
ARG VITE_ADMIN_PATH=/smk-control-9x7k

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID
ENV VITE_APPLE_REDIRECT_URI=$VITE_APPLE_REDIRECT_URI
ENV VITE_TURNSTILE_SITE_ID=$VITE_TURNSTILE_SITE_ID
ENV VITE_ADMIN_PATH=$VITE_ADMIN_PATH

# Build
RUN npm run build

# ==========================================
# STAGE 2: PRODUCTION (Nginx)
# ==========================================
FROM nginx:1.27-alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]