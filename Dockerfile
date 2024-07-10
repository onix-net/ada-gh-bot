FROM node:20

RUN mkdir -p /app
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .
RUN npm run build

ENV PORT=9100

CMD ["npm", "start"]
