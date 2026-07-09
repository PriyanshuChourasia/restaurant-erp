import { Controller, Post, Get, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import type { IActiveUser } from '../../shared/interfaces/active-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Req() req?: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    return this.authService.login(dto, userAgent, ipAddress);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  logoutAll(@CurrentUser() user: IActiveUser) {
    return this.authService.logoutAll(user.id);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: IActiveUser) {
    return this.authService.getProfile(user.id);
  }
}
