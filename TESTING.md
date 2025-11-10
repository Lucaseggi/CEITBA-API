# Testing Guide

This guide covers unit and E2E testing for the CEITBA API project.

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

## Test Structure

```
src/
├── domain/
│   └── itba/
│       ├── repositories/
│       │   └── *.repository.impl.spec.ts    ← Unit tests
│       └── services/
│           └── *.service.spec.ts            ← Unit tests
├── presentation/
│   └── v1/
│       └── controllers/
│           └── *.controller.spec.ts         ← Controller tests
└── shared/
    └── mappers/
        └── *.spec.ts                        ← Mapper tests

test/
├── utils/
│   ├── e2e-test-base.ts                     ← E2E test framework
│   └── test-db-setup.ts                     ← Database utilities
├── jest-e2e.json                            ← E2E test config
└── *.e2e-spec.ts                            ← E2E tests
```

---

## Unit Tests

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode for development
npm run test:watch

# With coverage report
npm run test:cov

# Run specific test file
npm test -- subject.service.spec.ts

# In Docker (consistent environment)
npm run test:docker
```

### Writing Unit Tests

Unit tests mock external dependencies (Prisma, repositories, services) and test business logic in isolation.

**Repository Example:**
```typescript
describe('SubjectRepositoryImpl', () => {
  let repository: SubjectRepositoryImpl;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new SubjectRepositoryImpl(prisma as any);
  });

  it('should find subject by id', async () => {
    const mockSubject = { id: '93.42', name: 'Cálculo I', credits: 6 };
    prisma.subject.findUnique.mockResolvedValue(mockSubject);

    const result = await repository.findById('93.42');

    expect(result?.id).toBe('93.42');
  });
});
```

**Service Example:**
```typescript
describe('SubjectService', () => {
  let service: SubjectService;
  let repository: jest.Mocked<SubjectRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SubjectService,
        { provide: SUBJECT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<SubjectService>(SubjectService);
  });

  it('should create subject', async () => {
    repository.create.mockResolvedValue(expectedSubject);

    const result = await service.createSubject(dto);

    expect(repository.create).toHaveBeenCalled();
    expect(result).toEqual(expectedSubject);
  });
});
```

---

## E2E Tests

E2E tests use a real PostgreSQL database and test the full application stack.

### Running E2E Tests

```bash
# Run locally (requires TEST_DATABASE_URL in .env)
npm run test:e2e

# Run in Docker (recommended - isolated database)
npm run test:e2e:docker

# Rebuild Docker images and run
npm run test:e2e:docker:build

# Clean up Docker containers
npm run test:e2e:docker:down
```

### Docker E2E Testing

Docker provides:
- ✅ Isolated PostgreSQL 16 database (uses tmpfs for speed)
- ✅ Consistent environment (Node 20, same dependencies)
- ✅ No local database setup required
- ✅ CI/CD ready

**What happens:**
1. Spins up fresh PostgreSQL container on port 5434
2. Runs Prisma migrations
3. Executes all E2E tests with proper isolation
4. Tears down containers after completion

### E2E Test Isolation

Our E2E tests guarantee isolation:

1. **Separate Prisma instances** - Each test suite gets its own `PrismaClient`
2. **Sequential execution** - Tests run with `--runInBand` to prevent race conditions
3. **Database reset** - After each test, database is cleaned and re-seeded
4. **Seed data verification** - Before each test, seed data integrity is checked

**Seed Data (preserved across tests):**
- Careers: `I` (Ingeniería Informática), `E` (Ingeniería Electrónica)
- Plans: `2023`, `2015`

### Writing E2E Tests

```typescript
describe('My Feature (e2e)', () => {
  let testBase: E2ETestBase;

  beforeAll(async () => {
    testBase = await setupE2ETest();
  });

  beforeEach(async () => {
    await testBase.beforeEachTest();  // Verifies seed data
  });

  afterEach(async () => {
    await testBase.afterEachTest();   // Cleans & re-seeds
  });

  afterAll(async () => {
    await testBase.afterAllTests();
  });

  it('should create test data', async () => {
    // Use TEST* prefix for test data
    await testBase.getPrisma().career.create({
      data: { id: 'TEST_CAREER', name: 'Test Career' },
    });

    const response = await request(testBase.getApp().getHttpServer())
      .get('/api/v1/careers/TEST_CAREER')
      .expect(200);

    expect(response.body.name).toBe('Test Career');
  });
});
```

**Rules for E2E Tests:**
- ✅ Read seed data (careers I/E, plans 2023/2015)
- ✅ Create new test data with `TEST*` prefix
- ❌ Never modify or delete seed data

---

## Docker Testing

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:docker` | Run unit tests in Docker |
| `npm run test:docker:build` | Rebuild and run unit tests |
| `npm run test:e2e:docker` | Run E2E tests in Docker |
| `npm run test:e2e:docker:build` | Rebuild and run E2E tests |
| `npm run test:e2e:docker:down` | Clean up test containers |

### Why Use Docker?

1. **Consistency** - Same Node.js, PostgreSQL, and dependencies everywhere
2. **No Setup** - No need to install/configure PostgreSQL locally
3. **Isolation** - Fresh database for every test run
4. **CI/CD Ready** - Same commands work in pipelines

### Architecture

```
┌──────────────────────────────────────┐
│  docker-compose.test.yml             │
├──────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────┐ │
│  │ postgres-test  │  │test-runner │ │
│  │  (port 5434)   │◄─┤  (Node 20) │ │
│  │  PostgreSQL 16 │  │  Prisma    │ │
│  │  (tmpfs)       │  │  Jest      │ │
│  └────────────────┘  └────────────┘ │
└──────────────────────────────────────┘
```

---

## Test Coverage

### Current Coverage
Run `npm run test:cov` to see current coverage statistics.

### Coverage Goals
- **Current minimum**: 10%
- **Target**: 80%+
- **Excluded**: DTOs, interfaces, modules, main.ts

### View Coverage Report
```bash
npm run test:cov
open coverage/index.html  # Or just open the file in browser
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Unit Tests
        run: npm run test:docker:build

      - name: Run E2E Tests
        run: npm run test:e2e:docker:build
```

### GitLab CI
```yaml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - npm run test:docker:build
    - npm run test:e2e:docker:build
```

---

## Troubleshooting

### Tests fail locally but pass in Docker
Run tests in Docker to match CI environment:
```bash
npm run test:e2e:docker:build
```

### Port 5434 already in use
Change port in `docker-compose.test.yml`:
```yaml
postgres-test:
  ports:
    - "5435:5432"
```

### Seed data integrity check failed
A test modified seed data (careers I/E or plans 2023/2015).
- Use `TEST*` prefix for new data
- Never update/delete seed data in tests

### Tests pass individually but fail together
This indicates a test isolation issue.
- Ensure all E2E tests have `beforeEach` and `afterEach` hooks
- Check for shared state between tests
- Verify test data uses unique IDs

### Docker build is slow
Use cached images after first build:
```bash
npm run test:e2e:docker  # Uses cache
```

Only rebuild when dependencies change:
```bash
npm run test:e2e:docker:build
```

---

## Best Practices

### Unit Tests
1. **Mock all external dependencies** (Prisma, HTTP, file system)
2. **Test one thing at a time** - focused test cases
3. **Use descriptive test names** - explain what is being tested
4. **Follow AAA pattern** - Arrange, Act, Assert

### E2E Tests
1. **Always use Docker** before pushing to ensure CI will pass
2. **Use meaningful IDs** with `TEST*` prefix
3. **Keep tests independent** - each test should work in isolation
4. **Don't modify seed data** - create your own test data
5. **Clean up automatically** - framework handles this via `afterEach`

### General
1. **Run tests before committing** - catch issues early
2. **Write tests alongside code** - not as an afterthought
3. **Keep tests maintainable** - refactor test code too
4. **Use test utilities** - leverage helper functions and factories

---

## Quick Reference

```bash
# Local Testing
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report

# Docker Testing (Recommended)
npm run test:docker             # Unit tests in Docker
npm run test:e2e:docker         # E2E tests in Docker
npm run test:e2e:docker:build   # Rebuild & run E2E tests

# Development
npm run test:watch         # Watch mode for unit tests
npm test -- my-file.spec   # Run specific test

# Cleanup
npm run test:e2e:docker:down    # Remove test containers
```

---

## Need Help?

- View Docker logs: `docker-compose -f docker-compose.test.yml logs`
- Connect to test DB during run: `localhost:5434`
- Debug locally: `npm run test:debug`
