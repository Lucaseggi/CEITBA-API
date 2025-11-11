import { SubjectPlan } from "../../entity/subject-plan.model";

export interface SubjectPlanServiceInterface {
    getSubjectsByPlanWithFilters(
        planId: string,
        filters: {
            year?: number;
            semester?: number;
            section?: string;
            electivesOnly?: boolean;
        }
    ): Promise<SubjectPlan[]>;

    getSubjectPlan(planId: string, subjectId: string): Promise<SubjectPlan | null>;

    createSubjectPlan(
        subjectId: string,
        planId: string,
        section: string,
        year: number | null,
        semester: number | null,
        dependencies: string[],
        creditsRequired: number | null
    ): Promise<SubjectPlan>;

    updateSubjectPlan(
        planId: string,
        subjectId: string,
        updateData: {
            section?: string;
            year?: number | null;
            semester?: number | null;
            dependencies?: string[];
            creditsRequired?: number | null;
        }
    ): Promise<SubjectPlan | null>;

    deleteSubjectPlan(planId: string, subjectId: string): Promise<boolean>;
}
