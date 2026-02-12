import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { User } from '@prisma/client';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
    create(user: User, dto: CreateTenantDto): Promise<{
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
    findAll(user: User, query: TenantQueryDto): Promise<{
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
    findOne(user: User, id: string): Promise<{
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
    getCascadeInfo(user: User, id: string): Promise<{
        leases: number;
        cheques: number;
        payments: number;
    }>;
    update(user: User, id: string, dto: UpdateTenantDto): Promise<{
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
    archive(user: User, id: string): Promise<{
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
    restore(user: User, id: string): Promise<{
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
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
