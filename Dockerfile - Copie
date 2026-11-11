FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
COPY package.json ./
COPY *.mjs ./
COPY public ./public
RUN mkdir -p /app/data
CMD ["node", "server.mjs"]
