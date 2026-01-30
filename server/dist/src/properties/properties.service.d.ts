import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class PropertiesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, dto: CreatePropertyDto): Promise<{
        units: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            unitNo: string;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus;
            propertyId: string;
        }[];
    } & {
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
    }>;
    findAll(ownerId: string, pagination: PaginationDto): Promise<{
        data: ({
            units: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                unitNo: string;
                bedrooms: number | null;
                status: import(".prisma/client").$Enums.UnitStatus;
                propertyId: string;
            }[];
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(ownerId: string, id: string): Promise<{
        units: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            unitNo: string;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus;
            propertyId: string;
        }[];
    } & {
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
    }>;
    update(ownerId: string, id: string, dto: UpdatePropertyDto): Promise<{
        units: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            unitNo: string;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus;
            propertyId: string;
        }[];
    } & {
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
    }>;
    remove(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
}
