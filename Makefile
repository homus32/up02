.PHONY: dev build preview generate test test-run test-e2e postinstall clean

# Development
dev:
	pnpm dev

# Production build
build:
	pnpm build

# Preview production build
preview:
	pnpm preview

# Static generation
generate:
	pnpm generate

# Testing
test:
	pnpm test

test-run:
	pnpm test:run

test-e2e:
	pnpm test:e2e

# Post-install (generate .nuxt types)
postinstall:
	pnpm postinstall

# Clean build artifacts
clean:
	rm -rf .nuxt .output dist node_modules/.cache
