# Testing Guide

This md covers the essential commands for testing. See `/docs/TESTING.md` for more detail.

## Quick Start

### Run Tests Locally
```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Unit tests with coverage
```

### Run Tests in Docker (Recommended)
```bash
npm run test:docker        # Unit tests in Docker
npm run test:e2e:docker    # E2E tests in Docker
```

Docker provides consistent results across all machines and matches CI/CD environments.

---
## Quick Reference

Minimal, essential commands and notes for running tests.

### Local
- Run unit tests:    `npm test`
- Run E2E tests:     `npm run test:e2e` (requires TEST_DATABASE_URL or Docker)
- Coverage:          `npm run test:cov`

### Docker (recommended for E2E)
- Run unit tests in Docker:        `npm run test:docker`
- Run full E2E in Docker:          `npm run test:e2e:docker`
- Rebuild & run E2E:               `npm run test:e2e:docker:build`

### Notes
- Use Docker for consistent environment and isolation.
- E2E tests expect seed data: careers `I` and `E`, plans `2023` and `2015` — do not modify these in tests.
- Create test data with `TEST*` prefixes and ensure `beforeEach`/`afterEach` clean up.

## Troubleshooting
- If tests pass individually but fail together, run E2E with Docker and `--runInBand` to detect isolation issues.
- View Docker logs: `docker-compose -f docker-compose.test.yml logs`
- Connect to test DB during run: `localhost:5434`
- Debug locally: `npm run test:debug`
