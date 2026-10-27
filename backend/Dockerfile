FROM node:22-alpine

# Prisma's query engine needs OpenSSL on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Full install: the prisma CLI (a devDependency) is required for `prisma generate`
RUN npm ci && npx prisma generate

COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["node", "src/server.js"]
