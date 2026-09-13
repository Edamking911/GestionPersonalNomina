import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 🔑 Si es un archivo, NO envolver
        if (data instanceof StreamableFile) {
          return data;
        }

        // 🔑 Si ya viene con success, dejarlo tal cual
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 🔑 Envolver todo lo demás en un formato estándar
        return {
          success: true,
          data,
          message: null,
          error: null,
        };
      }),
    );
  }
}