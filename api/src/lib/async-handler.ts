import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper para controllers async no Express 4.
 * Captura erros de Promises rejeitadas e encaminha para o error handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
