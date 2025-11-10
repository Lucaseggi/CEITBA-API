import { NotFoundException } from '@nestjs/common';
import { CareerController } from './career.controller';
import { CareerService } from '../../application/services/career.service';
import { createTestCareer } from 'test/utils/test-factories';

describe('CareerController', () => {
  let controller: CareerController;
  let service: jest.Mocked<CareerService>;
  beforeEach(() => {
    service = {
      getAllCareers: jest.fn(),
      getCareerById: jest.fn(),
      createCareer: jest.fn(),
      updateCareer: jest.fn(),
      deleteCareer: jest.fn(),
      getCareersWithPlans: jest.fn(),
      addPlanToCareer: jest.fn(),
      removePlanFromCareer: jest.fn(),
    } as unknown as jest.Mocked<CareerService>;

    controller = new CareerController(service); 
  });
  describe('getCareerPlans', () => {
    it('should return careers with their plans', async () => {
      const mockCareersWithPlans = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023', '2015']),
        E: createTestCareer('E', 'Ingeniería Electrónica', ['2020']),
      };

      service.getCareersWithPlans.mockResolvedValue(mockCareersWithPlans);

      const result = await controller.getCareerPlans();

      expect(service.getCareersWithPlans).toHaveBeenCalledTimes(1);
      expect(result).toEqual(Object.values(mockCareersWithPlans));
    });

    it('should return empty array when no careers with plans exist', async () => {
      service.getCareersWithPlans.mockResolvedValue({});

      const result = await controller.getCareerPlans();

      expect(result).toEqual([]);
    });
  });

  describe('getAllCareers', () => {
    it('should return all careers', async () => {
      const mockCareers = [
        createTestCareer('I', 'Ingeniería Informática', ['2023']),
        createTestCareer('E', 'Ingeniería Electrónica', ['2020']),
      ];

      service.getAllCareers.mockResolvedValue(mockCareers);

      const result = await controller.getAllCareers();

      expect(service.getAllCareers).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCareers);
    });

    it('should return empty array when no careers exist', async () => {
      service.getAllCareers.mockResolvedValue([]);

      const result = await controller.getAllCareers();

      expect(result).toEqual([]);
    });
  });

  describe('getCareerById', () => {
    it('should return career when found', async () => {
      const mockCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);
      service.getCareerById.mockResolvedValue(mockCareer);

      const result = await controller.getCareerById('I');

      expect(service.getCareerById).toHaveBeenCalledWith('I');
      expect(result).toEqual(mockCareer);
    });

    it('should throw NotFoundException when career not found', async () => {
      service.getCareerById.mockResolvedValue(null);

      await expect(controller.getCareerById('NON_EXISTENT')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.getCareerById('NON_EXISTENT')).rejects.toThrow(
        'Career not found'
      );
    });
  });

  describe('createCareer', () => {
    it('should create and return new career', async () => {
      const createDto = { id: 'I', name: 'Ingeniería Informática' };
      const mockCareer = createTestCareer('I', 'Ingeniería Informática', []);

      service.createCareer.mockResolvedValue(mockCareer);

      const result = await controller.createCareer(createDto);

      expect(service.createCareer).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCareer);
    });
  });

  describe('updateCareer', () => {
    it('should update and return career when found', async () => {
      const updateDto = { name: 'Ingeniería Informática Updated' };
      const mockCareer = createTestCareer('I', 'Ingeniería Informática Updated', ['2023']);

      service.updateCareer.mockResolvedValue(mockCareer);

      const result = await controller.updateCareer('I', updateDto);

      expect(service.updateCareer).toHaveBeenCalledWith('I', updateDto);
      expect(result).toEqual(mockCareer);
    });

    it('should throw NotFoundException when career not found', async () => {
      const updateDto = { name: 'Updated Name' };
      service.updateCareer.mockResolvedValue(null);

      await expect(controller.updateCareer('NON_EXISTENT', updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.updateCareer('NON_EXISTENT', updateDto)).rejects.toThrow(
        'Career not found'
      );
    });
  });

  describe('deleteCareer', () => {
    it('should delete career when found', async () => {
      service.deleteCareer.mockResolvedValue(true);

      const result = await controller.deleteCareer('I');

      expect(service.deleteCareer).toHaveBeenCalledWith('I');
      expect(result).toEqual({ message: 'Career deleted successfully' });
    });

    it('should throw NotFoundException when career not found', async () => {
      service.deleteCareer.mockResolvedValue(false);

      await expect(controller.deleteCareer('NON_EXISTENT')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.deleteCareer('NON_EXISTENT')).rejects.toThrow(
        'Career not found'
      );
    });
  });
});
