import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class TenantsService {
    private prisma;
    private accessService;
    constructor(prisma: PrismaService, accessService: AccessService);
    create(userId: string, role: UserRole, dto: CreateTenantDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        ownerId: string;
        phone: string | null;
        idNumber: string | null;
    }>;
    findAll(userId: string, role: UserRole, pagination: PaginationDto, search?: string): Promise<{
        data: {
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            phone: string | null;
            idNumber: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(userId: string, role: UserRole, id: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        ownerId: string;
        phone: string | null;
        idNumber: string | null;
    }>;
    update(userId: string, role: UserRole, id: string, dto: UpdateTenantDto): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        ownerId: string;
        phone: string | null;
        idNumber: string | null;
    }>;
    remove(userId: string, role: UserRole, id: string): Promise<{
        deleted: boolean;
    }>;
}
