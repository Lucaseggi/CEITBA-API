import { SubjectPlan } from "../../../entity/subject-plan.model";
import { SubjectPlanFilters } from "../../../entity/subject-plan-filters";

export interface SubjectPlanRepositoryInterface {
    find(filters: SubjectPlanFilters): Promise<SubjectPlan[]>;
    findAll(): Promise<SubjectPlan[]>;
    findByPlanAndSubject(planId: string, subjectId: string): Promise<SubjectPlan | null>;
    create(subjectPlan: SubjectPlan): Promise<SubjectPlan>;
    update(subjectPlan: SubjectPlan): Promise<SubjectPlan>;
    delete(planId: string, subjectId: string): Promise<void>;
}
