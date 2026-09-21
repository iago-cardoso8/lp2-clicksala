import { Request, Response, NextFunction } from 'express';
import { z, ZodType } from 'zod';

type ValidationSource = 'body' | 'params' | 'query' | 'file';

export default function validate(schema: ZodType, source: ValidationSource) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse((req as any)[source]);

    if (!result.success) {
      next(result.error);
      return;
    }

    (req as any)[source] = result.data;
    next();
  };
}