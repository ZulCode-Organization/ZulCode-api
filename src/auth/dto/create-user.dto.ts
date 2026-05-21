export class CreateUserDto {
  name!: string;
  email!: string;
  password!: string;
  roles?: string[]; // Adiciona o campo de roles como opcional
}
