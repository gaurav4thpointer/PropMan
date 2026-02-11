import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class PropertiesService {
    private prisma;
    private accessService;
    constructor(prisma: PrismaService, accessService: AccessService);
    create(userId: string, role: UserRole, dto: CreatePropertyDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        country: import(".prisma/client").$Enums.Country;
        emirateOrState: string | null;
        currency: import(".prisma/client").$Enums.Currency;
        unitNo: string | null;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus | null;
        notes: string | null;
        ownerId: string;
    }>;
    findAll(userId: string, role: UserRole, pagination: PaginationDto, filters?: {
        search?: string;
        country?: string;
        currency?: string;
    }): Promise<{
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
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
    findOne(userId: string, role: UserRole, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        country: import(".prisma/client").$Enums.Country;
        emirateOrState: string | null;
        currency: import(".prisma/client").$Enums.Currency;
        unitNo: string | null;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus | null;
        notes: string | null;
        ownerId: string;
    }>;
    update(userId: string, role: UserRole, id: string, dto: UpdatePropertyDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        country: import(".prisma/client").$Enums.Country;
        emirateOrState: string | null;
        currency: import(".prisma/client").$Enums.Currency;
        unitNo: string | null;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus | null;
        notes: string | null;
        ownerId: string;
    }>;
    remove(userId: string, role: UserRole, id: string): Promise<{
        deleted: boolean;
    }>;
}
