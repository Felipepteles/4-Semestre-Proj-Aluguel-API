import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

const router = Router()

const enderecoSchema = z.object({
    logradouro: z.string().min(3, { message: "Logradouro deve possuir, no mínimo, 3 caracteres" }),
    num: z.number().min(1, { message: "Número deve ser um valor positivo" }),
    bairro: z.string().min(3, { message: "Bairro deve possuir, no mínimo, 3 caracteres" }),
    cidade: z.string().min(3, { message: "Cidade deve possuir, no mínimo, 3 caracteres" }),
    estado: z.string().length(2, { message: "Estado deve possuir, exatamente, 2 caracteres" }),
    cep: z.number().min(8, { message: "CEP deve possuir, exatamente, 8 caracteres" }),
    clienteId: z.string().uuid()
})

router.get("/", async (req, res) => {
    try {
        const enderecos = await prisma.endereco.findMany({})
        res.status(200).json(enderecos)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.post("/", async (req, res) => {

    const valida = enderecoSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { logradouro, num, bairro, cidade, estado, cep, clienteId } = valida.data

    try {
        const enderecos = await prisma.endereco.create({
            data: { logradouro, num, bairro, cidade, estado, cep, clienteId }
        })
        res.status(201).json(enderecos)
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.delete("/:id", async (req, res) => {
    const { id } = req.params

    try {
        const enderecos = await prisma.endereco.delete({
            where: { id: Number(id) }
        })
        res.status(200).json(enderecos)
    } catch (error) {
        res.status(400).json({ erro: error })
    }
})

router.put("/:id", async (req, res) => {
    const { id } = req.params

    const valida = enderecoSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { logradouro, num, bairro, cidade, estado, cep, clienteId } = valida.data

    try {
        const enderecos = await prisma.endereco.update({
            where: { id: Number(id) },
            data: { logradouro, num, bairro, cidade, estado, cep, clienteId }
        })
        res.status(200).json(enderecos)
    } catch (error) {
        res.status(400).json({ error })
    }
})

export default router
