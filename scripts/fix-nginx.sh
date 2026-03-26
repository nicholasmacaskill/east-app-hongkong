#!/bin/bash
# Run this on your VPS with: sudo bash fix-nginx.sh

echo "Updating Nginx configuration for eastapp-test..."

sudo tee /etc/nginx/sites-available/eastapp-test << 'EOF'
server {
    listen 80;
    server_name test.eastapp.booking.dynevents.com;

    location /_next/static/ {
        alias /var/www/test.eastapp.booking.dynevents.com/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        gzip_static on;
        try_files $uri =404;
    }

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
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        expires off;
    }
}
EOF

echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx updated successfully!"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi
