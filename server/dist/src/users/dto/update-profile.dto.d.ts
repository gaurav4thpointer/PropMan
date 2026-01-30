import { Gender } from '@prisma/client';
export declare class UpdateProfileDto {
    email?: string;
    name?: string;
    mobile?: string;
    gender?: Gender;
}
