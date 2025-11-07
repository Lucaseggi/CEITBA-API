# Testing Guidelines

## Overview

This project uses Jest as the testing framework with comprehensive unit, integration, and E2E tests.

## Test Structure

### Directory Organization

```
src/
├── domain/
│   └── itba/
│       ├── repositories/
│       │   ├── subject.repository.impl.ts
│       │   └── subject.repository.impl.spec.ts  ← Unit tests
│       └── services/
│           ├── subject.service.ts
│           └── subject.service.spec.ts          ← Unit tests
├── presentation/
│   └── v1/
│       └── controllers/
│           ├── subject.controller.ts
│           └── subject.controller.spec.ts       ← Controller tests
└── shared/
    └── mappers/
        ├── itba.mappers.ts
        └── itba.mappers.spec.ts                 ← Mapper tests

test/
├── utils/
│   ├── prisma-mock.helper.ts                    ← Test utilities
│   └── test-factories.ts                        ← Test data factories
├── jest-e2e.json                                ← E2E test config
└── *.e2e-spec.ts                                ← E2E tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- subject.service.spec.ts
```

## Writing Tests

### Repository Tests

Repository tests should mock Prisma and test:
- CRUD operations
- Query methods
- Error handling (Prisma error codes)
- Edge cases

Example:
```typescript
describe('SubjectRepositoryImpl', () => {
  let repository: SubjectRepositoryImpl;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new SubjectRepositoryImpl(prisma as any);
  });

  it('should find subject by id', async () => {
    const mockSubject = createPrismaSubjectResult('93.42', 'Cálculo I', 6);
    prisma.subject.findUnique.mockResolvedValue(mockSubject);

    const result = await repository.findById('93.42');

    expect(result?.id).toBe('93.42');
  });
});
```

### Service Tests

Service tests should mock repositories and test:
- Business logic
- Repository method calls
- Data transformation
- Error propagation

Example:
```typescript
describe('SubjectService', () => {
  let service: SubjectService;
  let repository: jest.Mocked<SubjectRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectService,
        {
          provide: SUBJECT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SubjectService>(SubjectService);
    repository = module.get(SUBJECT_REPOSITORY);
  });

  it('should create subject', async () => {
    const dto = { id: '93.42', name: 'Cálculo I', credits: 6 };
    const subject = createTestSubject('93.42', 'Cálculo I', 6);
    repository.create.mockResolvedValue(subject);

    const result = await service.createSubject(dto);

    expect(repository.create).toHaveBeenCalled();
    expect(result).toEqual(subject);
  });
});
```

### Controller Tests

Controller tests should mock services and test:
- HTTP request/response handling
- DTO validation
- Exception handling
- Service method invocations

Example:
```typescript
describe('SubjectController', () => {
  let controller: SubjectController;
  let service: jest.Mocked<SubjectService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectController],
      providers: [
        {
          provide: SubjectService,
          useValue: {
            getSubjectById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SubjectController>(SubjectController);
    service = module.get(SubjectService);
  });

  it('should throw NotFoundException when subject not found', async () => {
    service.getSubjectById.mockResolvedValue(null);

    await expect(controller.getSubjectById('missing')).rejects.toThrow(NotFoundException);
  });
});
```

### Mapper Tests

Mapper tests should test:
- Data transformations
- Array operations
- Null/undefined handling
- Edge cases

Example:
```typescript
describe('ItbaMappers', () => {
  it('should map subject to DTO', () => {
    const subject = createTestSubject('93.42', 'Cálculo I', 6);

    const result = ItbaMappers.subjectToDto(subject);

    expect(result).toEqual({
      id: '93.42',
      name: 'Cálculo I',
      credits: 6,
    });
  });
});
```

## Test Utilities

### Mock Helpers

Located in `test/utils/prisma-mock.helper.ts`:

```typescript
import { createMockPrismaService } from '../../../test/utils/prisma-mock.helper';

const prisma = createMockPrismaService();
```

### Test Factories

Located in `test/utils/test-factories.ts`:

```typescript
import { createTestSubject, createTestCareer } from '../../../test/utils/test-factories';

const subject = createTestSubject('93.42', 'Cálculo I', 6);
const career = createTestCareer('I', 'Ingeniería Informática', ['2023']);
```

## Coverage Requirements

- **Minimum Global Coverage**: 10% (will increase over time)
- **Target Coverage**: 80%+
- Excluded from coverage:
  - DTOs
  - Interfaces
  - Modules
  - Index files
  - Main entry point

## Coverage Reports

After running `npm run test:cov`, coverage reports are available in:

- **Terminal**: Summary in console
- **HTML**: `coverage/index.html` - Open in browser for detailed view
- **LCOV**: `coverage/lcov.info` - For CI/CD integration

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **One Assertion Per Test**: Focus each test on a single behavior
4. **Mock External Dependencies**: Always mock databases, APIs, and external services
5. **Test Edge Cases**: Include tests for null, undefined, empty arrays, errors
6. **Use Factories**: Utilize test factories for consistent test data
7. **Clean Up**: Use `afterEach` to reset mocks and clean up state

## Common Patterns

### Testing Prisma Error Handling

```typescript
it('should throw custom exception on Prisma error', async () => {
  const prismaError = { code: 'P2002', meta: {} };
  prisma.subject.create.mockRejectedValue(prismaError);

  await expect(repository.create(subject)).rejects.toThrow(
    SubjectAlreadyExistsException
  );
});
```

### Testing NestJS Dependency Injection

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    ServiceUnderTest,
    {
      provide: DEPENDENCY_TOKEN,
      useValue: mockDependency,
    },
  ],
}).compile();
```

## Current Test Coverage

As of the latest update:

- **Test Suites**: 4
- **Total Tests**: 63
- **Coverage**:
  - Subject Repository: 100%
  - Subject Service: 100%
  - Itba Mappers: 100%
  - Subject Controller: ~75%

## Next Steps

To improve coverage further:
1. Add tests for remaining repositories (Career, Classroom, Commission, SubjectPlan)
2. Add tests for remaining services
3. Add tests for remaining controllers
4. Add integration/E2E tests
5. Gradually increase coverage thresholds

## CI/CD Integration

The testing setup is ready for CI/CD integration. Add to your pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:cov

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Test Timeout

If tests timeout, increase the timeout:
```typescript
jest.setTimeout(10000);
```

### Module Resolution

If imports fail, ensure paths are configured in both:
- `tsconfig.json` - paths
- `jest.config.js` - moduleNameMapper

### Prisma Mocking

Always use `jest-mock-extended` for Prisma mocking to avoid type issues.
