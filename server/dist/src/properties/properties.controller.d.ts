import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { User } from '@prisma/client';
export declare class PropertiesController {
    private propertiesService;
    constructor(propertiesService: PropertiesService);
    create(user: User, dto: CreatePropertyDto): Promise<{
        name: string;
        id: string;
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
    findAll(user: User, query: PropertyQueryDto): Promise<{
        data: {
            name: string;
            id: string;
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
    findOne(user: User, id: string): Promise<{
        name: string;
        id: string;
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
    update(user: User, id: string, dto: UpdatePropertyDto): Promise<{
        name: string;
        id: string;
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
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
