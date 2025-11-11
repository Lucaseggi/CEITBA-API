import { SubjectPlan } from "../../entity/subject-plan.model";
import { SubjectPlanFilters } from "../../entity/subject-plan-filters";

export interface SubjectPlanServiceInterface {
    getSubjectsByPlanWithFilters(filters: SubjectPlanFilters): Promise<SubjectPlan[]>;

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
