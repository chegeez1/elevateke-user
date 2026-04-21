# ElevateKe — Kenyan Investment & Earnings Platform

A full-stack investment platform built for the Kenyan market. Users deposit via M-Pesa (Paystack), earn daily returns, complete tasks, refer friends, and withdraw profits. Admins manage everything from a separate dashboard.

## What's Inside

| Package | Description |
|---|---|
| `artifacts/invest-platform` | User-facing React + Vite app |
| `artifacts/admin-dashboard` | Admin React + Vite dashboard |
| `artifacts/api-server` | Express + Drizzle ORM API (shared) |
| `lib/db` | PostgreSQL schema & migrations (Drizzle) |
| `lib/api-spec` | OpenAPI spec + codegen |
| `lib/api-client-react` | Generated React Query hooks |
| `lib/api-zod` | Generated Zod validation schemas |

---

## Prerequisites (VPS)

- Ubuntu 22.04 LTS (or similar)
- Node.js 20+
- pnpm 9+
- PostgreSQL 14+
- nginx
- PM2
- certbot (for SSL)

---

## 1 — Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install nginx
sudo apt install -y nginx
```

---

## 2 — Database Setup

```bash
sudo -u postgres psql

CREATE USER elevateke WITH PASSWORD 'your_secure_password';
CREATE DATABASE elevateke_db OWNER elevateke;
GRANT ALL PRIVILEGES ON DATABASE elevateke_db TO elevateke;
\q
```

---

## 3 — Clone & Install

```bash
cd /var/www
git clone https://github.com/chegeez1/elevateke-user.git elevateke
cd elevateke
pnpm install
```

---

## 4 — Environment Variables

Create `/var/www/elevateke/.env`:

```env
# Database
DATABASE_URL=postgresql://elevateke:your_secure_password@localhost:5432/elevateke_db

# Auth
SESSION_SECRET=your_64_char_random_secret_here

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# Paystack (M-Pesa STK Push)
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx

# Email (optional — for deposit confirmation emails)
SENDGRID_API_KEY=SG.xxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Ports — each service gets its own port
PORT_API=3001
PORT_USER=3002
PORT_ADMIN=3003
```

> **Tip:** Generate SESSION_SECRET with `openssl rand -hex 32`

---

## 5 — Push Database Schema

```bash
cd /var/www/elevateke/lib/db
pnpm run push
```

---

## 6 — Build All Artifacts

```bash
cd /var/www/elevateke

# Build shared libs first
pnpm --filter @workspace/db run build
pnpm --filter @workspace/api-zod run build
pnpm --filter @workspace/api-client-react run build

# Build frontends
pnpm --filter @workspace/invest-platform run build
pnpm --filter @workspace/admin-dashboard run build
```

---

## 7 — PM2 Process Manager

Create `/var/www/elevateke/ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name: 'elevateke-api',
      cwd: '/var/www/elevateke/artifacts/api-server',
      script: 'pnpm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: process.env.DATABASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
        PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      }
    },
    {
      name: 'elevateke-user',
      cwd: '/var/www/elevateke/artifacts/invest-platform',
      script: 'pnpm',
      args: 'run preview --port 3002 --host',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'elevateke-admin',
      cwd: '/var/www/elevateke/artifacts/admin-dashboard',
      script: 'pnpm',
      args: 'run preview --port 3003 --host',
      env: { NODE_ENV: 'production' }
    }
  ]
};
```

Make sure the api-server has a `start` script. Add to `artifacts/api-server/package.json`:

```json
"scripts": {
  "start": "node dist/index.js",
  "build": "tsc"
}
```

Build the API:

```bash
cd /var/www/elevateke/artifacts/api-server
pnpm run build
```

Start everything:

```bash
cd /var/www/elevateke
# Load .env into the current shell first
export $(cat .env | grep -v '#' | xargs)
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

---

## 8 — nginx Reverse Proxy

### User Platform — `yourdomain.com`

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # User-facing frontend
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API (shared by both frontends)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Admin Dashboard — `admin.yourdomain.com`

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configs:

```bash
sudo ln -s /etc/nginx/sites-available/elevateke-user /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/elevateke-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9 — SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com
```

Certbot auto-renews. Verify:

```bash
sudo certbot renew --dry-run
```

---

## 10 — Useful Commands

```bash
# View logs
pm2 logs elevateke-api
pm2 logs elevateke-user
pm2 logs elevateke-admin

# Restart after code update
pm2 restart all

# Check status
pm2 status

# Update & redeploy
cd /var/www/elevateke
git pull
pnpm install
pnpm --filter @workspace/invest-platform run build
pnpm --filter @workspace/admin-dashboard run build
cd artifacts/api-server && pnpm run build
pm2 restart all
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `ADMIN_USERNAME` | Yes | Admin dashboard login username |
| `ADMIN_PASSWORD` | Yes | Admin dashboard login password |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key for M-Pesa STK Push |
| `SENDGRID_API_KEY` | No | For deposit confirmation emails |
| `FROM_EMAIL` | No | Sender address for emails |

---

## Architecture

```
VPS
├── nginx (ports 80/443)
│   ├── yourdomain.com       → localhost:3002 (user frontend)
│   ├── admin.yourdomain.com → localhost:3003 (admin frontend)
│   └── /api/*               → localhost:3001 (API server)
│
├── PM2
│   ├── elevateke-api    (port 3001) — Express + Drizzle
│   ├── elevateke-user   (port 3002) — Vite preview
│   └── elevateke-admin  (port 3003) — Vite preview
│
└── PostgreSQL (port 5432, local only)
```

---

## Security Notes

- Keep `PAYSTACK_SECRET_KEY` and `SESSION_SECRET` in `.env` only — never commit them
- Restrict PostgreSQL to localhost (`pg_hba.conf`)
- Use a firewall: `sudo ufw allow 'Nginx Full' && sudo ufw allow ssh && sudo ufw enable`
- Change `ADMIN_PASSWORD` to something strong before going live
- Revoke and regenerate any GitHub tokens exposed in chat or logs

---

## License

MIT
