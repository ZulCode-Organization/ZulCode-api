# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build NestJS
RUN npm run build


# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci

# Application files
COPY --from=builder /app/dist ./dist

# Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Prisma Client
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "echo DATABASE_URL=$DATABASE_URL && npx prisma migrate deploy"]