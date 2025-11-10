/**
 * Shared DayOfWeek enum used across the ITBA domain
 * Uses capitalized format (e.g., 'Monday') as the canonical representation
 */
export enum DayOfWeek {
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday',
    SUNDAY = 'Sunday',
    INVALID = 'Invalid'
}

/**
 * Utility class for mapping and validating day of week strings
 */
export class DayOfWeekMapper {
    private static readonly dayMap: Record<string, DayOfWeek> = {
        'monday': DayOfWeek.MONDAY,
        'tuesday': DayOfWeek.TUESDAY,
        'wednesday': DayOfWeek.WEDNESDAY,
        'thursday': DayOfWeek.THURSDAY,
        'friday': DayOfWeek.FRIDAY,
        'saturday': DayOfWeek.SATURDAY,
        'sunday': DayOfWeek.SUNDAY
    };

    /**
     * Convert a string to DayOfWeek enum (case-insensitive)
     * @param day - Day string to convert, or null/undefined
     * @param defaultValue - Value to return for null/undefined input (defaults to null)
     * @returns DayOfWeek enum value, or defaultValue for null/undefined input
     * @throws Error if the day string is invalid
     */
    public static fromString(day: string | null | undefined, defaultValue: DayOfWeek | null = null): DayOfWeek | null {
        if (day === null || day === undefined || day === '') {
            return defaultValue;
        }

        const normalizedDay = day.toLowerCase();
        const dayOfWeek = this.dayMap[normalizedDay];

        if (!dayOfWeek) {
            throw new Error(`Invalid day: ${day}. Valid days are: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday`);
        }

        return dayOfWeek;
    }

    /**
     * Check if a day string is valid
     */
    public static isValid(day: string): boolean {
        const normalizedDay = day.toLowerCase();
        return normalizedDay in this.dayMap;
    }

    /**
     * Get all valid day strings
     */
    public static getAllValidDays(): string[] {
        return Object.keys(this.dayMap);
    }

    /**
     * Convert from uppercase format (MONDAY) to canonical format (Monday)
     * @param day - Day string in uppercase format
     * @param defaultValue - Value to return for null/undefined input (defaults to null)
     * @returns DayOfWeek enum value or defaultValue
     * @throws Error if the day string is invalid
     */
    public static fromUppercase(day: string | null | undefined, defaultValue: DayOfWeek | null = null): DayOfWeek | null {
        if (day === null || day === undefined || day === '') {
            return defaultValue;
        }
        const capitalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
        return this.fromString(capitalized, defaultValue);
    }

    /**
     * Convert a string to DayOfWeek or return null on invalid input.
     * Never throws.
     */
    public static fromStringOrNull(day: string | null | undefined): DayOfWeek | null {
        if (day === null || day === undefined || day === '') {
            return null;
        }

        const normalized = day.toLowerCase();
        const value = this.dayMap[normalized];

        if (!value) {
            return null;
        }

        return value;
    }


    /**
     * Convert DayOfWeek enum to uppercase format (MONDAY)
     */
    public static toUppercase(day: DayOfWeek): string {
        if (day === DayOfWeek.INVALID) {
            return 'INVALID';
        }
        return day.toUpperCase();
    }
}
