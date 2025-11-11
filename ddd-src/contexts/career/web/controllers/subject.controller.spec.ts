import { NotFoundException } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectServiceInterface } from '../../domain/interfaces/application/subject.service.interface';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';
import { Subject } from '../../domain/entity/subject.model';

const buildSubject = (id = '93.42', name = 'Cálculo I', credits = 6) =>
    new Subject(id, name, credits);

describe('SubjectController', () => {
    let controller: SubjectController;
    let subjectService: jest.Mocked<SubjectServiceInterface>;
    let subjectPlanService: jest.Mocked<SubjectPlanServiceInterface>;

    beforeEach(() => {
        subjectService = {
            getAllSubjects: jest.fn(),
            getSubjectsByName: jest.fn(),
            getSubjectById: jest.fn(),
        } as unknown as jest.Mocked<SubjectServiceInterface>;

        subjectPlanService = {
            getSubjectsByPlanOrganized: jest.fn(),
        } as unknown as jest.Mocked<SubjectPlanServiceInterface>;

        controller = new SubjectController(subjectService, subjectPlanService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSubjectsByPlan', () => {
        it('should return organized subjects when plan exists and has subjects', async () => {
            const mockOrganizedSubjects = {
                'CIENCIAS_BASICAS': {
                    '1': {
                        '1': [
                            {
                                section: 'CIENCIAS_BASICAS',
                                subject_id: '93.42',
                                name: 'Cálculo I',
                                credits: 6,
                                dependencies: [],
                                credits_required: null,
                                course_start: '2024-03-01',
                                course_end: '2024-07-31',
                                commissions: []
                            }
                        ]
                    }
                }
            };

            subjectPlanService.getSubjectsByPlanOrganized.mockResolvedValue(mockOrganizedSubjects);

            const result = await controller.getSubjectsByPlan('S10-Rev23');

            expect(subjectPlanService.getSubjectsByPlanOrganized).toHaveBeenCalledWith('S10-Rev23');
            expect(result).toEqual(mockOrganizedSubjects);
        });

        it('should throw NotFoundException when plan parameter is not provided', async () => {
            await expect(controller.getSubjectsByPlan('')).rejects.toThrow(NotFoundException);
            await expect(controller.getSubjectsByPlan('')).rejects.toThrow('Plan parameter is required');

            expect(subjectPlanService.getSubjectsByPlanOrganized).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when plan parameter is null', async () => {
            await expect(controller.getSubjectsByPlan(null as any)).rejects.toThrow(NotFoundException);
            await expect(controller.getSubjectsByPlan(null as any)).rejects.toThrow('Plan parameter is required');
        });

        it('should throw NotFoundException when plan parameter is undefined', async () => {
            await expect(controller.getSubjectsByPlan(undefined as any)).rejects.toThrow(NotFoundException);
            await expect(controller.getSubjectsByPlan(undefined as any)).rejects.toThrow('Plan parameter is required');
        });

        it('should throw NotFoundException when no subjects found for plan (empty object)', async () => {
            subjectPlanService.getSubjectsByPlanOrganized.mockResolvedValue({});

            await expect(controller.getSubjectsByPlan('INVALID-PLAN')).rejects.toThrow(NotFoundException);
            await expect(controller.getSubjectsByPlan('INVALID-PLAN')).rejects.toThrow(
                'No subjects found for the specified plan'
            );

            expect(subjectPlanService.getSubjectsByPlanOrganized).toHaveBeenCalledWith('INVALID-PLAN');
        });

        it('should return organized subjects with multiple sections', async () => {
            const mockOrganizedSubjects = {
                'CIENCIAS_BASICAS': {
                    '1': {
                        '1': [
                            {
                                section: 'CIENCIAS_BASICAS',
                                subject_id: '93.42',
                                name: 'Cálculo I',
                                credits: 6,
                                dependencies: [],
                                credits_required: null,
                                course_start: '2024-03-01',
                                course_end: '2024-07-31',
                                commissions: []
                            }
                        ]
                    }
                },
                'PROFESIONALES': {
                    '2': {
                        '1': [
                            {
                                section: 'PROFESIONALES',
                                subject_id: '72.10',
                                name: 'Algoritmos',
                                credits: 8,
                                dependencies: ['93.42'],
                                credits_required: 30,
                                course_start: '2024-08-01',
                                course_end: '2024-12-20',
                                commissions: []
                            }
                        ]
                    }
                }
            };

            subjectPlanService.getSubjectsByPlanOrganized.mockResolvedValue(mockOrganizedSubjects);

            const result = await controller.getSubjectsByPlan('S10-Rev23');

            expect(result).toEqual(mockOrganizedSubjects);
            expect(Object.keys(result)).toHaveLength(2);
        });

        it('should return organized subjects with multiple years and semesters', async () => {
            const mockOrganizedSubjects = {
                'CIENCIAS_BASICAS': {
                    '1': {
                        '1': [
                            {
                                section: 'CIENCIAS_BASICAS',
                                subject_id: '93.42',
                                name: 'Cálculo I',
                                credits: 6,
                                dependencies: [],
                                credits_required: null,
                                course_start: '2024-03-01',
                                course_end: '2024-07-31',
                                commissions: []
                            }
                        ],
                        '2': [
                            {
                                section: 'CIENCIAS_BASICAS',
                                subject_id: '93.43',
                                name: 'Cálculo II',
                                credits: 6,
                                dependencies: ['93.42'],
                                credits_required: null,
                                course_start: '2024-08-01',
                                course_end: '2024-12-20',
                                commissions: []
                            }
                        ]
                    },
                    '2': {
                        '1': [
                            {
                                section: 'CIENCIAS_BASICAS',
                                subject_id: '93.50',
                                name: 'Probabilidad',
                                credits: 6,
                                dependencies: ['93.42'],
                                credits_required: null,
                                course_start: '2025-03-01',
                                course_end: '2025-07-31',
                                commissions: []
                            }
                        ]
                    }
                }
            };

            subjectPlanService.getSubjectsByPlanOrganized.mockResolvedValue(mockOrganizedSubjects);

            const result = await controller.getSubjectsByPlan('S10-Rev23');

            expect(result).toEqual(mockOrganizedSubjects);
            expect(result['CIENCIAS_BASICAS']['1']).toHaveProperty('1');
            expect(result['CIENCIAS_BASICAS']['1']).toHaveProperty('2');
            expect(result['CIENCIAS_BASICAS']).toHaveProperty('2');
        });

        it('should handle whitespace-only plan parameter as invalid', async () => {
            // Whitespace is truthy, so it passes the initial check but service returns empty object
            subjectPlanService.getSubjectsByPlanOrganized.mockResolvedValue({});

            await expect(controller.getSubjectsByPlan('   ')).rejects.toThrow(NotFoundException);
            await expect(controller.getSubjectsByPlan('   ')).rejects.toThrow('No subjects found for the specified plan');
        });

        it('should call service with exact plan parameter provided', async () => {
            const mockOrganizedSubjects = {
                'CIENCIAS_BASICAS': {
                    '1': {
                        '1': [
                            {
                                section: 'CIENCIAS_BASICAS',
                                subject_id: '93.42',
                                name: 'Cálculo I',
                                credits: 6,
                                dependencies: [],
                                credits_required: null,
                                course_start: '2024-03-01',
                                course_end: '2024-07-31',
                                commissions: []
                            }
                        ]
                    }
                }
            };

            subjectPlanService.getSubjectsByPlanOrganized.mockResolvedValue(mockOrganizedSubjects);

            await controller.getSubjectsByPlan('CUSTOM-PLAN-2024');

            expect(subjectPlanService.getSubjectsByPlanOrganized).toHaveBeenCalledWith('CUSTOM-PLAN-2024');
            expect(subjectPlanService.getSubjectsByPlanOrganized).toHaveBeenCalledTimes(1);
        });
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
