import { DayOfWeek, DayOfWeekMapper } from './day-of-week.types';

describe('DayOfWeek', () => {
  describe('enum values', () => {
    it('should have correct capitalized string values', () => {
      expect(DayOfWeek.MONDAY).toBe('Monday');
      expect(DayOfWeek.TUESDAY).toBe('Tuesday');
      expect(DayOfWeek.WEDNESDAY).toBe('Wednesday');
      expect(DayOfWeek.THURSDAY).toBe('Thursday');
      expect(DayOfWeek.FRIDAY).toBe('Friday');
      expect(DayOfWeek.SATURDAY).toBe('Saturday');
      expect(DayOfWeek.SUNDAY).toBe('Sunday');
      expect(DayOfWeek.INVALID).toBe('Invalid');
    });
  });
});

describe('DayOfWeekMapper', () => {
  describe('fromString', () => {
    it('should convert lowercase day strings to DayOfWeek enum', () => {
      expect(DayOfWeekMapper.fromString('monday')).toBe(DayOfWeek.MONDAY);
      expect(DayOfWeekMapper.fromString('tuesday')).toBe(DayOfWeek.TUESDAY);
      expect(DayOfWeekMapper.fromString('wednesday')).toBe(DayOfWeek.WEDNESDAY);
      expect(DayOfWeekMapper.fromString('thursday')).toBe(DayOfWeek.THURSDAY);
      expect(DayOfWeekMapper.fromString('friday')).toBe(DayOfWeek.FRIDAY);
      expect(DayOfWeekMapper.fromString('saturday')).toBe(DayOfWeek.SATURDAY);
      expect(DayOfWeekMapper.fromString('sunday')).toBe(DayOfWeek.SUNDAY);
    });

    it('should convert capitalized day strings to DayOfWeek enum', () => {
      expect(DayOfWeekMapper.fromString('Monday')).toBe(DayOfWeek.MONDAY);
      expect(DayOfWeekMapper.fromString('Tuesday')).toBe(DayOfWeek.TUESDAY);
      expect(DayOfWeekMapper.fromString('Friday')).toBe(DayOfWeek.FRIDAY);
    });

    it('should convert uppercase day strings to DayOfWeek enum', () => {
      expect(DayOfWeekMapper.fromString('MONDAY')).toBe(DayOfWeek.MONDAY);
      expect(DayOfWeekMapper.fromString('FRIDAY')).toBe(DayOfWeek.FRIDAY);
    });

    it('should return null for null/undefined/empty string by default', () => {
      expect(DayOfWeekMapper.fromString(null)).toBeNull();
      expect(DayOfWeekMapper.fromString(undefined)).toBeNull();
      expect(DayOfWeekMapper.fromString('')).toBeNull();
    });

    it('should return default value when provided for null/undefined/empty', () => {
      expect(DayOfWeekMapper.fromString(null, DayOfWeek.INVALID)).toBe(DayOfWeek.INVALID);
      expect(DayOfWeekMapper.fromString(undefined, DayOfWeek.MONDAY)).toBe(DayOfWeek.MONDAY);
      expect(DayOfWeekMapper.fromString('', DayOfWeek.INVALID)).toBe(DayOfWeek.INVALID);
    });

    it('should throw error for invalid day strings', () => {
      expect(() => DayOfWeekMapper.fromString('invalid')).toThrow();
      expect(() => DayOfWeekMapper.fromString('InvalidDay')).toThrow(
        'Invalid day: InvalidDay. Valid days are: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
      );
    });
  });

  describe('isValid', () => {
    it('should return true for valid day strings (case-insensitive)', () => {
      expect(DayOfWeekMapper.isValid('monday')).toBe(true);
      expect(DayOfWeekMapper.isValid('Monday')).toBe(true);
      expect(DayOfWeekMapper.isValid('MONDAY')).toBe(true);
      expect(DayOfWeekMapper.isValid('friday')).toBe(true);
      expect(DayOfWeekMapper.isValid('sunday')).toBe(true);
    });

    it('should return false for invalid day strings', () => {
      expect(DayOfWeekMapper.isValid('invalid')).toBe(false);
      expect(DayOfWeekMapper.isValid('InvalidDay')).toBe(false);
      expect(DayOfWeekMapper.isValid('')).toBe(false);
      expect(DayOfWeekMapper.isValid('Mon')).toBe(false);
    });
  });

  describe('getAllValidDays', () => {
    it('should return array of all valid day strings in lowercase', () => {
      const days = DayOfWeekMapper.getAllValidDays();
      expect(days).toEqual([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]);
    });
  });

  describe('fromUppercase', () => {
    it('should convert uppercase format to DayOfWeek enum', () => {
      expect(DayOfWeekMapper.fromUppercase('MONDAY')).toBe(DayOfWeek.MONDAY);
      expect(DayOfWeekMapper.fromUppercase('TUESDAY')).toBe(DayOfWeek.TUESDAY);
      expect(DayOfWeekMapper.fromUppercase('FRIDAY')).toBe(DayOfWeek.FRIDAY);
    });

    it('should convert mixed case uppercase format to DayOfWeek enum', () => {
      expect(DayOfWeekMapper.fromUppercase('Monday')).toBe(DayOfWeek.MONDAY);
      expect(DayOfWeekMapper.fromUppercase('monday')).toBe(DayOfWeek.MONDAY);
    });

    it('should return null for null/undefined/empty string by default', () => {
      expect(DayOfWeekMapper.fromUppercase(null)).toBeNull();
      expect(DayOfWeekMapper.fromUppercase(undefined)).toBeNull();
      expect(DayOfWeekMapper.fromUppercase('')).toBeNull();
    });

    it('should return default value when provided', () => {
      expect(DayOfWeekMapper.fromUppercase(null, DayOfWeek.INVALID)).toBe(DayOfWeek.INVALID);
    });

    it('should throw error for invalid uppercase day strings', () => {
      expect(() => DayOfWeekMapper.fromUppercase('INVALID')).toThrow();
    });
  });

  describe('toUppercase', () => {
    it('should convert DayOfWeek enum to uppercase format', () => {
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.MONDAY)).toBe('MONDAY');
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.TUESDAY)).toBe('TUESDAY');
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.WEDNESDAY)).toBe('WEDNESDAY');
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.THURSDAY)).toBe('THURSDAY');
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.FRIDAY)).toBe('FRIDAY');
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.SATURDAY)).toBe('SATURDAY');
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.SUNDAY)).toBe('SUNDAY');
    });

    it('should handle INVALID enum value', () => {
      expect(DayOfWeekMapper.toUppercase(DayOfWeek.INVALID)).toBe('INVALID');
    });
  });
});
