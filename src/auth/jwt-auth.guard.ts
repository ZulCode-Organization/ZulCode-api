import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// elimina os erros de digitação do AuthGuard('jwt') no controller, e também torna o código mais limpo.
export class JwtAuthGuard extends AuthGuard('jwt') {}
