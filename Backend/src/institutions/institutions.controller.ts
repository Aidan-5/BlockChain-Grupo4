import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
  } from '@nestjs/common';
  import { InstitutionsService } from './institutions.service';
  import { CreateInstitutionDto } from './dto/create-institution.dto';
  
  @Controller('institutions')
  export class InstitutionsController {
    constructor(
      private readonly institutionsService: InstitutionsService,
    ) {}
  
    @Post()
    create(@Body() body: CreateInstitutionDto) {
      return this.institutionsService.create(body);
    }
  
    @Get()
    findAll() {
      return this.institutionsService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.institutionsService.findOne(Number(id));
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.institutionsService.remove(Number(id));
    }
  }