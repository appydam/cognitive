.PHONY: help install dev test lint format clean deploy

# Default target
help:
	@echo "Consequence AI - Development Commands"
	@echo ""
	@echo "Backend (Python):"
	@echo "  make install-backend    - Install Python dependencies"
	@echo "  make dev-backend        - Run backend development server"
	@echo "  make test-backend       - Run Python tests with coverage"
	@echo "  make lint-backend       - Run Python linters (flake8, mypy)"
	@echo "  make format-backend     - Format Python code with black"
	@echo ""
	@echo "Frontend (Next.js):"
	@echo "  make install-frontend   - Install Node dependencies"
	@echo "  make dev-frontend       - Run frontend development server"
	@echo "  make build-frontend     - Build frontend for production"
	@echo "  make lint-frontend      - Run ESLint on frontend code"
	@echo "  make format-frontend    - Format frontend code with Prettier"
	@echo ""
	@echo "Full Stack:"
	@echo "  make install            - Install all dependencies"
	@echo "  make dev                - Run both backend and frontend"
	@echo "  make test               - Run all tests"
	@echo "  make lint               - Run all linters"
	@echo "  make format             - Format all code"
	@echo "  make quality            - Run format + lint + test"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate         - Run database migrations"
	@echo "  make db-seed            - Seed database with initial data"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-backend     - Deploy backend to Railway"
	@echo "  make deploy-frontend    - Deploy frontend to Vercel"
	@echo "  make deploy             - Deploy everything"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean              - Clean build artifacts"
	@echo "  make logs-backend       - Tail backend logs"

# Backend commands
install-backend:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt

dev-backend:
	@echo "Starting backend development server..."
	cd src && python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

test-backend:
	@echo "Running Python tests..."
	pytest tests/ -v --cov=src --cov-report=term-missing --cov-report=html

lint-backend:
	@echo "Running Python linters..."
	@echo "→ Flake8..."
	flake8 src/
	@echo "→ Mypy..."
	mypy src/
	@echo "✓ All linters passed!"

format-backend:
	@echo "Formatting Python code..."
	black src/ tests/
	@echo "✓ Code formatted!"

# Frontend commands
install-frontend:
	@echo "Installing Node dependencies..."
	cd frontend && npm install

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

build-frontend:
	@echo "Building frontend for production..."
	cd frontend && npm run build

lint-frontend:
	@echo "Running ESLint..."
	cd frontend && npm run lint
	@echo "✓ ESLint passed!"

format-frontend:
	@echo "Formatting frontend code..."
	cd frontend && npm run format
	@echo "✓ Code formatted!"

type-check-frontend:
	@echo "Running TypeScript type checking..."
	cd frontend && npm run type-check
	@echo "✓ Type check passed!"

# Full stack commands
install: install-backend install-frontend
	@echo "✓ All dependencies installed!"

dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@make -j2 dev-backend dev-frontend

test: test-backend
	@echo "✓ All tests passed!"

lint: lint-backend lint-frontend
	@echo "✓ All linters passed!"

format: format-backend format-frontend
	@echo "✓ All code formatted!"

quality: format lint test
	@echo "✓ Quality checks complete!"

# Database commands
db-migrate:
	@echo "Running database migrations..."
	cd src && alembic upgrade head
	@echo "✓ Migrations complete!"

db-seed:
	@echo "Seeding database..."
	python scripts/seed_database.py
	@echo "✓ Database seeded!"

# Deployment commands
deploy-backend:
	@echo "Deploying backend to Railway..."
	railway up
	@echo "✓ Backend deployed!"

deploy-frontend:
	@echo "Deploying frontend to Vercel..."
	cd frontend && vercel --prod --yes
	@echo "✓ Frontend deployed!"

deploy: deploy-backend deploy-frontend
	@echo "✓ Full deployment complete!"

# Utility commands
clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/.next
	rm -rf frontend/out
	rm -rf frontend/node_modules/.cache
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	@echo "✓ Clean complete!"

logs-backend:
	@echo "Tailing Railway logs..."
	railway logs

# Quick development shortcuts
.PHONY: be fe
be: dev-backend
fe: dev-frontend
