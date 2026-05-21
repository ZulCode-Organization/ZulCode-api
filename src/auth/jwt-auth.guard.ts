import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from './roles.decoreator';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
// elimina os erros de digitação do AuthGuard('jwt') no controller, e também torna o código mais limpo.
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor( 
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
     ) {
      super(); 
    }
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean | Promise<boolean> | Observable<boolean>> {
        
        const canActivate = await super.canActivate(context);//verifica se o token é válido, se não for, retorna false e não deixa acessar a rota
        if (!canActivate) {
            return false;
        }

        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY, 
            [context.getHandler(),context.getClass()],
        );
        if (!requiredRoles) {
            return true; // se não houver roles/permissões, qualquer usuário autenticado pode acessar a rota
        }
    }

    const request = context.switchToHttp().getRequest();

    //Authorization: Bearer <token>
    const payload = this.jwtService.verify(token);
    const userRoles = payload.roles || [];
    const hasRole = () =>
        this.userRoles.some((role) => requiredRoles.includes(role));
    if (!this.hasRole()) {
        return new UnauthorizedException('Insufficient permissions'); // se o usuário não tiver a role necessária, retorna 401 Unauthorized
    }

    return true; // se o usuário tiver a role necessária, permite o acesso à rota
}