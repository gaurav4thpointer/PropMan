import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
        };
        access_token: string;
    }>;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        mobile: string | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        createdAt: Date;
    }>;
}
