import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { ILike, Repository } from 'typeorm';
import {HorarioAsistencia} from '../Entitys/HorariosAsistencia/HorarioAsistencia.entity'
import {CreateHorarioAsistenciaDto} from '../DTOS/HorariosAsistencia/CreateHorarioAsistencia.dto'
import { UpdateHorarioAsistenciaDto } from 'src/DTOS/HorariosAsistencia/UpdateHorarioAsistencia.dto';
import { CargarHorariosDto } from 'src/DTOS/HorariosAsistencia/CargarHorarios.dto';
@Injectable()
export class HorarioAsistenciaService {
    constructor(@InjectRepository(HorarioAsistencia) private readonly Horario : Repository<HorarioAsistencia>){}

    async Validar_Horario(codigo : string): Promise<boolean>{
        const horario = await this.Horario.findOne({where:{codigo:codigo}})
        if(horario){
            return true
        }
        return false
    }

    private horaAMinutos(hora: string): number {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
    }

    async Crear_Horario(createDtohorario:CreateHorarioAsistenciaDto):Promise<HorarioAsistencia>{
        const existe = await this.Validar_Horario(createDtohorario.codigo)
        const entradaMin = this.horaAMinutos(createDtohorario.horaEntrada);
        const salidaMin = this.horaAMinutos(createDtohorario.horaSalida);
        if(existe){
             throw new ConflictException(`Este Horario ya ha Sido Creado ${createDtohorario.nombre}`);
        }
        else{
            if(entradaMin >= salidaMin){
                 throw new BadRequestException(`La hora de salida debe ser mayor que la hora de entrada. Los turnos que cruzan medianoche no están soportados`);
            }
        }
        const crear = new HorarioAsistencia()
        crear.codigo = createDtohorario.codigo
        crear.nombre = createDtohorario.nombre
        crear.horaEntrada = createDtohorario.horaEntrada
        crear.horaSalida = createDtohorario.horaSalida
        crear.toleranciaMin = createDtohorario.toleranciaMin ?? 15
        crear.activo = createDtohorario.activo ?? true

        return await this.Horario.save(crear)
    }

    async Obtener_Horarios():Promise<HorarioAsistencia[]>{
        return await  this.Horario.find()
    }

    async Obtener_Horario_ID(codigo:string):Promise<HorarioAsistencia>{
        const horario = await this.Horario.findOne({where:{codigo:codigo}})
        if(!horario){
            throw new BadRequestException(`El Horario Buscado No existe*`);
        }
        return horario
    }

    async Eliminar_Horario(codigo:string):Promise<HorarioAsistencia>{
        return await this.Horario.remove(await this.Obtener_Horario_ID(codigo))
    }


    async Actualizar_Horario(updateDtoHorario: UpdateHorarioAsistenciaDto): Promise<HorarioAsistencia> {
    // 1. Validar que venga el código
        if (!updateDtoHorario.codigo) {
            throw new BadRequestException('El código del horario es obligatorio');
        }

    // 2. Buscar el horario (ya lanza 404 si no existe)
        const horario = await this.Obtener_Horario_ID(updateDtoHorario.codigo);

    // 3. Validar horas SOLO si vienen en el DTO
        if (updateDtoHorario.horaEntrada || updateDtoHorario.horaSalida) {
            // Si viene una, usar la del DTO. Si no, usar la que ya estaba
            const entrada = updateDtoHorario.horaEntrada ?? horario.horaEntrada;
            const salida = updateDtoHorario.horaSalida ?? horario.horaSalida;

            const entradaMin = this.horaAMinutos(entrada);
            const salidaMin = this.horaAMinutos(salida);

            if (entradaMin >= salidaMin) {
            throw new BadRequestException(
                'La hora de salida debe ser mayor que la hora de entrada. Los turnos que cruzan medianoche no están soportados.',
            );
            }
        }

    // 4. Aplicar cambios (explícito, no Object.assign)
        if (updateDtoHorario.nombre) horario.nombre = updateDtoHorario.nombre;
        if (updateDtoHorario.horaEntrada)
            horario.horaEntrada = updateDtoHorario.horaEntrada;
        if (updateDtoHorario.horaSalida)
            horario.horaSalida = updateDtoHorario.horaSalida;
        if (updateDtoHorario.toleranciaMin !== undefined)
            horario.toleranciaMin = updateDtoHorario.toleranciaMin;
        if (updateDtoHorario.activo !== undefined)
            horario.activo = updateDtoHorario.activo;

        // 5. Guardar
        await this.Horario.save(horario);

        // 6. Devolver el actualizado
        return await this.Obtener_Horario_ID(horario.codigo);
    }

    async Cargar_Horarios_Excel(fileBuffer: Buffer) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer as any);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new BadRequestException('El archivo Excel no tiene hojas');
        }

        const resultados = {
            creados: 0,
            actualizados: 0,
            fallidos: 0,
            errores: [] as string[],
        };

        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);

            const codigo = row.getCell(1).value?.toString().trim().toUpperCase() || '';
            const nombre = row.getCell(2).value?.toString().trim() || '';
            const horaEntrada = row.getCell(3).value?.toString().trim() || '';
            const horaSalida = row.getCell(4).value?.toString().trim() || '';
            const toleranciaRaw = row.getCell(5).value;
            const toleranciaMin = toleranciaRaw ? Number(toleranciaRaw) : 15;

            if (!codigo && !nombre) continue;

            try {
            // ✅ Verificar si ya existe
            const existe = await this.Validar_Horario(codigo);

            if (existe) {
                // 🔄 ACTUALIZAR
                await this.Actualizar_Horario({
                codigo,
                nombre,
                horaEntrada,
                horaSalida,
                toleranciaMin,
                });
                resultados.actualizados++;
            } else {
                // ➕ CREAR
                const dto: CreateHorarioAsistenciaDto = {
                codigo,
                nombre,
                horaEntrada,
                horaSalida,
                toleranciaMin,
                activo: true,
                };
                await this.Crear_Horario(dto);
                resultados.creados++;
            }
            } catch (error: any) {
            resultados.fallidos++;
            resultados.errores.push(`Fila ${i} (${codigo}): ${error.message}`);
            }
        }

        return {
            success: true,
            message: `${resultados.creados} creados, ${resultados.actualizados} actualizados, ${resultados.fallidos} fallidos`,
            ...resultados,
        };
    }

    async Generar_Plantilla(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Nómina';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Horarios');

        // Columnas
        sheet.columns = [
            { header: 'codigo', key: 'codigo', width: 20 },
            { header: 'nombre', key: 'nombre', width: 30 },
            { header: 'horaEntrada', key: 'horaEntrada', width: 15 },
            { header: 'horaSalida', key: 'horaSalida', width: 15 },
            { header: 'toleranciaMin', key: 'toleranciaMin', width: 15 },
        ];

        // Estilo del encabezado
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '004080' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 24;

        // ✅ CAMBIO: Traer horarios desde la BD
        const horarios = await this.Horario.find({
            order: { codigo: 'ASC' },
        });

        if (horarios.length > 0) {
            // Precargar con lo que ya existe
            for (const h of horarios) {
            sheet.addRow({
                codigo: h.codigo,
                nombre: h.nombre,
                horaEntrada: h.horaEntrada,
                horaSalida: h.horaSalida,
                toleranciaMin: h.toleranciaMin,
            });
            }
        } else {
            // Si no hay nada en BD, dejar ejemplos base
            sheet.addRow({
            codigo: 'HORARIO_8_5',
            nombre: '8:00 AM - 5:00 PM',
            horaEntrada: '08:00',
            horaSalida: '17:00',
            toleranciaMin: 15,
            });
        }

        // Formatear columnas C y D como texto
        for (let i = 2; i <= sheet.rowCount; i++) {
            sheet.getCell(`C${i}`).numFmt = '@';
            sheet.getCell(`D${i}`).numFmt = '@';
        }

        // Hoja de instrucciones
        const instrucciones = workbook.addWorksheet('Instrucciones');
        instrucciones.columns = [
            { header: 'Campo', key: 'campo', width: 25 },
            { header: 'Descripción', key: 'descripcion', width: 80 },
        ];

        const headerInst = instrucciones.getRow(1);
        headerInst.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerInst.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '004080' },
        };
        headerInst.alignment = { vertical: 'middle', horizontal: 'center' };

        instrucciones.addRows([
            { campo: 'codigo', descripcion: 'Obligatorio. Único. Mayúsculas y guión bajo (ej: HORARIO_8_5)' },
            { campo: 'nombre', descripcion: 'Obligatorio. Nombre descriptivo del horario' },
            { campo: 'horaEntrada', descripcion: 'Obligatorio. Formato HH:mm con cero (ej: 08:00)' },
            { campo: 'horaSalida', descripcion: 'Obligatorio. Formato HH:mm. Debe ser mayor que horaEntrada' },
            { campo: 'toleranciaMin', descripcion: 'Opcional. Minutos de tolerancia (default: 15)' },
            { campo: '', descripcion: '' },
            { campo: '⚠️ Importante', descripcion: 'Formatear columnas C y D como TEXTO para evitar conversiones raras' },
            { campo: '⚠️ Importante', descripcion: 'Los horarios existentes se precargan. Modifícalos o agrega nuevos.' },
            { campo: '⚠️ Importante', descripcion: 'Los duplicados fallan al cargar, pero los demás sí se crean.' },
        ]);

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
