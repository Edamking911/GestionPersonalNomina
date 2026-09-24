import {
  Controller,
  Body,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res, 
  StreamableFile
} from '@nestjs/common';
import { HorarioAsistenciaService } from './horario-asistencia.service';
import { CreateHorarioAsistenciaDto } from 'src/DTOS/HorariosAsistencia/CreateHorarioAsistencia.dto';
import { UpdateHorarioAsistenciaDto } from 'src/DTOS/HorariosAsistencia/UpdateHorarioAsistencia.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('horario-asistencia')
export class HorarioAsistenciaController {
  constructor(private readonly horarioAsistenciaService: HorarioAsistenciaService) {}

  @Get('/Todos-Horarios')
  @HttpCode(HttpStatus.OK)
  async Get_Horarios_Todos(){
    const horario = await this.horarioAsistenciaService.Obtener_Horarios()
    return{
      message: 'Lista de los Horarios*',
      control: horario
    }
  }

  @Get('/Horarios-id/:codigo')
  @HttpCode(HttpStatus.OK)
  async Get_Horario_ID(@Param('codigo') codigo :string){
    const horario = await this.horarioAsistenciaService.Obtener_Horario_ID(codigo)
    return{
      message : 'Horario Encontrado Exitosamente *',
      control: horario
    }
  }

  @Post('/Agregar-Horario')
  @HttpCode(HttpStatus.CREATED)
  async Crear_Horario(@Body() createHorario: CreateHorarioAsistenciaDto){
    const horario =  await this.horarioAsistenciaService.Crear_Horario(createHorario)
    return {
      message: 'Se ha Creado exitosamente el Horario*',
      control: horario
    }
  }

  @Delete('/Eliminar-Horario/:codigo')
  @HttpCode(HttpStatus.OK)
  async Elimanar_Horario(@Param('codigo') codigo: string){
    const horario = await this.horarioAsistenciaService.Eliminar_Horario(codigo)
    return {
      message: 'Se ha eliminado correctamente el horario*',
      control: horario
    }
  }
  
  @Patch('/Actualizar-Horario')
  @HttpCode(HttpStatus.OK)
  async Actualizar_Horario(@Body() updateHorario : UpdateHorarioAsistenciaDto){
    const horario = await this.horarioAsistenciaService.Actualizar_Horario(updateHorario)
    return {
      message : 'Se ha actualizado correctamente el horario*',
      control: horario
    }
  }

  @Post('/cargar-excel')
  @UseInterceptors(FileInterceptor('file'))
  async cargarDesdeExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    return await this.horarioAsistenciaService.Cargar_Horarios_Excel(file.buffer);
  }
  @Get('/plantilla')
  async descargarPlantilla() {
    const buffer = await this.horarioAsistenciaService.Generar_Plantilla();
    
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="plantilla_horarios_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    });
  }
}
