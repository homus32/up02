.PHONY: dev build preview generate test test-run postinstall clean

# Development
dev:
	npm run dev

# Production build
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Static generation
generate:
	npm run generate

# Testing
test:
	npm run test

test-run:
	npm run test:run

test-e2e:
	npm run test:e2e

# Post-install (generate .nuxt types)
postinstall:
	npm run postinstall

# Clean build artifacts
clean:
	rm -rf .nuxt .output dist node_modules/.cache
