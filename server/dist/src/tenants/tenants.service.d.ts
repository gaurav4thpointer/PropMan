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
        name: string;
        phone: string | null;
        email: string | null;
        idNumber: string | null;
        notes: string | null;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    findAll(userId: string, role: UserRole, pagination: PaginationDto, search?: string, includeArchived?: boolean): Promise<{
        data: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            idNumber: string | null;
            notes: string | null;
            archivedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
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
        name: string;
        phone: string | null;
        email: string | null;
        idNumber: string | null;
        notes: string | null;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    update(userId: string, role: UserRole, id: string, dto: UpdateTenantDto): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        idNumber: string | null;
        notes: string | null;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    remove(userId: string, role: UserRole, id: string): Promise<{
        deleted: boolean;
    }>;
    archive(userId: string, role: UserRole, id: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        idNumber: string | null;
        notes: string | null;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    } | null>;
    restore(userId: string, role: UserRole, id: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        idNumber: string | null;
        notes: string | null;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    } | null>;
    getCascadeInfo(userId: string, role: UserRole, id: string): Promise<{
        leases: number;
        cheques: number;
        payments: number;
    }>;
}
