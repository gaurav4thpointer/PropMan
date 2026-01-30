import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from '@prisma/client';
export declare class UnitsController {
    private unitsService;
    constructor(unitsService: UnitsService);
    create(user: User, propertyId: string, dto: CreateUnitDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        unitNo: string;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus;
        propertyId: string;
    }>;
    findByProperty(user: User, propertyId: string, pagination: PaginationDto): Promise<{
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
}
export declare class UnitsByIdController {
    private unitsService;
    constructor(unitsService: UnitsService);
    findOne(user: User, id: string): Promise<{
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
    update(user: User, id: string, dto: UpdateUnitDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        unitNo: string;
        bedrooms: number | null;
        status: import(".prisma/client").$Enums.UnitStatus;
        propertyId: string;
    }>;
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
