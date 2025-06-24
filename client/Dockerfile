FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

FROM nginx:1.23-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/conf.d/

RUN apk add --no-cache openssl && \
    openssl dhparam -out /etc/nginx/dhparam.pem 2048