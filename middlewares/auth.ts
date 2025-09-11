import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: string;
    nome: string;
    iat: number;
    exp: number;
}

export default function authMiddleware(req: Request | any, res: Response, next: NextFunction) {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const [, token] = authorization.split(' ');

    try {
        const data = jwt.verify(token, process.env.JWT_KEY as string);
        const { id } = data as TokenPayload;

        req.adminId = id; 

        return next();
        
    } catch {
        return res.status(401).json({ error: 'Token inválido.' });
    }
}