#!/bin/bash

# Script to SSH into server and run the setup
# Usage: ./scripts/deploy-to-server.sh [server-ip] [username]

SERVER_IP=${1:-"your-server-ip"}
USERNAME=${2:-"ubuntu"}

echo "Connecting to server at $SERVER_IP as $USERNAME..."

# Copy the setup script to the server
scp scripts/setup-environments.sh $USERNAME@$SERVER_IP:/tmp/

# SSH into server and run setup
ssh $USERNAME@$SERVER_IP << 'EOF'
    # Make the script executable
    chmod +x /tmp/setup-environments.sh
    
    # Run the setup script
    sudo /tmp/setup-environments.sh
    
    # Clean up
    rm /tmp/setup-environments.sh
EOF

echo "Server setup complete!"
