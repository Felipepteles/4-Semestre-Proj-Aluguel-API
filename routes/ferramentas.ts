import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import authMiddleware from '../middlewares/auth'; //Adicionei essa linha para importar o middleware de autenticação

const prisma = new PrismaClient()

const router = Router()

const ferramentasSchema = z.object({
    nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
    descricao: z.string().min(2, { message: "Descrição deve possuir, no mínimo, 2 caracteres" }),
    foto: z.string().url({ message: "URL da foto deve ser válida" }),
    preco: z.number().min(0, { message: "Valor deve ser positivo" }),
    categoriaId: z.number(),
    marcaId: z.number(),
    adminId: z.string().uuid().optional()
})

router.get("/", async (req, res) => {
    try {
        const ferramentas = await prisma.ferramenta.findMany({
            include:{
                marca: true,
                categoria: true
            }
        })
        res.status(200).json(ferramentas)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const ferramenta = await prisma.ferramenta.findFirst({
      where: { id: Number(id)},
      include:{
        categoria: true,
        marca: true
      }
    })
    res.status(200).json(ferramenta)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/destaques", async (req, res) => {
  try {
    const ferramentas = await prisma.ferramenta.findMany({
      include: {
        marca: true,
        categoria: true
      },
      where: {
        status: true
      },
      orderBy: {
        id: 'desc'
      }
    })
    res.status(200).json(ferramentas)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", authMiddleware, async (req : Request | any, res) => {

    const valida = ferramentasSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Pega o adminId que o middleware injetou na requisição!
    const adminId = req.adminId;

    if (!adminId) {
        return res.status(401).json({ erro: 'ID do admin não encontrado no token.'});
    }

    const { nome, descricao, preco, foto, categoriaId, marcaId } = valida.data

    try {
        const ferramentas = await prisma.ferramenta.create({
            data: { nome, descricao, preco, foto, categoriaId, marcaId, adminId }
        })
        res.status(201).json(ferramentas)
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.delete("/:id", authMiddleware, async (req : Request | any, res) => {
    const { id } = req.params

    try {
        const ferramenta = await prisma.ferramenta.findUnique({
            where: { id: Number(id) }
        });

        if (!ferramenta) {
            return res.status(404).json({ erro: "Ferramenta não encontrada." });
        }

        await prisma.ferramenta.delete({
            where: { id: Number(id) }
        })
        res.status(200).json({ mensagem: "Ferramenta deletada com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Ocorreu um erro ao deletar a ferramenta.", detalhes: error });
    }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = ferramentasSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, descricao, preco, foto, categoriaId, marcaId } = valida.data

  try {
    const ferramentas = await prisma.ferramenta.update({
      where: { id: Number(id) },
      data: { nome, descricao, preco, foto, categoriaId, marcaId }
    })
    res.status(200).json(ferramentas)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  // tenta converter para número
  const termoNumero = Number(termo)

  // is Not a Number, ou seja, se não é um número: filtra por texto
  if (isNaN(termoNumero)) {
    try {
      const ferramentas = await prisma.ferramenta.findMany({
        include: {
          marca: true,
          categoria: true
        },
        where: {
          OR: [
            { categoria: { nome: {equals: termo, mode: "insensitive" } } },
            { marca: { nome: { equals: termo, mode: "insensitive" } } }
          ]
        }
      })
      res.status(200).json(ferramentas)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  } else {
    if (termoNumero <= 500) {
      try {
        const ferramentas = await prisma.ferramenta.findMany({
          include: {
            marca: true,
            categoria: true
          },
          where: { preco: termoNumero }
        })
        res.status(200).json(ferramentas)
      } catch (error) {
        res.status(500).json({ erro: error })
      }  
    } else {
      try {
        const ferramentas = await prisma.ferramenta.findMany({
          include: {
            marca: true,
            categoria: true
          },
          where: { preco: { lte: termoNumero } }
        })
        res.status(200).json(ferramentas)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    }
  }
})

router.patch("/destacar/:id", authMiddleware, async (req : Request | any, res) => {
  const { id } = req.params

  try {
    const ferramentaDestacar = await prisma.ferramenta.findUnique({
      where: { id: Number(id) },
      select: { status: true }, 
    });

    const ferramentas = await prisma.ferramenta.update({
      where: { id: Number(id) },
      data: { status: !ferramentaDestacar?.status }
    })
    res.status(200).json(ferramentas)
  } catch (error) {
    res.status(400).json(error)
  }
})


export default router
