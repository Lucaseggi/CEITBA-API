export interface ClassroomDto {
    name: string;
    building: string;
    day?: string | null;
    hourFrom?: string | null;
    hourTo?: string | null;
}

export interface ClassroomScheduleDto {
    classroom: string;
    building: string;
    day: string | null;
    hourFrom: string | null;
    hourTo: string | null;
}

export interface ClassroomsByBuildingDto {
    [building: string]: ClassroomDto[];
}

export interface ClassroomsByDayAndBuildingDto {
    [day: string]: {
        [building: string]: ClassroomScheduleDto[];
    };
}