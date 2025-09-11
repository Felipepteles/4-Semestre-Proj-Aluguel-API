import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const reservasSchema = z.object({
    clienteId: z.string(),
    ferramentaId: z.number(),
    descricao: z.string(),
    valor: z.number(),
})

router.get("/", async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        cliente: true,
        ferramenta: true
      }
    })
    res.status(200).json(reservas)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})


router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params

  try {
    const reservas = await prisma.reserva.findMany({
      where: { clienteId },
      include: {
        ferramenta: {
          include: {
            marca: true,
            categoria: true
          }
        }
      }
    })
    res.status(200).json(reservas)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", async (req, res) => {

    const valida = reservasSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }
    
    const { clienteId, ferramentaId, descricao, valor }= valida.data

    const dadoFerramenta = await prisma.ferramenta.findUnique({
    where: { id: ferramentaId }
  })

  const dadoCliente = await prisma.cliente.findUnique({
    where: { id: clienteId }
  })

  if (!dadoCliente) {
    res.status(400).json({ erro: "Erro... Código do Cliente inválido" })
    return
  }

  if (!dadoFerramenta) {
    res.status(400).json({ erro: "Erro... Código do Cliente inválido" })
    return
  }

    try {
      const [reserva, ferramenta] = await prisma.$transaction([
        prisma.reserva.create({
          data:{clienteId, ferramentaId, descricao, valor : Number(dadoFerramenta?.preco)  }
        }),
        prisma.ferramenta.update({
          where:{id: ferramentaId},
          data:{ status: false}
        })])
      res.status(201).json({reserva, ferramenta})
    }catch(error){
      res.status(400).json({ error })
    }

})


export default router
