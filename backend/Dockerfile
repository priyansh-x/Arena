FROM node:22-slim

# openssl needed by Prisma engines
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# full install: prisma CLI + dotenv are needed at runtime for migrate deploy
COPY package*.json ./
RUN npm ci || npm install

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

# apply migrations then boot API + inline engine
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
