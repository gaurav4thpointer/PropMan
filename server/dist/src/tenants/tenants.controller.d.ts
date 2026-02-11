import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { User } from '@prisma/client';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
    create(user: User, dto: CreateTenantDto): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        idNumber: string | null;
        notes: string | null;
        ownerId: string;
    }>;
    findAll(user: User, query: TenantQueryDto): Promise<{
        data: {
            name: string;
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            idNumber: string | null;
            notes: string | null;
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
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        idNumber: string | null;
        notes: string | null;
        ownerId: string;
    }>;
    update(user: User, id: string, dto: UpdateTenantDto): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        idNumber: string | null;
        notes: string | null;
        ownerId: string;
    }>;
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
