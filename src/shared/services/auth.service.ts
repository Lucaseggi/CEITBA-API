import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';


type Role = 'USER' | 'MODERATOR' | 'ADMIN';
const SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS ?? '12');

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private ensureItba(email: string) {
    if (!/@itba\.edu\.ar$/i.test(email)) {
      throw new BadRequestException('Email must be @itba.edu.ar');
    }
  }

  async register(input: { email: string; password: string; fileNumber: number; name?: string }) {
    const email = input.email.trim().toLowerCase();
    this.ensureItba(email);

    // Unicidad por email o fileNumber
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { fileNumber: input.fileNumber }] },
      select: { id: true },
    });
    if (exists) throw new BadRequestException('Email or fileNumber already in use');

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Crea usuario como USER y credenciales locales
    const user = await this.prisma.user.create({
      data: {
        email,
        fileNumber: input.fileNumber,
        name: input.name ?? null,
        role: 'USER',
        authLocal: { create: { passwordHash } },
      },
      select: { id: true, email: true, role: true, fileNumber: true, name: true },
    });

    return user;
  }

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    this.ensureItba(email);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { authLocal: true },
    });
    if (!user || !user.authLocal) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(input.password, user.authLocal.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: Number(process.env.JWT_TTL_SEC ?? '3600'),
      role: user.role,
    };
  }

  // Solo ADMIN puede llamar (control en controller/guards)
  async assignRole(targetEmail: string, role: Extract<Role, 'MODERATOR' | 'ADMIN'>) {
    const email = targetEmail.trim().toLowerCase();
    this.ensureItba(email);

    const updated = await this.prisma.user.update({
      where: { email },
      data: { role },
      select: { id: true, email: true, role: true },
    }).catch(() => { throw new NotFoundException('User not found'); });

    return updated;
  }
}
