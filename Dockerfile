# Build Stage
FROM salesloft/node:16.14.2-alpine AS builder
LABEL MAINTAINER=SalesLoft

RUN mkdir /app
WORKDIR /app

COPY package-lock.json package.json /app/
RUN npm install

# Deploy Stage
FROM salesloft/node:16.14.2-alpine
LABEL MAINTAINER=SalesLoft

RUN mkdir /app
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 8080
CMD ["node", "index.js"]