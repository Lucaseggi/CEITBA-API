import { SubjectPlan } from "../../../entity/subject-plan.model";
import { SubjectPlanFilters } from "../../../entity/subject-plan-filters";

export interface SubjectPlanRepositoryInterface {
    find(filters: SubjectPlanFilters): Promise<SubjectPlan[]>;
    findAll(): Promise<SubjectPlan[]>;
    findByPlanId(planId: string): Promise<SubjectPlan[]>;
    findByPlanAndSubject(planId: string, subjectId: string): Promise<SubjectPlan | null>;
    findBySection(planId: string, section: string): Promise<SubjectPlan[]>;
    findElectives(planId: string): Promise<SubjectPlan[]>;
    findByYear(planId: string, year: number): Promise<SubjectPlan[]>;
    findBySemester(planId: string, year: number, semester: number): Promise<SubjectPlan[]>;
    create(subjectPlan: SubjectPlan): Promise<SubjectPlan>;
    update(subjectPlan: SubjectPlan): Promise<SubjectPlan>;
    delete(planId: string, subjectId: string): Promise<void>;
}
