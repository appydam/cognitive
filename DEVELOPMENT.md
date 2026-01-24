# Consequence AI - Development Guide

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (for production)
- Git

### Installation

```bash
# Install all dependencies
make install

# Or install separately
make install-backend    # Python dependencies
make install-frontend   # Node dependencies
```

### Development

```bash
# Run both servers
make dev

# Or run separately
make dev-backend    # Backend: http://localhost:8000
make dev-frontend   # Frontend: http://localhost:3000
```

## Code Quality

### Automated Quality Checks

```bash
# Run all quality checks (format + lint + test)
make quality

# Individual checks
make format    # Format all code
make lint      # Lint all code
make test      # Run all tests
```

### Pre-commit Hooks

Install pre-commit hooks to automatically check code quality before commits:

```bash
pip install pre-commit
pre-commit install
```

This will automatically run:
- Black (Python formatting)
- Flake8 (Python linting)
- isort (Python import sorting)
- Prettier (Frontend formatting)
- Various file checks

### Frontend Quality

```bash
cd frontend

# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Run all checks
npm run quality
```

### Backend Quality

```bash
# Format code
black src/ tests/

# Lint code
flake8 src/

# Type check
mypy src/

# Run tests with coverage
pytest tests/ -v --cov=src --cov-report=html
```

## Project Structure

```
consequence-ai/
├── src/                      # Backend source code
│   ├── api/                  # FastAPI routes
│   ├── core/                 # Domain-agnostic core
│   │   ├── graph/           # Generic graph structures
│   │   ├── engine/          # Propagation algorithms
│   │   └── learning/        # Learning mechanisms
│   ├── adapters/            # Domain adapters
│   │   └── securities/      # Stock market adapter
│   ├── db/                  # Database models
│   └── graph/               # Graph builders
│
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   │   ├── ui/        # Shadcn/ui components
│   │   │   ├── EntitySearch.tsx
│   │   │   ├── PredictionForm.tsx
│   │   │   ├── CascadeTimeline.tsx
│   │   │   └── GraphStats.tsx
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
│
├── tests/                   # Backend tests
├── scripts/                 # Utility scripts
├── .github/workflows/       # CI/CD pipelines
└── docs/                    # Documentation
```

## Architecture

### Core Layer (Domain-Agnostic)
- **Entity**: Generic entity representation
- **CausalLink**: Relationship with strength, delay, confidence
- **CausalGraph**: Graph operations and storage
- **Propagation Engine**: BFS-based cascade propagation
- **Learning System**: Bayesian weight updates

### Adapter Layer (Domain-Specific)
- **Securities Adapter**: Stock market implementation
  - SEC EDGAR parser (future)
  - Yahoo Finance connector
  - Correlation calculator
  - Event detector

### Application Layer
- **FastAPI Backend**: RESTful API
- **Next.js Frontend**: Modern React UI

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ... code ...

# Run quality checks
make quality

# Commit (pre-commit hooks run automatically)
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

### 2. Testing

```bash
# Backend tests
pytest tests/ -v

# Specific test file
pytest tests/test_graph.py -v

# With coverage
pytest tests/ --cov=src --cov-report=html

# Frontend tests (when implemented)
cd frontend && npm test
```

### 3. Database Migrations

```bash
# Create migration
alembic revision -m "Add new table"

# Run migrations
make db-migrate

# Seed database
make db-seed
```

## Deployment

### Backend (Railway)

```bash
make deploy-backend
```

Or manually:
```bash
railway up
```

### Frontend (Vercel)

```bash
make deploy-frontend
```

Or manually:
```bash
cd frontend
vercel --prod --yes
```

### Full Deployment

```bash
make deploy
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://cognitive-production.up.railway.app
```

## CI/CD Pipeline

GitHub Actions runs on every push:
1. **Backend Checks**: Black, Flake8, Mypy, Pytest
2. **Frontend Checks**: Prettier, ESLint, Type Check, Build
3. **Security Audit**: npm audit, safety check

## Code Standards

### Python
- **Style**: Black (line length: 88)
- **Linting**: Flake8
- **Type Hints**: Mypy
- **Docstrings**: Google style
- **Testing**: pytest with >80% coverage

### TypeScript/React
- **Style**: Prettier (line length: 80)
- **Linting**: ESLint with TypeScript rules
- **Type Safety**: Strict TypeScript
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS v4

### Git Commits
Follow Conventional Commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Database connection errors:**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Frontend Issues

**Build errors:**
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

**Type errors:**
```bash
cd frontend
npm run type-check
```

## Performance Optimization

### Backend
- Use async/await for I/O operations
- Cache graph in memory
- Database connection pooling
- Index database queries

### Frontend
- Code splitting with dynamic imports
- Image optimization with Next.js Image
- Memoization with useMemo/useCallback
- Virtual scrolling for large lists

## Security

### Backend
- Input validation with Pydantic
- SQL injection prevention (SQLAlchemy)
- CORS configuration
- Rate limiting (future)

### Frontend
- XSS prevention (React escaping)
- CSRF protection
- Environment variable security
- API key rotation

## Monitoring

### Production Logs
```bash
# Backend (Railway)
make logs-backend

# Frontend (Vercel)
vercel logs
```

### Metrics to Track
- API response times
- Prediction accuracy
- Database query performance
- Error rates
- User engagement

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run quality checks
5. Submit pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.
