import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: string;
    nome: string;
    iat: number;
    exp: number;
    nivel: string;
}

declare global {
  namespace Express {
    interface Request {
      id?: string
      nome?: string
      nivel?: string
    }
  }
}

export default function authMiddleware(req: Request | any, res: Response, next: NextFunction) {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const [, token] = authorization.split(' ');

    try {
        const data = jwt.verify(token, process.env.JWT_KEY as string);
        const { id, nome, nivel } = data as TokenPayload;
        req.id = id
        req.nome = nome
        req.nivel = nivel

        return next();
        
    } catch {
        return res.status(401).json({ error: 'Token inválido.' });
    }
}