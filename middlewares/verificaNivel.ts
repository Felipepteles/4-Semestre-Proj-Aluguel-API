import { Request, Response, NextFunction } from 'express'

export function verificaNivel(nivel: Nivel[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (nivel.includes(req.nivel as Nivel)) {
      next()
    } else {
      res.status(403).json({ erro: `Acesso Negado. Apenas administradores de nível ${nivel} possuem permissão para essa funcionalidade` })
    }
  }
}

type Nivel = "ADMIN" | "MODERADOR" | "COMUM"


