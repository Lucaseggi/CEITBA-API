export interface SubjectPlanDto {
  subjectId: string;
  planId: string;
  section: string;
  year: number | null;
  semester: number | null;
  dependencies: string[];
  creditsRequired: number | null;
  subject: {
    id: string;
    name: string;
    credits: number;
  };
}

export type CreateSubjectPlanDto = Omit<SubjectPlanDto, "subject">;