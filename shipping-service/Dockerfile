FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# No external HTTP port needed for core logic, but expose health check port if any
EXPOSE 3001

CMD ["node", "src/index.js"]
