# FamilyHub Docker Image

A self-hosted family chore management app designed for shared family tablets.

## Quick Start

```bash
docker run -d \
  --name familyhub \
  -e DATABASE_URL=postgresql://user:password@host:5432/familyhub \
  -p 3000:3000 \
  YOUR_USERNAME/familyhub:latest
```

## Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: familyhub
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: familyhub
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U familyhub -d familyhub"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: YOUR_USERNAME/familyhub:latest
    environment:
      DATABASE_URL: postgresql://familyhub:changeme@db:5432/familyhub
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

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment mode | No (default: production) |

## Volumes

- `/app/public/uploads` - User uploaded images (avatars)

## Ports

- `3000` - Web interface

## Tags

- `latest` - Latest stable release
- `vX.X.X` - Specific version
- `main` - Latest build from main branch

## Links

- [GitHub Repository](https://github.com/YOUR_USERNAME/familyhub)
- [Documentation](https://github.com/YOUR_USERNAME/familyhub#readme)
- [Report Issues](https://github.com/YOUR_USERNAME/familyhub/issues)
