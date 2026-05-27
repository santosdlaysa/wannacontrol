import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidateSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidateSchemas | ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Se for um schema direto, assume que é body
      if ('parse' in schemas) {
        req.body = schemas.parse(req.body);
      } else {
        if (schemas.body) {
          req.body = schemas.body.parse(req.body);
        }
        if (schemas.params) {
          req.params = schemas.params.parse(req.params) as any;
        }
        if (schemas.query) {
          req.query = schemas.query.parse(req.query) as any;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          errors: error.errors.map((e) => ({
            campo: e.path.join('.'),
            mensagem: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
