import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: RegisterDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        mobile: string | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        password: string;
        name: string | null;
        mobile: string | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        mobile: string | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
    }>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: {
            id: string;
            email: string;
            name: string | null;
            mobile: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateProfile(id: string, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        mobile: string | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
    }>;
    changePassword(id: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(userId: string, newPassword: string): Promise<{
        message: string;
    }>;
}
