import { CreateCareerDto } from "ddd-src/contexts/career/application/dtos/career.dto";
import { Career } from "../../entity/career.model";

export interface CareerServiceInterface {
    getAllCareers(): Promise<Career[]>;
    getCareerById(id: string): Promise<Career | null>;
    createCareer(createCareerDto: CreateCareerDto): Promise<Career>;
    updateCareer(id: string, updateData: Partial<CreateCareerDto>): Promise<Career | null>;
    deleteCareer(id: string): Promise<boolean>;
    getCareersWithPlans(): Promise<Record<string, Career>>;
    addPlanToCareer(careerId: string, planId: string): Promise<Career | null>;
    removePlanFromCareer(careerId: string, planId: string): Promise<Career | null>;
}
