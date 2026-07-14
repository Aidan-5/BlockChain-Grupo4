import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Controller('credentials')
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService,
  ) {}

  @Post()
  create(@Body() body: CreateCredentialDto) {
    return this.credentialsService.create(body);
  }

  @Get()
  findAll() {
    return this.credentialsService.findAll();
  }

  @Get(':id/verify')
  verify(@Param('id') id: string) {
    return this.credentialsService.verify(Number(id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.credentialsService.findOne(Number(id));
  }
}
