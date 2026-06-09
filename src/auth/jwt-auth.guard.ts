import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from './roles.decoreator';

type JwtRequestUser = {
  userId: string;
  email: string;
  role?: string;
};

@Injectable()
// elimina os erros de digitação do AuthGuard('jwt') no controller, e também torna o código mais limpo.
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true; // se não houver roles/permissões, qualquer usuário autenticado pode acessar a rota
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    const userRole = request.user?.role;
    const hasRole = userRole ? requiredRoles.includes(userRole) : false;

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true; // se o usuário tiver a role necessária, permite o acesso à rota
  }
}
