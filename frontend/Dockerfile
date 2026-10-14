# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .

# ⬇️ MUHIMU: Weka NODE_ENV=production ili Vite isome .env.production
ENV NODE_ENV=production

ARG VITE_API_BASE_URL=https://api.sokomkononi.co.tz/api
ARG VITE_ADMIN_PATH=/smk-control-9x7k
ARG VITE_APPLE_REDIRECT_URI
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APPLE_CLIENT_ID
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_FACEBOOK_APP_ID
ARG VITE_CREDITS_CONSUME_PATH

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ADMIN_PATH=$VITE_ADMIN_PATH
ENV VITE_APPLE_REDIRECT_URI=$VITE_APPLE_REDIRECT_URI
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID
ENV VITE_CREDITS_CONSUME_PATH=$VITE_CREDITS_CONSUME_PATH

RUN rm -rf /app/dist /app/node_modules/.vite && npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
