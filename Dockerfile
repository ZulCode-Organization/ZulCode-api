# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies and generate Prisma client
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/@prisma/client/.prisma/client

EXPOSE 3001
ENV NODE_ENV=production
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
