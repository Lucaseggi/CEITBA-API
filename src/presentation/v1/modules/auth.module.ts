import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../controllers/auth.controller';
import { JwtStrategy } from '../../../shared/security/jwt.strategy';
import { AuthService } from '../../../shared/services/auth.service';
import { PrismaService } from '../../../shared/database/prisma.service';

const SECRET = process.env.JWT_SECRET!;
const TTL_SEC = Number(process.env.JWT_TTL_SEC ?? '3600');

@Module({
  imports: [JwtModule.register({ secret: SECRET, signOptions: { expiresIn: TTL_SEC } })],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, PrismaService],
})
export class AuthModule {}
