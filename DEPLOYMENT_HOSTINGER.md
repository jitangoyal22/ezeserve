# Deploying QR Restaurant Ordering System to Hostinger

## Prerequisites
- Hostinger VPS or Cloud Hosting plan
- Domain name (optional but recommended)
- SSH access to your server

## Step 1: Server Setup

### 1.1 Connect to your Hostinger server via SSH
```bash
ssh root@your-server-ip
```

### 1.2 Update system packages
```bash
apt update && apt upgrade -y
```

### 1.3 Install required dependencies
```bash
# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Python 3.11+
apt install -y python3 python3-pip python3-venv

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Install Nginx
apt install -y nginx

# Install Supervisor
apt install -y supervisor
```

## Step 2: Deploy Application

### 2.1 Clone or upload your code
```bash
cd /var/www
# Upload your code via FTP/SFTP or use git
git clone <your-repo-url> restaurant-qr
cd restaurant-qr
```

### 2.2 Setup Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="restaurant_qr_production"
CORS_ORIGINS="https://yourdomain.com"
EMERGENT_LLM_KEY="your-emergent-key-here"
JWT_SECRET="change-this-to-a-strong-random-secret"
FRONTEND_URL="https://yourdomain.com"
EOF
```

### 2.3 Setup Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create production .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://yourdomain.com
EOF

# Build for production
npm run build
```

## Step 3: Configure Nginx

Create Nginx configuration:
```bash
nano /etc/nginx/sites-available/restaurant-qr
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/restaurant-qr/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/restaurant-qr /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Step 4: Configure Supervisor for Backend

Create supervisor config:
```bash
nano /etc/supervisor/conf.d/restaurant-backend.conf
```

Add:
```ini
[program:restaurant-backend]
directory=/var/www/restaurant-qr/backend
command=/var/www/restaurant-qr/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/restaurant-backend.err.log
stdout_logfile=/var/log/restaurant-backend.out.log
environment=PATH="/var/www/restaurant-qr/backend/venv/bin"
```

Start the service:
```bash
supervisorctl reread
supervisorctl update
supervisorctl start restaurant-backend
```

## Step 5: Setup SSL with Let's Encrypt (Recommended)

```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

## Step 6: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Step 7: Test Deployment

1. Visit `https://yourdomain.com/admin/login`
2. Register admin account
3. Create restaurants and menu
4. Download QR codes
5. Test customer ordering flow

## Maintenance Commands

### View backend logs
```bash
tail -f /var/log/restaurant-backend.out.log
tail -f /var/log/restaurant-backend.err.log
```

### Restart backend
```bash
supervisorctl restart restaurant-backend
```

### Restart Nginx
```bash
systemctl restart nginx
```

### MongoDB backup
```bash
mongodump --db restaurant_qr_production --out /backups/$(date +%Y%m%d)
```

## Troubleshooting

### Backend not starting
- Check logs: `tail -f /var/log/restaurant-backend.err.log`
- Verify .env file exists and has correct values
- Check MongoDB is running: `systemctl status mongod`

### Frontend not loading
- Check Nginx config: `nginx -t`
- Verify build files exist: `ls /var/www/restaurant-qr/frontend/build`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`

### CORS errors
- Update `CORS_ORIGINS` in backend/.env with your domain
- Restart backend: `supervisorctl restart restaurant-backend`

## Security Best Practices

1. Change JWT_SECRET to a strong random value
2. Use strong MongoDB password (create admin user)
3. Keep system packages updated
4. Enable firewall (ufw)
5. Use SSL/TLS (Let's Encrypt)
6. Regular backups of MongoDB
7. Monitor logs for suspicious activity

## Performance Optimization

1. Enable Nginx gzip compression
2. Set up CDN for static assets (Cloudflare)
3. Configure MongoDB indexes for frequently queried fields
4. Use PM2 instead of supervisor for better process management (optional)
5. Monitor server resources (CPU, RAM, Disk)

## Support

For issues specific to this application, check:
- Backend logs: `/var/log/restaurant-backend.err.log`
- Nginx logs: `/var/log/nginx/error.log`
- MongoDB logs: `/var/log/mongodb/mongod.log`
