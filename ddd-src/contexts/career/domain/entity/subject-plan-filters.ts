export class SubjectPlanFilters {
    constructor(
        public readonly planId?: string,
        public readonly subjectId?: string,
        public readonly section?: string,
        public readonly year?: number,
        public readonly semester?: number,
        public readonly electivesOnly?: boolean,
    ) {}

    static fromQueryParams(params: {
        planId?: string;
        subjectId?: string;
        section?: string;
        year?: number;
        semester?: number;
        electivesOnly?: boolean;
    }): SubjectPlanFilters {
        return new SubjectPlanFilters(
            params.planId,
            params.subjectId,
            params.section,
            params.year,
            params.semester,
            params.electivesOnly,
        );
    }

    hasAnyFilter(): boolean {
        return !!(
            this.planId ||
            this.subjectId ||
            this.section ||
            this.year !== undefined ||
            this.semester !== undefined ||
            this.electivesOnly
        );
    }

    isElectivesFilter(): boolean {
        return this.electivesOnly === true;
    }

    toPlainObject(): {
        planId?: string;
        subjectId?: string;
        section?: string;
        year?: number;
        semester?: number;
        electivesOnly?: boolean;
    } {
        return {
            ...(this.planId && { planId: this.planId }),
            ...(this.subjectId && { subjectId: this.subjectId }),
            ...(this.section && { section: this.section }),
            ...(this.year !== undefined && { year: this.year }),
            ...(this.semester !== undefined && { semester: this.semester }),
            ...(this.electivesOnly !== undefined && { electivesOnly: this.electivesOnly }),
        };
    }
}
