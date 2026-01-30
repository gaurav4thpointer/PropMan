import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from '@prisma/client';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
    create(user: User, dto: CreateTenantDto): Promise<{
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
    findAll(user: User, pagination: PaginationDto): Promise<{
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
    findOne(user: User, id: string): Promise<{
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
    update(user: User, id: string, dto: UpdateTenantDto): Promise<{
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
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
