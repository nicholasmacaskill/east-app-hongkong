#!/bin/bash

# Setup script for test and live environments on Singapore VPS

echo "Setting up East App deployment directories..."

# Create directories if they don't exist
sudo mkdir -p /var/www/eastapp.booking.dynevents.com
sudo mkdir -p /var/www/test.eastapp.booking.dynevents.com

# Set permissions
sudo chown -R nicholas:nicholas /var/www/eastapp.booking.dynevents.com
sudo chown -R nicholas:nicholas /var/www/test.eastapp.booking.dynevents.com

# Clone repositories if not already present
if [ ! -d "/var/www/eastapp.booking.dynevents.com/.git" ]; then
    echo "Cloning main branch for live environment..."
    cd /var/www/eastapp.booking.dynevents.com
    git clone git@github.com:nicholasmacaskill/east-app-hongkong.git .
    git checkout main
fi

if [ ! -d "/var/www/test.eastapp.booking.dynevents.com/.git" ]; then
    echo "Cloning test branch for test environment..."
    cd /var/www/test.eastapp.booking.dynevents.com
    git clone git@github.com:nicholasmacaskill/east-app-hongkong.git .
    git checkout test
fi

# Install dependencies for both environments
echo "Installing dependencies..."
cd /var/www/eastapp.booking.dynevents.com && npm install
cd /var/www/test.eastapp.booking.dynevents.com && npm install

# Setup PM2
echo "Setting up PM2 processes..."
pm2 start /var/www/eastapp.booking.dynevents.com/ecosystem.config.js

# Setup nginx configuration
echo "Setting up nginx configuration..."
sudo tee /etc/nginx/sites-available/eastapp-live << 'EOF'
server {
    listen 80;
    server_name eastapp.booking.dynevents.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo tee /etc/nginx/sites-available/eastapp-test << 'EOF'
server {
    listen 80;
    server_name test.eastapp.booking.dynevents.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable nginx sites
sudo ln -sf /etc/nginx/sites-available/eastapp-live /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/eastapp-test /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "Setup complete!"
echo "Live environment: http://eastapp.booking.dynevents.com"
echo "Test environment: http://test.eastapp.booking.dynevents.com"
