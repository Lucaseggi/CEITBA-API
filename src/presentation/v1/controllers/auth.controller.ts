import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../../shared/services/auth.service';
import { JwtAuthGuard } from '../../../shared/security/jwt-auth.guard';
import { Roles } from '../../../shared/security/roles.decorator';
import { RolesGuard } from '../../../shared/security/roles.guard';

@ApiTags('Auth')
@Controller('v1/auth')
@UseGuards(RolesGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar usuario (@itba.edu.ar, password, fileNumber único)' })
  @ApiBody({ schema: { properties: {
    email: { type: 'string' }, password: { type: 'string' }, fileNumber: { type: 'integer' }, name: { type: 'string' }
  }, required: ['email','password','fileNumber']}})
  async register(@Body() body: { email: string; password: string; fileNumber: number; name?: string }) {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con email/password; devuelve JWT (1h)' })
  @ApiBody({ schema: { properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email','password'] }})
  async login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body);
  }

  // Asignar rol: solo ADMIN puede
  @Post('roles')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar rol (solo ADMIN): MODERATOR | ADMIN' })
  @ApiBody({ schema: { properties: { email: { type: 'string' }, role: { type: 'string', enum: ['MODERATOR','ADMIN'] } }, required: ['email','role']}})
  async assignRole(@Body() body: { email: string; role: 'MODERATOR'|'ADMIN' }) {
    return this.auth.assignRole(body.email, body.role);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Devuelve claims del JWT' })
  me(@Req() req: any) { return req.user; }
}
