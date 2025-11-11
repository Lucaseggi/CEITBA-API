export interface CareerDto {
  id: string;
  name: string;
  plans: string[];
}

export type CreateCareerDto = Pick<CareerDto, "id" | "name">;