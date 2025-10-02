# Web AutoTest Pro - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying Web AutoTest Pro to production environments with high availability, security, and performance.

## 📋 Prerequisites

### System Requirements
- **CPU**: 4+ cores (8+ recommended for high load)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: 100GB SSD minimum
- **OS**: Ubuntu 20.04 LTS, CentOS 8, or similar
- **Node.js**: 18.x LTS
- **Docker**: 20.10+ (for containerized deployment)
- **Kubernetes**: 1.24+ (for orchestrated deployment)

### External Services
- **Database**: MongoDB 5.0+ or PostgreSQL 13+
- **Redis**: 6.2+ (for caching and sessions)
- **Load Balancer**: Nginx, HAProxy, or cloud LB
- **Certificate**: SSL/TLS certificates
- **Storage**: S3-compatible object storage for assets

## 🐳 Docker Deployment

### Single Container Setup
```dockerfile
# Dockerfile.production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S autotest -u 1001
USER autotest

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

### Docker Compose Setup
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web-app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongodb:
    image: mongo:5.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:6.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web-app
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app_servers {
        server web-app:3000;
        # Add more servers for load balancing
        # server web-app-2:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    server {
        listen 80;
        server_name autotest-pro.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name autotest-pro.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        location / {
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://app_servers;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app_servers;
        }

        location /ws {
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
        }

        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }
    }
}
```

## ☸️ Kubernetes Deployment

### Namespace and ConfigMap
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: autotest-pro

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: autotest-pro
data:
  NODE_ENV: "production"
  API_URL: "https://api.autotest-pro.com"
  WS_URL: "wss://api.autotest-pro.com/ws"
```

### Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: autotest-pro
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  jwt-secret: <base64-encoded-jwt-secret>
  redis-password: <base64-encoded-redis-password>
```

### Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autotest-pro
  namespace: autotest-pro
spec:
  replicas: 3
  selector:
    matchLabels:
      app: autotest-pro
  template:
    metadata:
      labels:
        app: autotest-pro
    spec:
      containers:
      - name: web-app
        image: autotest-pro:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service and Ingress
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: autotest-pro-service
  namespace: autotest-pro
spec:
  selector:
    app: autotest-pro
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: autotest-pro-ingress
  namespace: autotest-pro
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - autotest-pro.com
    secretName: autotest-pro-tls
  rules:
  - host: autotest-pro.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: autotest-pro-service
            port:
              number: 80
```

## 🌥️ Cloud Platform Deployment

### AWS ECS with Fargate
```yaml
# aws-ecs-task-definition.json
{
  "family": "autotest-pro",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "autotest-pro",
      "image": "your-registry/autotest-pro:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/autotest-pro",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Google Cloud Run
```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: autotest-pro
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      containers:
      - image: gcr.io/project-id/autotest-pro:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        resources:
          limits:
            cpu: 2000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          timeoutSeconds: 5
```

## 🔧 Environment Configuration

### Production Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mongodb://username:password@cluster.mongodb.net/autotest-prod
REDIS_URL=redis://:password@redis-host:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=autotest-pro-assets
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# Performance
CLUSTER_MODE=true
WORKER_PROCESSES=0  # 0 = CPU count

# Security
CORS_ORIGIN=https://autotest-pro.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Health Check Endpoints
```typescript
// src/health.ts
import express from 'express';
import mongoose from 'mongoose';
import redis from './redis';

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {
      database: 'ok',
      redis: 'ok',
      memory: 'ok'
    }
  };

  try {
    // Database check
    await mongoose.connection.db.admin().ping();
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'error';
  }

  try {
    // Redis check
    await redis.ping();
  } catch (error) {
    health.checks.redis = 'error';
    health.status = 'error';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
    health.checks.memory = 'warning';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', (req, res) => {
  // Simple readiness check
  res.status(200).json({ status: 'ready' });
});

export default router;
```

## 📊 Monitoring and Logging

### Application Monitoring
```typescript
// src/monitoring.ts
import * as Sentry from '@sentry/node';
import { Express } from 'express';

export function setupMonitoring(app: Express) {
  // Sentry error tracking
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app })
    ]
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // Custom metrics
  const promClient = require('prom-client');
  const register = new promClient.Registry();

  const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  });

  const testExecutions = new promClient.Counter({
    name: 'test_executions_total',
    help: 'Total number of test executions',
    labelNames: ['status']
  });

  register.registerMetric(httpRequestDuration);
  register.registerMetric(testExecutions);

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}
```

### Structured Logging
```typescript
// src/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'autotest-pro'
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

## 🔒 Security Hardening

### Security Headers and Middleware
```typescript
// src/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export function setupSecurity(app: Express) {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "wss:", "https:"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api/', limiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true
  });

  app.use('/api/auth/', authLimiter);
}
```

## 📈 Performance Optimization

### Cluster Mode
```typescript
// src/cluster.ts
import cluster from 'cluster';
import os from 'os';

const numCPUs = parseInt(process.env.WORKER_PROCESSES || '0') || os.cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production' && process.env.CLUSTER_MODE === 'true') {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Worker process
  require('./app');
  console.log(`Worker ${process.pid} started`);
}
```

### Caching Strategy
```typescript
// src/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage in routes
app.get('/api/test-cases', async (req, res) => {
  const cacheKey = `test-cases:${req.user.id}:${JSON.stringify(req.query)}`;
  
  let testCases = await cache.get(cacheKey);
  if (!testCases) {
    testCases = await TestCase.find({ userId: req.user.id });
    await cache.set(cacheKey, testCases, 600); // 10 minutes
  }
  
  res.json(testCases);
});
```

## 🚀 Deployment Scripts

### Automated Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

# Configuration
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
NAMESPACE="autotest-pro"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Build and push Docker image
echo "📦 Building Docker image..."
docker build -t autotest-pro:$IMAGE_TAG -f Dockerfile.production .

if [ "$ENVIRONMENT" = "production" ]; then
    echo "📤 Pushing to registry..."
    docker tag autotest-pro:$IMAGE_TAG your-registry/autotest-pro:$IMAGE_TAG
    docker push your-registry/autotest-pro:$IMAGE_TAG
fi

# Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."
kubectl set image deployment/autotest-pro web-app=your-registry/autotest-pro:$IMAGE_TAG -n $NAMESPACE

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/autotest-pro -n $NAMESPACE --timeout=600s

# Run health check
echo "🏥 Running health check..."
HEALTH_URL="https://autotest-pro.com/health"
for i in {1..10}; do
    if curl -f $HEALTH_URL > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    echo "⏳ Health check failed, retrying in 10s..."
    sleep 10
done

echo "🎉 Deployment completed successfully!"
```

### Database Migration
```typescript
// src/migrations/runner.ts
import mongoose from 'mongoose';

export class MigrationRunner {
  private migrations: Migration[] = [];

  addMigration(migration: Migration) {
    this.migrations.push(migration);
  }

  async run() {
    const Applied = mongoose.model('Migration', {
      name: String,
      appliedAt: Date
    });

    for (const migration of this.migrations) {
      const existing = await Applied.findOne({ name: migration.name });
      
      if (!existing) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up();
        await Applied.create({
          name: migration.name,
          appliedAt: new Date()
        });
        console.log(`✅ Migration completed: ${migration.name}`);
      }
    }
  }
}

interface Migration {
  name: string;
  up(): Promise<void>;
  down(): Promise<void>;
}
```

## 📋 Pre-deployment Checklist

### Security Checklist
- [ ] SSL certificates configured and valid
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Input validation and sanitization
- [ ] Authentication and authorization tested

### Performance Checklist
- [ ] Database indexes optimized
- [ ] Redis caching configured
- [ ] Static asset CDN configured
- [ ] Gzip compression enabled
- [ ] Bundle size optimized
- [ ] Load testing completed
- [ ] Memory leaks checked
- [ ] CPU usage profiled

### Monitoring Checklist
- [ ] Health check endpoints working
- [ ] Error tracking configured (Sentry)
- [ ] Application metrics exposed
- [ ] Log aggregation setup
- [ ] Alerting rules configured
- [ ] Uptime monitoring active
- [ ] Performance monitoring active

### Backup and Recovery
- [ ] Database backup strategy implemented
- [ ] File storage backup configured
- [ ] Disaster recovery plan documented
- [ ] Recovery procedures tested
- [ ] Data retention policies defined

---

## 🆘 Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Monitor memory usage
kubectl top pods -n autotest-pro
docker stats

# Check for memory leaks
curl http://localhost:3000/health
```

#### Database Connection Issues
```bash
# Test database connectivity
mongosh "mongodb://username:password@host:port/database"

# Check connection pool
kubectl logs -n autotest-pro deployment/autotest-pro | grep "database"
```

#### Performance Issues
```bash
# Check application metrics
curl http://localhost:3000/metrics

# Analyze slow queries
# Check database slow query logs
```

*For more detailed troubleshooting, refer to the [Operations Runbook](https://docs.autotest-pro.dev/operations).*