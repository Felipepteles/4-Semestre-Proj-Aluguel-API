import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const ferramentas = await prisma.ferramenta.count()
    const reservas = await prisma.reserva.count()
    const enderecos = await prisma.endereco.count()

    res.status(200).json({ clientes, ferramentas, reservas, enderecos })
  } catch (error) {
    res.status(400).json(error)
  }
})

type MarcaGroupByNome = {
  nome: string
  _count: {
    ferramentas: number
  }
}

router.get("/ferramentasMarca", async (req, res) => {
  try {
    const marcas = await prisma.marca.findMany({
      select: {
        nome: true,
        _count: {
          select: { ferramentas: true }
        }
      }
    })

    const marcas2 = marcas
        .filter((item: MarcaGroupByNome) => item._count.ferramentas > 0)
        .map((item: MarcaGroupByNome) => ({
            marca: item.nome,
            num: item._count.ferramentas
        }))
    res.status(200).json(marcas2)
  } catch (error) {
    res.status(400).json(error)
  }
})

type ClienteGroupByCidade = {
  cidade: string
  _count: {
    cidade: number
  }
}

router.get("/clientesCidade", async (req, res) => {
  try {
    const enderecos = await prisma.endereco.groupBy({
      by: ['cidade'],
      _count: {
        cidade: true,
      }
    })

    const enderecos2 = enderecos.map((endereco: ClienteGroupByCidade) => ({
      cidade: endereco.cidade,
      num: endereco._count.cidade
    }))

    res.status(200).json(enderecos2)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
