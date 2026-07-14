import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInstitutionDto) {
    return this.prisma.institucion.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.institucion.findMany();
  }

  async findOne(id: number) {
    return this.prisma.institucion.findUnique({
      where: { id },
    });
  }

  async remove(id: number) {
    return this.prisma.institucion.delete({
      where: { id },
    });
  }
}