#!/bin/bash
# ThreatPulse Deployment Script for Azure Linux Virtual Machine (Ubuntu)
# Run with: sudo bash deploy_azure.sh

set -e

echo "=========================================="
echo "   ThreatPulse Azure Deployment Script    "
echo "=========================================="

# 1. Update and install packages
echo "[*] Updating apt packages..."
apt-get update -y
apt-get install -y python3 python3-pip python3-venv nginx curl git

# 2. Install Node.js (NodeSource) if not installed
if ! command -v node &> /dev/null; then
    echo "[*] Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 3. Setup folders
PROJECT_DIR="/opt/threatpulse"
echo "[*] Creating project directory at $PROJECT_DIR..."
mkdir -p $PROJECT_DIR
cp -r . $PROJECT_DIR
cd $PROJECT_DIR

# 4. Configure Backend environment
echo "[*] Configuring Python Virtual Environment..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# 5. Build Frontend
echo "[*] Building React Vite Frontend..."
npm install
npm run build

# 6. Configure Nginx
echo "[*] Configuring Nginx Web Server..."
NGINX_CONF="/etc/nginx/sites-available/threatpulse"
cat << 'EOF' > $NGINX_CONF
server {
    listen 80;
    server_name _;

    root /opt/threatpulse/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:8000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable configuration and restart Nginx
rm -f /etc/nginx/sites-enabled/default
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
systemctl restart nginx

# 7. Configure Backend systemd Service
echo "[*] Creating systemd service for ThreatPulse backend..."
SERVICE_FILE="/etc/systemd/system/threatpulse-backend.service"
cat << EOF > $SERVICE_FILE
[Unit]
Description=ThreatPulse SIEM FastAPI Backend
After=network.target

[Service]
User=root
WorkingDirectory=/opt/threatpulse/backend
ExecStart=/opt/threatpulse/backend/venv/bin/python -m uvicorn main:socket_app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload and enable service
systemctl daemon-reload
systemctl enable threatpulse-backend
systemctl start threatpulse-backend

echo "=========================================="
echo "   Deployment Complete!                  "
echo "   Server URL: http://<Your-Azure-IP>/   "
echo "=========================================="
