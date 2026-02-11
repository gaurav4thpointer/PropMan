import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    me(user: User): Promise<{
        id: string;
        email: string;
        name: string | null;
        mobile: string | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
    }>;
    updateMe(user: User, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        mobile: string | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
    }>;
    changePassword(user: User, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
