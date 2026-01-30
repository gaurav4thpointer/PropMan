import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, dto: CreateTenantDto): Promise<{
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
    findAll(ownerId: string, pagination: PaginationDto): Promise<{
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
    findOne(ownerId: string, id: string): Promise<{
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
    update(ownerId: string, id: string, dto: UpdateTenantDto): Promise<{
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
    remove(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
}
