# ============================================================
# SokoMkononi Frontend — multi-stage build
#
# Vite bakes VITE_* vars into the JS bundle at BUILD time.
# We forward them via ARG → ENV before `npm run build`.
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

# ── Build-time env (Vite reads these during `npm run build`)
ARG VITE_API_BASE_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_APPLE_CLIENT_ID=""
ARG VITE_APPLE_REDIRECT_URI=""
ARG VITE_TURNSTILE_SITE_KEY=""
ARG VITE_ADMIN_PATH=""
ARG VITE_FACEBOOK_APP_ID=""
ARG VITE_CREDITS_CONSUME_PATH=""

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID
ENV VITE_APPLE_REDIRECT_URI=$VITE_APPLE_REDIRECT_URI
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_ADMIN_PATH=$VITE_ADMIN_PATH
ENV VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID
ENV VITE_CREDITS_CONSUME_PATH=$VITE_CREDITS_CONSUME_PATH

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ============================================================
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3001
CMD ["nginx", "-g", "daemon off;"]
