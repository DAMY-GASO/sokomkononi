# ============================================================
# Stage 1: Build ya React (Vite)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .

ENV VITE_API_BASE_URL=/api
RUN npm run build

# ============================================================
# Stage 2: Serve kwa Nginx
# ============================================================
FROM nginx:alpine

# Silence the nginx entrypoint banner + ipv6 script info logs
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
