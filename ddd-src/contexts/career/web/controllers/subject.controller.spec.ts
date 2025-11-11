import { NotFoundException } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectServiceInterface } from '../../domain/interfaces/application/subject.service.interface';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';
import { CommissionRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/commission.repository.interface';
import { Subject } from '../../domain/entity/subject.model';

const buildSubject = (id = '93.42', name = 'Cálculo I', credits = 6) =>
    new Subject(id, name, credits);

describe('SubjectController', () => {
    let controller: SubjectController;
    let subjectService: jest.Mocked<SubjectServiceInterface>;
    let subjectPlanService: jest.Mocked<SubjectPlanServiceInterface>;
    let commissionRepository: jest.Mocked<CommissionRepositoryInterface>;

    beforeEach(() => {
        subjectService = {
            getAllSubjects: jest.fn(),
            getSubjectsByName: jest.fn(),
            getSubjectById: jest.fn(),
        } as unknown as jest.Mocked<SubjectServiceInterface>;

        subjectPlanService = {
            getSubjectsByPlanWithFilters: jest.fn(),
        } as unknown as jest.Mocked<SubjectPlanServiceInterface>;

        commissionRepository = {
            findAll: jest.fn(),
        } as unknown as jest.Mocked<CommissionRepositoryInterface>;

        controller = new SubjectController(subjectService, subjectPlanService, commissionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSubjectById', () => {
        it('returns a subject when found', async () => {
            const subject = buildSubject('93.50', 'Probabilidad', 6);
            subjectService.getSubjectById.mockResolvedValue(subject);

            const result = await controller.getSubjectById('93.50');

            expect(subjectService.getSubjectById).toHaveBeenCalledWith('93.50');
            expect(result).toEqual({ id: '93.50', name: 'Probabilidad', credits: 6 });
        });

        it('throws NotFoundException when subject does not exist', async () => {
            subjectService.getSubjectById.mockResolvedValue(null);

            await expect(controller.getSubjectById('missing')).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
