import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'; //Eu adicionei essa linha para importar o jsonwebtoken

const prisma = new PrismaClient()

const router = Router()

const adminSchema = z.object({
    nome: z.string().min(3,
        { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
    email: z.string().email().min(10,
        { message: "E-mail, no mínimo, 10 caracteres" }),
    senha: z.string().min(6, { message: "Senha deve possuir, no mínimo, 6 caracteres" }),
    nivel: z.number().min(1).max(1,
        { message: "Nível deve possuir, exatamente, 1 caractere" }),
})

function validaSenha(senha: string) {

    const mensa: string[] = []

    if (senha.length < 8) {
        mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
    }

    let pequenas = 0
    let grandes = 0
    let numeros = 0
    let simbolos = 0

    for (const letra of senha) {

        if ((/[a-z]/).test(letra)) {
            pequenas++
        }
        else if ((/[A-Z]/).test(letra)) {
            grandes++
        }
        else if ((/[0-9]/).test(letra)) {
            numeros++
        } else {
            simbolos++
        }
    }

    if (pequenas == 0) {
        mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
    }

    if (grandes == 0) {
        mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
    }

    if (numeros == 0) {
        mensa.push("Erro... senha deve possuir número(s)")
    }

    if (simbolos == 0) {
        mensa.push("Erro... senha deve possuir símbolo(s)")
    }

    return mensa
}

router.get("/", async (req, res) => {
    try {
        const admins = await prisma.admin.findMany({})
        res.status(200).json(admins)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.post("/", async (req, res) => {

    const valida = adminSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }
    const erros = validaSenha(valida.data.senha)
    if (erros.length > 0) {
        res.status(400).json({ erro: erros.join("; ") })
        return
    }

    const salt = bcrypt.genSaltSync(12)
    const hash = bcrypt.hashSync(valida.data.senha, salt)
    const { nome, email, nivel } = valida.data

    try {
        const admin = await prisma.admin.create({
            data: { nome, email, nivel, senha: hash }
        })
        res.status(201).json(admin)
    } catch (error) {
        res.status(400).json(error)
    }
})
// Rota de login que eu implementei para o admin (está igual a do cliente)
router.post("/login", async (req, res) => {
    const { email, senha } = req.body
    const mensaPadrao = "Login ou senha incorretos"

    try {
        const admins = await prisma.admin.findFirst({
            where: { email }
        })

        if (admins == null) {
            res.status(400).json({ erro: mensaPadrao })
            return
        }

        if (bcrypt.compareSync(senha, admins.senha)) {
            const token = jwt.sign(
                {
                    id: admins.id,
                    nome: admins.nome
                },
                process.env.JWT_KEY as string,
                { expiresIn: "1h" }
            );
            res.status(200).json({ admins, token });
        } else {
            res.status(400).json({ erro: mensaPadrao });
        }
    } catch (error) {
        res.status(400).json(error);
    }
})

router.delete("/:id", async (req, res) => {
    const { id } = req.params

    try {
        const admins = await prisma.admin.delete({
            where: { id: id }
        })
        res.status(200).json(admins)
    } catch (error) {
        res.status(400).json({ erro: error })
    }
})

router.put("/:id", async (req, res) => {
    const { id } = req.params

    const valida = adminSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { nome, email, nivel, senha } = valida.data
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(senha, salt);

    try {
        const admins = await prisma.admin.update({
            where: { id },
            data: { nome, email, nivel, senha: hash }
        })
        res.status(200).json(admins)
    } catch (error) {
        res.status(400).json({ error })
    }
})

export default router
