import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class UnitsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, propertyId: string, dto: CreateUnitDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        unitNo: string;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus;
        propertyId: string;
    }>;
    findByProperty(ownerId: string, propertyId: string, pagination: PaginationDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            unitNo: string;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus;
            propertyId: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(ownerId: string, id: string): Promise<{
        property: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            notes: string | null;
            ownerId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        unitNo: string;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus;
        propertyId: string;
    }>;
    update(ownerId: string, id: string, dto: UpdateUnitDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        unitNo: string;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus;
        propertyId: string;
    }>;
    remove(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    private ensurePropertyOwned;
}
