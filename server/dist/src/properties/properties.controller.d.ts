import { PropertiesService } from './properties.service';
import { OwnersService } from '../owners/owners.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { AssignManagerDto } from '../owners/dto/assign-manager.dto';
import { User } from '@prisma/client';
export declare class PropertiesController {
    private propertiesService;
    private ownersService;
    constructor(propertiesService: PropertiesService, ownersService: OwnersService);
    create(user: User, dto: CreatePropertyDto): Promise<{
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
        archivedAt: Date | null;
        ownerId: string;
    }>;
    findAll(user: User, query: PropertyQueryDto): Promise<{
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
            archivedAt: Date | null;
            ownerId: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPropertyManagers(user: User, id: string): Promise<{
        data: {
            id: string;
            email: string;
            name: string | null;
        }[];
    }>;
    findOne(user: User, id: string): Promise<{
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
        archivedAt: Date | null;
        ownerId: string;
    }>;
    getCascadeInfo(user: User, id: string): Promise<{
        leases: number;
        cheques: number;
        payments: number;
    }>;
    update(user: User, id: string, dto: UpdatePropertyDto): Promise<{
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
        archivedAt: Date | null;
        ownerId: string;
    }>;
    archive(user: User, id: string): Promise<{
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
        archivedAt: Date | null;
        ownerId: string;
    } | null>;
    restore(user: User, id: string): Promise<{
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
        archivedAt: Date | null;
        ownerId: string;
    } | null>;
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
    assignManager(user: User, id: string, dto: AssignManagerDto): Promise<{
        assigned: boolean;
    }>;
    revokeManager(user: User, id: string, managerId: string): Promise<{
        revoked: boolean;
    }>;
}
