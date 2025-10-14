import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

const router = Router()

const telefonesSchema = z.object({
    tel1: z.string().min(10).max(11, {message: "O telefone deve possuir, no mínimo 11 caracteres e no máximo 11 caracteres."}),
    tel2: z.string().min(10).max(11, {message: "O telefone deve possuir, no mínimo 11 caracteres e no máximo 11 caracteres."}).optional(),
    clienteId: z.string().uuid()
})

router.get("/", async (req, res) => {
    try {
        const telefones = await prisma.telefone.findMany({})
        res.status(200).json(telefones)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.post("/", async (req, res) => {

    const valida = telefonesSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { tel1, tel2, clienteId } = valida.data

    try {
        const telefones = await prisma.telefone.create({
            data: { tel1, tel2, clienteId }
        })
        res.status(201).json(telefones)
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.delete("/:id", async (req, res) => {
    const { id } = req.params

    try {
        const telefones = await prisma.telefone.delete({
            where: { id: Number(id) }
        })
        res.status(200).json(telefones)
    } catch (error) {
        res.status(400).json({ erro: error })
    }
})

router.put("/:id", async (req, res) => {
    const { id } = req.params

    const valida = telefonesSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { tel1, tel2, clienteId } = valida.data

    try {
        const telefones = await prisma.telefone.update({
            where: { id: Number(id) },
            data: { tel1, tel2, clienteId }
        })
        res.status(200).json(telefones)
    } catch (error) {
        res.status(400).json({ error })
    }
})

export default router
