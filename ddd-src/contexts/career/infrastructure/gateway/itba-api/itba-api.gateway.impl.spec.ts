import { ItbaApiGatewayImpl } from './itba-api.gateway.impl';
import { ApiClient, ApiResponse } from './api-client.interface';
import {
  ITBACareerPlans,
  ITBACourseCommissions,
  CommissionQueryParams,
} from '../../../domain/interfaces/infrastructure/gateway/itba-api.gateway.interface';
import { DayOfWeek } from '@career/domain/entity/classroom.model';
import { SubjectType } from '@career/domain/entity/commission.model';

describe('ItbaApiGatewayImpl', () => {
  let gateway: ItbaApiGatewayImpl;
  let mockApiClient: jest.Mocked<ApiClient>;
  const testApiToken = 'test-token';

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    };

    gateway = new ItbaApiGatewayImpl(testApiToken, undefined, mockApiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubjectsByPlan', () => {
    it('should fetch and parse subjects from ITBA API', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: {
          careerplan: {
            name: 'Plan 2023',
            career: 'Ingeniería Informática',
            degreeLevel: 'UNDERGRADUATE',
            since: '2023',
            section: [
              {
                name: 'CIENCIAS_BASICAS',
                terms: {
                  term: [
                    {
                      year: '1',
                      period: '1',
                      entries: {
                        entry: [
                          {
                            type: 'subject',
                            name: 'Cálculo I',
                            code: '93.42',
                            credits: '6',
                            dependencies: {
                              dependency: [],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getSubjectsByPlan('2023');

      expect(mockApiClient.get).toHaveBeenCalledWith('/careerPlans/test-token', {
        params: { plan: '2023' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].subjectId).toBe('93.42');
      expect(result[0].planId).toBe('2023');
      expect(result[0].section).toBe('CIENCIAS_BASICAS');
      expect(result[0].year).toBe(1);
      expect(result[0].semester).toBe(1);
      expect(result[0].subject.name).toBe('Cálculo I');
      expect(result[0].subject.credits).toBe(6);
    });

    it('should handle multiple sections', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: {
          careerplan: {
            name: 'Plan 2023',
            career: 'Ingeniería Informática',
            degreeLevel: 'UNDERGRADUATE',
            since: '2023',
            section: [
              {
                name: 'CIENCIAS_BASICAS',
                terms: {
                  term: [
                    {
                      year: '1',
                      period: '1',
                      entries: {
                        entry: [
                          {
                            type: 'subject',
                            name: 'Cálculo I',
                            code: '93.42',
                            credits: '6',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                name: 'PROFESIONALES',
                terms: {
                  term: [
                    {
                      year: '2',
                      period: '1',
                      entries: {
                        entry: [
                          {
                            type: 'subject',
                            name: 'Algoritmos',
                            code: '72.10',
                            credits: '8',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getSubjectsByPlan('2023');

      expect(result).toHaveLength(2);
      expect(result[0].section).toBe('CIENCIAS_BASICAS');
      expect(result[1].section).toBe('PROFESIONALES');
    });

    it('should handle subjects with dependencies', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: {
          careerplan: {
            name: 'Plan 2023',
            career: 'Ingeniería Informática',
            degreeLevel: 'UNDERGRADUATE',
            since: '2023',
            section: [
              {
                name: 'CIENCIAS_BASICAS',
                terms: {
                  term: [
                    {
                      year: '1',
                      period: '2',
                      entries: {
                        entry: [
                          {
                            type: 'subject',
                            name: 'Cálculo II',
                            code: '93.43',
                            credits: '6',
                            dependencies: {
                              dependency: ['93.42'],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getSubjectsByPlan('2023');

      expect(result[0].dependencies).toEqual(['93.42']);
    });

    it('should handle subjects with creditsRequired', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: {
          careerplan: {
            name: 'Plan 2023',
            career: 'Ingeniería Informática',
            degreeLevel: 'UNDERGRADUATE',
            since: '2023',
            section: [
              {
                name: 'ELECTIVAS',
                withoutTerm: {
                  withoutTerm: [
                    {
                      type: 'subject',
                      name: 'Electiva',
                      code: '99.99',
                      credits: '6',
                      creditsRequired: '120',
                    },
                  ],
                },
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getSubjectsByPlan('2023');

      expect(result[0].creditsRequired).toBe(120);
      expect(result[0].year).toBeNull();
      expect(result[0].semester).toBeNull();
    });

    it('should handle single section as object instead of array', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: {
          careerplan: {
            name: 'Plan 2023',
            career: 'Ingeniería Informática',
            degreeLevel: 'UNDERGRADUATE',
            since: '2023',
            section: {
              name: 'CIENCIAS_BASICAS',
              terms: {
                term: [
                  {
                    year: '1',
                    period: '1',
                    entries: {
                      entry: [
                        {
                          type: 'subject',
                          name: 'Cálculo I',
                          code: '93.42',
                          credits: '6',
                        },
                      ],
                    },
                  },
                ],
              },
            } as any,
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getSubjectsByPlan('2023');

      expect(result).toHaveLength(1);
    });

    it('should filter out non-subject entries', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: {
          careerplan: {
            name: 'Plan 2023',
            career: 'Ingeniería Informática',
            degreeLevel: 'UNDERGRADUATE',
            since: '2023',
            section: [
              {
                name: 'CIENCIAS_BASICAS',
                terms: {
                  term: [
                    {
                      year: '1',
                      period: '1',
                      entries: {
                        entry: [
                          {
                            type: 'subject',
                            name: 'Cálculo I',
                            code: '93.42',
                            credits: '6',
                          },
                          {
                            type: 'note',
                            name: 'Some note',
                            code: '',
                            credits: '0',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getSubjectsByPlan('2023');

      expect(result).toHaveLength(1);
      expect(result[0].subject.name).toBe('Cálculo I');
    });

    it('should throw error when API returns error', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: null,
        error: {
          code: 'API_ERROR',
          message: 'Invalid plan ID',
        },
        status: 400,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      await expect(gateway.getSubjectsByPlan('invalid')).rejects.toThrow(
        'API Error: Invalid plan ID'
      );
    });

    it('should throw error when no data is returned', async () => {
      const mockApiResponse: ApiResponse<ITBACareerPlans> = {
        data: null,
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      await expect(gateway.getSubjectsByPlan('2023')).rejects.toThrow(
        'No data received from ITBA API'
      );
    });
  });

  describe('getAllSubjects', () => {
    it('should return empty array', async () => {
      const result = await gateway.getAllSubjects();
      expect(result).toEqual([]);
    });
  });

  describe('getCommissions', () => {
    it('should fetch commissions with default parameters', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Cálculo I',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions();

      expect(mockApiClient.get).toHaveBeenCalledTimes(2); // Once for GRADUATE, once for UNDERGRADUATE
      expect(result).toHaveLength(2); // Each level returns the same commission
      expect(result[0].id).toBe('COMM-001');
      expect(result[0].subjectCode).toBe('93.42');
      expect(result[0].commissionName).toBe('A');
      expect(result[0].enrolledStudents).toBe(30);
      expect(result[0].quota).toBe(40);
      expect(result[0].times).toHaveLength(1);
    });

    it('should use provided query parameters', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const params: CommissionQueryParams = {
        year: 2024,
        period: 'FirstSemester',
        levels: ['GRADUATE'],
      };

      await gateway.getCommissions(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/courseCommissions/test-token', {
        params: {
          level: 'GRADUATE',
          year: '2024',
          period: 'FirstSemester',
        },
      });
    });

    it('should skip specific subject codes (99.52 and 99.56)', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '99.52',
                subjectName: 'Subject to skip',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
              {
                commissionId: 'COMM-002',
                subjectCode: '93.42',
                subjectName: 'Normal Subject',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'B',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'TUESDAY',
                    classRoom: 'A-102',
                    building: 'Aula',
                    hourFrom: '10:00',
                    hourTo: '12:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result).toHaveLength(1);
      expect(result[0].subjectCode).toBe('93.42');
    });

    it('should normalize building names', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'External',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].times[0].building).toBe('Online');
    });

    it('should handle "Sede Distrito Financiero" building normalization', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'SDF-101',
                    building: 'Sede Distrito Financiero',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].times[0].building).toBe('SDF');
    });

    it('should handle "Sede Rectorado" building normalization', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'SDR-101',
                    building: 'Sede Rectorado',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].times[0].building).toBe('SDR');
    });

    it('should set classroom to "Virtual Asincrónico" when not provided', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: '',
                    building: 'Online',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].times[0].classroom).toBe('Virtual Asincrónico');
    });

    it('should remove duplicate commission times', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].times).toHaveLength(1);
    });

    it('should handle courses without times gracefully', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: null as any,
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      // Suppress console.warn during this test since it's expected behavior
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      // Should skip courses without times
      expect(result).toHaveLength(0);
    });

    it('should handle API errors gracefully and continue', async () => {
      const errorResponse: ApiResponse<ITBACourseCommissions> = {
        data: null,
        error: {
          code: 'API_ERROR',
          message: 'Some error',
        },
        status: 500,
      };

      const successResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await gateway.getCommissions();

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toHaveLength(1);

      consoleSpy.mockRestore();
    });

    it('should map subject types correctly', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'ANNUAL',
                courseStart: '01/03/24',
                courseEnd: '31/12/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].subjectType).toBe(SubjectType.ANNUAL);
    });

    it('should map days of week correctly', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'WEDNESDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].times[0].day).toBe(DayOfWeek.WEDNESDAY);
    });

    it('should parse dates correctly', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '15/03/24',
                courseEnd: '20/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].courseStart.getDate()).toBe(15);
      expect(result[0].courseStart.getMonth()).toBe(2); // March (0-indexed)
      expect(result[0].courseStart.getFullYear()).toBe(2024);

      expect(result[0].courseEnd.getDate()).toBe(20);
      expect(result[0].courseEnd.getMonth()).toBe(6); // July (0-indexed)
    });

    it('should parse time correctly with fixed epoch date', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Test',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '14:30',
                    hourTo: '16:45',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissions({ levels: ['GRADUATE'] });

      expect(result[0].times[0].hourFrom.getHours()).toBe(14);
      expect(result[0].times[0].hourFrom.getMinutes()).toBe(30);
      expect(result[0].times[0].hourTo.getHours()).toBe(16);
      expect(result[0].times[0].hourTo.getMinutes()).toBe(45);

      // Verify epoch date (1970-01-01)
      expect(result[0].times[0].hourFrom.getFullYear()).toBe(1970);
      expect(result[0].times[0].hourFrom.getMonth()).toBe(0);
      expect(result[0].times[0].hourFrom.getDate()).toBe(1);
    });
  });

  describe('getCommissionsBySubject', () => {
    it('should filter commissions by subject code', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Cálculo I',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
              {
                commissionId: 'COMM-002',
                subjectCode: '93.50',
                subjectName: 'Probabilidad',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'B',
                quota: '35',
                enrolledStudents: '25',
                courseCommissionTimes: [
                  {
                    day: 'TUESDAY',
                    classRoom: 'A-102',
                    building: 'Aula',
                    hourFrom: '10:00',
                    hourTo: '12:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissionsBySubject('93.42', {
        levels: ['GRADUATE'], // Use single level to get predictable results
      });

      expect(result).toHaveLength(1);
      expect(result[0].subjectCode).toBe('93.42');
      expect(result[0].id).toBe('COMM-001');
    });

    it('should return empty array when no commissions match subject code', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [
              {
                commissionId: 'COMM-001',
                subjectCode: '93.42',
                subjectName: 'Cálculo I',
                subjectType: 'SEMESTRAL',
                courseStart: '01/03/24',
                courseEnd: '31/07/24',
                commissionName: 'A',
                quota: '40',
                enrolledStudents: '30',
                courseCommissionTimes: [
                  {
                    day: 'MONDAY',
                    classRoom: 'A-101',
                    building: 'Aula',
                    hourFrom: '08:00',
                    hourTo: '10:00',
                  },
                ],
              },
            ],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const result = await gateway.getCommissionsBySubject('99.99');

      expect(result).toEqual([]);
    });

    it('should pass query parameters to getCommissions', async () => {
      const mockApiResponse: ApiResponse<ITBACourseCommissions> = {
        data: {
          courseCommissions: {
            courseCommission: [],
          },
        },
        error: null,
        status: 200,
      };

      mockApiClient.get.mockResolvedValue(mockApiResponse);

      const params: CommissionQueryParams = {
        year: 2024,
        period: 'SecondSemester',
      };

      await gateway.getCommissionsBySubject('93.42', params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/courseCommissions/test-token',
        expect.objectContaining({
          params: expect.objectContaining({
            year: '2024',
            period: 'SecondSemester',
          }),
        })
      );
    });
  });
});
