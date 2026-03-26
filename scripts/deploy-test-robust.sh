#!/bin/bash

# =============================================================================
# Robust Deployment Script for East App Test Environment
# =============================================================================
# This script performs a clean build with stale cache prevention and verifies
# the Nginx configuration for serving static chunks correctly.
#
# Usage: ./scripts/deploy-test-local.sh
# =============================================================================

set -e  # Exit on error

# Configuration
APP_NAME="EastAppTest"
PORT=3001
BUILD_DIR=".next"
ENV_FILE=".env.test"
NGINX_SITE="eastapp-test"
DOMAIN="test.eastapp.booking.dynevents.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# =============================================================================
# STEP 1: Verify Nginx Configuration
# =============================================================================
verify_nginx_config() {
    log "Step 1: Verifying Nginx configuration..."
    
    NGINX_CONF_PATH="/etc/nginx/sites-available/${NGINX_SITE}"
    
    if [ ! -f "$NGINX_CONF_PATH" ]; then
        error "Nginx config not found at $NGINX_CONF_PATH"
        log "Creating Nginx configuration..."
        
        sudo tee "$NGINX_CONF_PATH" << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static assets from Next.js build - CRITICAL for ChunkLoadError fix
    # Serve files directly from the build directory without proxying to Node.js
    location /_next/static/ {
        alias /var/www/${DOMAIN}/${BUILD_DIR}/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # Ensure correct MIME types
        include /etc/nginx/mime.types;
        
        # Handle gzip pre-compressed files if they exist
        gzip_static on;
        
        # If file not found, return 404 immediately (don't proxy)
        try_files \$uri =404;
    }

    # Public static files (if any)
    location /public/ {
        alias /var/www/${DOMAIN}/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Favicon and other root static files
    location ~* \.(ico|png|svg|webmanifest)$ {
        root /var/www/${DOMAIN}/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files \$uri =404;
    }

    # Prevent caching of HTML and dynamic content
    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Critical: Prevent caching of HTML which may contain old chunk references
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        expires off;
    }
}
EOF
        
        # Enable the site
        sudo ln -sf "$NGINX_CONF_PATH" "/etc/nginx/sites-enabled/${NGINX_SITE}"
        success "Nginx configuration created and enabled"
    else
        # Check if the config has the required static file alias
        if grep -q "alias.*${BUILD_DIR}/static" "$NGINX_CONF_PATH"; then
            success "Nginx config already has correct static file alias"
        else
            warn "Nginx config missing correct static file alias for ${BUILD_DIR}"
            log "Please update your Nginx configuration manually or run with --fix-nginx"
            log "Expected alias path: /var/www/${DOMAIN}/${BUILD_DIR}/static/"
        fi
    fi
    
    # Test Nginx configuration
    log "Testing Nginx configuration..."
    if sudo nginx -t; then
        success "Nginx configuration is valid"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
}

# =============================================================================
# STEP 2: Clean Build Process
# =============================================================================
clean_build() {
    log "Step 2: Performing clean build..."
    
    # Stop PM2 process
    log "Stopping PM2 process: ${APP_NAME}..."
    pm2 delete "${APP_NAME}" 2>/dev/null || true
    
    # Kill any process on the port (nuclear option)
    log "Killing any processes on port ${PORT}..."
    sudo fuser -k ${PORT}/tcp 2>/dev/null || true
    
    # Clean up old build directory
    log "Removing old build directory: ${BUILD_DIR}..."
    rm -rf "${BUILD_DIR}"
    
    # Also clean default .next to prevent confusion
    rm -rf ".next"
    
    # Clean npm cache if needed
    log "Cleaning npm cache..."
    npm cache clean --force 2>/dev/null || true
    
    # Install dependencies
    log "Installing dependencies..."
    npm install
    
    # Build with standard directory
    log "Building application..."
    NEXT_TELEMETRY_DISABLED=1 npm run build
    
    # Verify build output
    if [ ! -d "${BUILD_DIR}/static" ]; then
        error "Build failed: ${BUILD_DIR}/static directory not found"
        exit 1
    fi
    
    success "Build completed successfully to ${BUILD_DIR}"
    
    # Show build info
    log "Build output:"
    ls -la "${BUILD_DIR}/"
    log "Static files:"
    ls -la "${BUILD_DIR}/static/" | head -20
}

# =============================================================================
# STEP 3: Verify Static File Paths
# =============================================================================
verify_static_paths() {
    log "Step 3: Verifying static file paths..."
    
    # Check that critical static directories exist
    if [ ! -d "${BUILD_DIR}/static/chunks" ]; then
        warn "chunks directory not found in build output"
    else
        success "Chunks directory exists"
    fi
    
    if [ ! -d "${BUILD_DIR}/static/media" ]; then
        warn "media directory not found (may be OK if no media assets)"
    else
        success "Media directory exists"
    fi
    
    # Count JS files to verify build completeness
    JS_COUNT=$(find "${BUILD_DIR}/static" -name "*.js" | wc -l)
    log "Found ${JS_COUNT} JavaScript files in static directory"
    
    if [ "$JS_COUNT" -eq 0 ]; then
        error "No JavaScript files found in build output!"
        exit 1
    fi
}

# =============================================================================
# STEP 4: Start Application
# =============================================================================
start_application() {
    log "Step 4: Starting application with PM2..."
    
    # Set correct permissions
    sudo chown -R www-data:www-data "/var/www/${DOMAIN}" 2>/dev/null || true
    sudo chmod -R 755 "/var/www/${DOMAIN}" 2>/dev/null || true
    
    # Start with PM2
    log "Starting ${APP_NAME}..."
    pm2 start ecosystem.config.js --only "${APP_NAME}" --update-env
    pm2 save
    
    # Wait a moment for the app to start
    sleep 3
    
    # Check if the process is running
    if pm2 describe "${APP_NAME}" | grep -q "online"; then
        success "Application ${APP_NAME} is running"
    else
        error "Application ${APP_NAME} failed to start"
        pm2 logs "${APP_NAME}" --lines 20
        exit 1
    fi
}

# =============================================================================
# STEP 5: Reload Nginx with Cache Busting
# =============================================================================
reload_nginx() {
    log "Step 5: Reloading Nginx with cache clearing..."
    
    # Clear any Nginx cache if using proxy_cache
    sudo find /var/cache/nginx -type f -delete 2>/dev/null || true
    
    # Reload Nginx
    if sudo systemctl reload nginx || sudo service nginx reload; then
        success "Nginx reloaded successfully"
    else
        warn "Nginx reload may have failed, trying restart..."
        sudo systemctl restart nginx || sudo service nginx restart
    fi
}

# =============================================================================
# STEP 6: Verify Deployment
# =============================================================================
verify_deployment() {
    log "Step 6: Verifying deployment..."
    
    # Wait for app to be ready
    sleep 5
    
    # Test if the application is responding
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT} | grep -q "200\|307\|301"; then
        success "Application is responding on port ${PORT}"
    else
        warn "Application may not be responding correctly on port ${PORT}"
        log "Checking PM2 logs..."
        pm2 logs "${APP_NAME}" --lines 10
    fi
    
    # Test a static chunk URL (if we can find one)
    SAMPLE_CHUNK=$(find "${BUILD_DIR}/static" -name "*.js" -type f | head -1 | sed "s|${BUILD_DIR}/static||")
    if [ -n "$SAMPLE_CHUNK" ]; then
        log "Testing static file serving for: _next/static${SAMPLE_CHUNK}"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/_next/static${SAMPLE_CHUNK}")
        if [ "$HTTP_CODE" = "200" ]; then
            success "Static files are being served correctly (HTTP ${HTTP_CODE})"
        elif [ "$HTTP_CODE" = "404" ]; then
            warn "Static files returning 404 - Nginx alias may be misconfigured"
        else
            warn "Static files returned HTTP ${HTTP_CODE}"
        fi
    fi
}

# =============================================================================
# Main Execution
# =============================================================================
main() {
    log "==================================================================="
    log "East App Test Environment Deployment"
    log "==================================================================="
    log "App Name: ${APP_NAME}"
    log "Port: ${PORT}"
    log "Build Directory: ${BUILD_DIR}"
    log "Domain: ${DOMAIN}"
    log "==================================================================="
    
    # Check if running as root (not recommended)
    if [ "$EUID" -eq 0 ]; then
        warn "Running as root is not recommended"
    fi
    
    # Verify we're in the right directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Run deployment steps
    verify_nginx_config
    clean_build
    verify_static_paths
    start_application
    reload_nginx
    verify_deployment
    
    log "==================================================================="
    success "Deployment completed successfully!"
    log "==================================================================="
    log "Application: http://${DOMAIN}"
    log "Local test:  http://localhost:${PORT}"
    log "PM2 status:  pm2 status"
    log "Logs:        pm2 logs ${APP_NAME}"
    log "==================================================================="
}

# Handle script arguments
case "${1:-}" in
    --fix-nginx)
        log "Forcing Nginx configuration update..."
        sudo rm -f "/etc/nginx/sites-available/${NGINX_SITE}"
        main
        ;;
    --build-only)
        log "Running build only..."
        clean_build
        verify_static_paths
        ;;
    --restart-only)
        log "Restarting only..."
        start_application
        reload_nginx
        verify_deployment
        ;;
    *)
        main
        ;;
esac
