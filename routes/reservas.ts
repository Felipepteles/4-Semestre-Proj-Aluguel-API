import { PrismaClient } from '@prisma/client'
import { error } from 'console'
import { Router } from 'express'
import { boolean, z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const reservasSchema = z.object({
    clienteId: z.string(),
    ferramentaId: z.number(),
    descricao: z.string(),
    valor: z.number(),
    dataInicio: z.string(),
    dataFim: z.string()
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
    
    const { clienteId, ferramentaId, descricao, valor, dataInicio, dataFim }= valida.data

    const dadoFerramenta = await prisma.ferramenta.findUnique({
    where: { id: ferramentaId },
    include: { reserva: true }
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

  let disponivelReservar = true
  const inicioReserva = new Date(dataInicio)
  const fimReserva = new Date(dataFim)
  
  dadoFerramenta.reserva.forEach(reserva =>{
    if (reserva.dataInicio <= inicioReserva && reserva.dataFim >= inicioReserva  || reserva.dataInicio <= fimReserva && reserva.dataFim >= fimReserva || inicioReserva <= reserva.dataInicio && fimReserva >= reserva.dataFim){
      disponivelReservar = false
    }
  })

    try {
      if (disponivelReservar){
        const reserva = await prisma.reserva.create({
        data:{clienteId, ferramentaId, descricao, valor : Number(dadoFerramenta?.preco), dataInicio: inicioReserva, dataFim: fimReserva  }
        })
        res.status(201).json({reserva})
      }else{
        throw new Error("Esta ferramenta já esta reservada nesta data")
      }
    }catch(error){
      res.status(400).json({ error })
    }

})

router.delete("/:id", async (req, res)=>{
  const {id} = req.params

  try{
    const reserva = await prisma.reserva.delete({
      where: {id: Number(id)}
    })
    res.status(204).json()
  }catch(error){
    res.status(400).json({erro: error})
  }
})


export default router
