# Authentik Authentication Infrastructure

This directory contains the Docker Compose setup for Authentik, which provides OAuth2/OIDC authentication for the Lunacycle and Negrato applications.

## Prerequisites

- Docker and Docker Compose installed
- Ports 9000 (HTTP) and 9443 (HTTPS) available

## Quick Start

1. **Start Authentik**
   ```bash
   cd infrastructure/authentik
   docker-compose up -d
   ```

2. **Wait for services to be ready** (about 30-60 seconds)
   ```bash
   docker-compose logs -f authentik-server
   ```
   Wait until you see "Application startup complete"

3. **Access Authentik Admin UI**
   - Open http://localhost:9000/if/flow/initial-setup/
   - Create your admin account
   - Login at http://localhost:9000/

## Configuration

### Environment Variables

The `.env` file contains:
- `PG_PASS` - PostgreSQL database password (auto-generated)
- `AUTHENTIK_SECRET_KEY` - Authentik encryption key (auto-generated)
- `AUTHENTIK_LOG_LEVEL` - Log verbosity (info, debug, warning, error)

To regenerate secrets:
```bash
openssl rand -base64 60
```

### Configuring OAuth Applications

After initial setup, you need to configure OAuth2 providers for your applications:

#### For Lunacycle:

1. **Applications → Create**
   - Name: `Lunacycle`
   - Slug: `lunacycle`

2. **Create OAuth2/OpenID Provider**
   - Name: `Lunacycle OAuth`
   - Client Type: `Confidential`
   - Client ID: `lunacycle-web`
   - Client Secret: (copy this - you'll need it)
   - Redirect URIs:
     ```
     http://localhost:8080/auth/callback
     http://localhost:8080/auth/silent-callback
     ```
   - Scopes: `openid`, `profile`, `email`

3. **Create Groups for RBAC**
   - Directory → Groups → Create
   - `lunacycle-admins` - Admin users
   - `lunacycle-users` - Regular users

#### For Negrato:

Follow the same process with:
- Name: `Negrato`
- Client ID: `negrato-web`
- Redirect URIs: `http://localhost:8081/auth/callback`

### Social Login Configuration

To enable Google/GitHub login:

1. **Google OAuth**
   - Directory → Federation & Social → Create
   - Type: Google OAuth Source
   - Consumer Key: (from Google Cloud Console)
   - Consumer Secret: (from Google Cloud Console)

2. **GitHub OAuth**
   - Directory → Federation & Social → Create
   - Type: GitHub OAuth Source
   - Consumer Key: (from GitHub OAuth App)
   - Consumer Secret: (from GitHub OAuth App)

## Services

The Docker Compose stack includes:

- **PostgreSQL** (port 5432) - Database
- **Redis** (port 6379) - Cache and message broker
- **Authentik Server** (ports 9000/9443) - Web UI and API
- **Authentik Worker** - Background tasks

## Commands

**Start services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
docker-compose logs -f authentik-server
```

**Stop services:**
```bash
docker-compose down
```

**Stop and remove data:**
```bash
docker-compose down -v  # WARNING: This deletes all data!
```

**Restart a service:**
```bash
docker-compose restart authentik-server
```

## Troubleshooting

### Service won't start
```bash
docker-compose ps
docker-compose logs authentik-server
```

### Reset admin password
```bash
docker-compose exec authentik-server ak create_admin_group
```

### Database connection issues
```bash
docker-compose logs postgresql
```

### Clear Redis cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

## Data Persistence

Data is stored in Docker volumes:
- `database` - PostgreSQL data
- `redis` - Redis data
- `./media` - Uploaded files and avatars
- `./custom-templates` - Custom templates

## Security Notes

- The `.env` file contains sensitive secrets - never commit it to git
- Use HTTPS in production (configure a reverse proxy like Traefik or Nginx)
- Change default ports if needed via environment variables
- Regularly update the Authentik image version

## URLs

- **Admin UI**: http://localhost:9000/
- **User Login**: http://localhost:9000/if/flow/authentication/
- **OAuth Endpoints**: http://localhost:9000/application/o/
- **API**: http://localhost:9000/api/v3/

## Next Steps

After Authentik is running:
1. Create OAuth2 providers for lunacycle-web and negrato-web
2. Configure groups for RBAC
3. Optionally set up social login providers
4. Update application configs with OAuth credentials
