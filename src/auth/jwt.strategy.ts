import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
// Essa classe configura como a API vai validar o token JWT.
//
// 1. Ela pega o token enviado no header da requisição:
//    Authorization: Bearer TOKEN_AQUI
//
// 2. Usa a chave secreta JWT_SECRET para verificar se o token é válido.
//    Se o token foi alterado, expirou ou foi assinado com outra chave,
//    a requisição é bloqueada automaticamente.
//
// 3. Se o token for válido, o Passport chama o método validate()
//    e entrega o payload que estava dentro do token.
//
// 4. O retorno do validate() vira request.user.
//    Ou seja, em rotas protegidas, você consegue acessar esses dados
//    usando @CurrentUser() ou request.user.
type JwtPayload = {
  sub: string; // userId
  email: string;
  roles: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(payload: JwtPayload) {
    //  const user = await this.usersService.findById(payload.sub); // só quando tiver usuário no banco.
    // O payload é o conteúdo que foi colocado dentro do token no login.
    // Exemplo: { sub: user.id, email: user.email }
    // Aqui escolhemos quais dados do payload vão ficar disponíveis
    // na requisição protegida como request.user.
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
