FROM node:18-alpine

WORKDIR /app

# Copy package.json dan package-lock.json dari panel-backend
COPY panel-backend/package*.json ./

RUN npm install

# Copy semua file backend
COPY panel-backend/ .

# Expose port (Railway akan memberi port melalui ENV)
EXPOSE 3000

# Jalankan server
CMD ["npm", "start"]
