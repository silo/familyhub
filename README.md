<p align="center">
  <img src="https://raw.githubusercontent.com/YOUR_USERNAME/familyhub/main/.github/logo.png" alt="FamilyHub Logo" width="120" />
</p>

<h1 align="center">FamilyHub</h1>

<p align="center">
  <strong>A self-hosted family chore management app designed for shared family tablets</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#self-hosting">Self-Hosting</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/YOUR_USERNAME/familyhub?style=flat-square" alt="License" />
  <img src="https://img.shields.io/docker/pulls/YOUR_USERNAME/familyhub?style=flat-square" alt="Docker Pulls" />
  <img src="https://img.shields.io/github/v/release/YOUR_USERNAME/familyhub?style=flat-square" alt="Release" />
</p>

---

## ✨ Why FamilyHub?

Managing household chores with kids can be chaotic. FamilyHub brings order to the chaos with a **gamified chore system** that runs on your shared family tablet. No cloud subscriptions, no privacy concerns — just a simple, effective tool that keeps everyone accountable while making chores a bit more fun.

**Perfect for:**
- 🏠 Families with children of all ages
- 📱 Shared tablets in common areas (kitchen, living room)
- 🔒 Privacy-conscious households wanting to self-host
- 💰 Parents who use allowance/reward systems

---

## 🎯 Features

### 👨‍👩‍👧‍👦 Family Management
- **Unlimited family members** with customizable profiles
- **DiceBear avatars** or custom image uploads
- **12 pastel color themes** for easy identification
- Single admin account with password or PIN protection

### ✅ Chore System
- **One-time chores** — auto-archive after completion
- **Permanent chores** — always available with optional cooldowns
- **Recurring chores** — daily, weekly, bi-weekly, or custom schedules
- **Categories** — organize chores by room, type, or priority
- **Assignments** — assign to specific family members or leave open for anyone
- **Due dates** — optional deadlines with overdue indicators

### 🏆 Points & Rewards
- **Earn points** for completing chores
- **Configurable value** — set how much each point is worth in real money
- **Leaderboard** — friendly competition among family members
- **Redemption system** — admin-managed point-to-cash conversion
- **Full transaction history** — track all earnings and redemptions

### 📊 Activity & Tracking
- **Real-time activity log** — see who did what and when
- **Dashboard views** — daily, weekly, or monthly calendar view
- **Family filters** — view chores for all or specific family members
- **Celebration animations** — 🎉 party horn effects on completion!

### 🔐 Admin Controls
- **Password or 4-digit PIN** protection for settings
- **1-minute inactivity timeout** for security
- **Backup & Restore** — export/import SQL dumps
- **No cloud dependency** — 100% self-hosted

### 📱 Multi-Platform
- **Responsive design** — works on tablets, phones, and desktops
- **Touch-friendly** — large buttons for small fingers
- **Mobile apps** — native iOS and Android apps via Capacitor
- **QR code scanning** — assign QR codes to chores for quick completion

---

## 📸 Screenshots

<!-- Add screenshots here -->
| Dashboard | Points | Activity |
|-----------|--------|----------|
| ![Dashboard](/.github/screenshots/dashboard.png) | ![Points](/.github/screenshots/points.png) | ![Activity](/.github/screenshots/activity.png) |

---

## 🚀 Quick Start

The fastest way to get FamilyHub running is with Docker Compose:

```bash
# Create a directory for FamilyHub
mkdir familyhub && cd familyhub

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/familyhub/main/docker-compose.yml

# Start the application
docker compose up -d

# Open your browser
open http://localhost:3000
```

That's it! On first launch, you'll be guided through the setup wizard to create your admin account and family members.

---

## 🏠 Self-Hosting

### Option 1: Docker Compose (Recommended)

**Requirements:**
- Docker Engine 20.10+
- Docker Compose v2.0+
- 512MB RAM minimum
- 1GB disk space

**1. Create a `docker-compose.yml` file:**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: familyhub-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: familyhub
      POSTGRES_PASSWORD: your_secure_password_here
      POSTGRES_DB: familyhub
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U familyhub -d familyhub"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: YOUR_DOCKERHUB_USERNAME/familyhub:latest
    container_name: familyhub-app
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://familyhub:your_secure_password_here@db:5432/familyhub
      NODE_ENV: production
    ports:
      - "3000:3000"
    volumes:
      - uploads:/app/public/uploads
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
  uploads:
```

**2. Start the services:**

```bash
docker compose up -d
```

**3. Access the app:**

Open `http://your-server-ip:3000` in your browser.

---

### Option 2: Docker Run (Without Compose)

**1. Create a network:**

```bash
docker network create familyhub-network
```

**2. Start PostgreSQL:**

```bash
docker run -d \
  --name familyhub-db \
  --network familyhub-network \
  -e POSTGRES_USER=familyhub \
  -e POSTGRES_PASSWORD=your_secure_password_here \
  -e POSTGRES_DB=familyhub \
  -v familyhub_postgres:/var/lib/postgresql/data \
  postgres:16-alpine
```

**3. Start FamilyHub:**

```bash
docker run -d \
  --name familyhub-app \
  --network familyhub-network \
  -e DATABASE_URL=postgresql://familyhub:your_secure_password_here@familyhub-db:5432/familyhub \
  -e NODE_ENV=production \
  -p 3000:3000 \
  -v familyhub_uploads:/app/public/uploads \
  YOUR_DOCKERHUB_USERNAME/familyhub:latest
```

---

### Option 3: Build from Source

**Requirements:**
- Node.js 22+
- pnpm 9+
- PostgreSQL 16+

**1. Clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/familyhub.git
cd familyhub
```

**2. Install dependencies:**

```bash
pnpm install
```

**3. Configure environment:**

```bash
cp .env.example .env
# Edit .env with your database connection string
```

**4. Run database migrations:**

```bash
pnpm db:migrate
```

**5. Build and start:**

```bash
pnpm build
node .output/server/index.mjs
```

---

### Reverse Proxy Setup (Optional)

For production deployments, use a reverse proxy like **Nginx** or **Caddy**.

**Caddy (Automatic HTTPS):**

```
familyhub.yourdomain.com {
    reverse_proxy localhost:3000
}
```

**Nginx:**

```nginx
server {
    listen 80;
    server_name familyhub.yourdomain.com;

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
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |

### First-Run Setup

On first launch, FamilyHub will detect an empty database and guide you through:

1. **Welcome** — Introduction to the app
2. **Security** — Create admin password or 4-digit PIN
3. **Admin Profile** — Set up your avatar and name
4. **Family Members** — Add your family (can skip and add later)
5. **Done!** — Redirect to dashboard

---

## 📱 Mobile Apps

FamilyHub includes native mobile apps for iOS and Android, built with Capacitor. These apps allow family members to:

- View and complete assigned chores
- Check their points balance
- Scan QR codes for quick chore completion
- Receive notifications (coming soon)

> **Note:** Mobile apps require connecting to your self-hosted FamilyHub server.

---

## 🗺️ Roadmap

### v1 - Chore Management ✅
- [x] Family member management
- [x] Chore CRUD with recurring support
- [x] Points and rewards system
- [x] Activity logging
- [x] Dashboard with calendar views
- [x] Mobile apps (iOS/Android)

### v2 - Calendar Integration 🔜
- [ ] Full calendar dashboard
- [ ] Google Calendar sync
- [ ] iCal integration
- [ ] Per-member calendar binding

### v3 - Shopping List 📝
- [ ] Shared family shopping list
- [ ] Autocomplete from history
- [ ] Thermal/regular printer support

### Future Ideas 💡
- [ ] Push notifications
- [ ] Multiple households support
- [ ] Chore templates/presets
- [ ] Achievement badges
- [ ] Weekly/monthly reports
- [ ] Voice assistant integration
- [ ] NFC tag support for chore completion
- [ ] API for third-party integrations

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Nuxt 4](https://nuxt.com) | Full-stack Vue framework |
| [Vue 3](https://vuejs.org) | Frontend framework |
| [NuxtUI 4](https://ui.nuxt.com) | UI component library |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Drizzle ORM](https://orm.drizzle.team) | Database ORM |
| [PostgreSQL](https://postgresql.org) | Database |
| [Zod](https://zod.dev) | Schema validation |
| [Capacitor](https://capacitorjs.com) | Native mobile apps |
| [Docker](https://docker.com) | Containerization |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/familyhub/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/familyhub/discussions)

---

<p align="center">
  Made with ❤️ for families everywhere
</p>
