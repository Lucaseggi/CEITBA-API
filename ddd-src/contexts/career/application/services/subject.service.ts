import { Injectable, Inject } from '@nestjs/common';
import { Subject } from '../../domain/entity/subject.model';
import { SubjectRepository } from '../../domain/interfaces/infrastructure/repositories/subject.repository.interface';
import { SubjectServiceInterface } from '../../domain/interfaces/application/subject.service.interface';
import { SUBJECT_REPOSITORY } from '@/shared/constants/injection-tokens';
import { CreateSubjectDto } from '../dtos/subject.dto';

@Injectable()
export class SubjectService implements SubjectServiceInterface {
    constructor(@Inject(SUBJECT_REPOSITORY) private readonly subjectRepository: SubjectRepository) {}

    async getAllSubjects(): Promise<Subject[]> {
        return await this.subjectRepository.findAll();
    }

    async getSubjectById(id: string): Promise<Subject | null> {
        return await this.subjectRepository.findById(id);
    }

    async getSubjectsByName(name: string): Promise<Subject[]> {
        return await this.subjectRepository.findByName(name);
    }

    async createSubject(createSubjectDto: CreateSubjectDto): Promise<Subject> {
        const subject = new Subject(
            createSubjectDto.id,
            createSubjectDto.name,
            createSubjectDto.credits
        );
        return await this.subjectRepository.create(subject);
    }

    async updateSubject(id: string, updateData: Partial<CreateSubjectDto>): Promise<Subject | null> {
        const existingSubject = await this.subjectRepository.findById(id);
        if (!existingSubject) {
            return null;
        }

        const updatedSubject = new Subject(
            id,
            updateData.name ?? existingSubject.name,
            updateData.credits ?? existingSubject.credits
        );

        return await this.subjectRepository.update(updatedSubject);
    }

    async deleteSubject(id: string): Promise<boolean> {
        const existingSubject = await this.subjectRepository.findById(id);
        if (!existingSubject) {
            return false;
        }

        await this.subjectRepository.delete(id);
        return true;
    }

    async getSubjectsByIds(ids: string[]): Promise<Subject[]> {
        return await this.subjectRepository.findByIds(ids);
    }
}
