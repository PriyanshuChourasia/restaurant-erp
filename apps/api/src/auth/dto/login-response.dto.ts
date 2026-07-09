import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

class UserInfo {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  role!: string;

  @Expose()
  permissions!: string[];
}

export class LoginResponseDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;

  @Expose()
  @Type(() => UserInfo)
  @ValidateNested()
  user!: UserInfo;
}
