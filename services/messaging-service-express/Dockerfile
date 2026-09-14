FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# prisma generate (Prisma 7 config loader) требует резолвящийся DATABASE_URL
# даже без реального подключения — реальное значение подставляется в рантайме
# через compose.yaml и перекрывает эту заглушку
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
