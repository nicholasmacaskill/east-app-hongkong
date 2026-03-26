module.exports = {
  apps: [
    {
      name: 'EastApp',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/var/www/eastapp.booking.dynevents.com',
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_STRIPE_MODE: 'live',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'EastAppTest',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/var/www/test.eastapp.booking.dynevents.com',
      env_file: '.env.test',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_STRIPE_MODE: 'test',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
