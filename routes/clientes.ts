import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'; //Eu adicionei essa linha para importar o jsonwebtoken
import logger from '../src/config/logger'

const prisma = new PrismaClient()

const router = Router()

const loginAttempts = new Map<string, number>()
const MAX_ATTEMPTS = 3 // Define o máximo de tentativas

const clienteSchema = z.object({
    nome: z.string().min(3,
        { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
    email: z.string().email().min(10,
        { message: "E-mail, no mínimo, 10 caracteres" }),
    cpf: z.string().min(11,
        { message: "CPF deve possuir, no mínimo, 11 caracteres" }),
    senha: z.string().min(6,
        { message: "Senha deve possuir, no mínimo, 6 caracteres" }),
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
        const clientes = await prisma.cliente.findMany({
            include: {
                Endereco: true,
                Telefone: true
            }
        })
        res.status(200).json(clientes)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.get("/:id", async (req, res) => {
    const { id } = req.params
    try {
        const cliente = await prisma.cliente.findUnique({
            where: { id },
            include: {
                Endereco: true,
                Telefone: true
            }
        })
        res.status(200).json(cliente)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.post("/login", async (req, res) => {
    const { email, senha } = req.body
    const mensaPadrao = "Login ou senha incorretos"

    try {

        const attempts = loginAttempts.get(email) || 0
        if (attempts >= MAX_ATTEMPTS) {
            // Log CRÍTICO (nível 'error' é o mais alto)
            logger.error(`[BLOQUEIO] Tentativa de login para ${email} bloqueada (excesso de tentativas). IP: ${req.ip}`)
            return res.status(429).json({ erro: "Muitas tentativas falhas. Conta bloqueada temporariamente." }) // 429 = Too Many Requests
        }

        const clientes = await prisma.cliente.findFirst({
            where: { email }
        })

        if (clientes == null) {
            // Log de AVISO (nível 'warn')
            logger.warn(`Tentativa de login falhou (usuário não encontrado): ${email}`)
            res.status(400).json({ erro: mensaPadrao })
            return
        }
        // Aqui fiz a comparação da senha usando bcrypt
        if (bcrypt.compareSync(senha, clientes.senha)) {

            // Senha Correta
            // Log de INFORMAÇÃO (nível 'info')
            logger.info(`Login bem-sucedido para cliente: ${clientes.nome} (${email})`)

            // Limpa o contador de tentativas
            loginAttempts.delete(email)

            // Se a senha estiver correta, gere um token JWT
            const token = jwt.sign(
                {
                    id: clientes.id,
                    nome: clientes.nome
                },
                process.env.JWT_KEY as string, // Aqui é a chave secreta do .env
                { expiresIn: "1h" } // O token expira em 1 hora
            );
            res.status(200).json({
                id: clientes.id,
                nome: clientes.nome,
                email: clientes.email,
                token
            });
        } else {

            // Senha Incorreta
            // Incrementa o contador de tentativas
            const newAttempts = attempts + 1
            loginAttempts.set(email, newAttempts)

            // Log de AVISO (nível 'warn')
            logger.warn(`Tentativa de login falhou (senha incorreta) para: ${email}. Tentativa ${newAttempts}/${MAX_ATTEMPTS}.`)

            res.status(400).json({ erro: mensaPadrao });
        }
    } catch (error) {
        // Log de ERRO (nível 'error')
        logger.error(`[ERRO NO LOGIN] Falha inesperada ao tentar logar ${email}`, error)
        res.status(400).json(error);
    }
})

router.post("/", async (req, res) => {

    const valida = clienteSchema.safeParse(req.body)
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
    const { nome, email, cpf } = valida.data

    try {
        const cliente = await prisma.cliente.create({
            data: { nome, email, cpf, senha: hash }
        })
        res.status(201).json(cliente)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.delete("/:id", async (req, res) => {
    const { id } = req.params

    try {

        await prisma.$transaction(async (tx) => {
            await tx.telefone.deleteMany({
                where: { clienteId: id }
            })
            await tx.endereco.deleteMany({
                where: { clienteId: id }
            })
            await tx.cliente.delete({
                where: { id }
            })
        })
        res.status(200).json({ message: "Cliente Deletado com sucesso" })
    } catch (error) {
        res.status(400).json({ erro: error })
    }
})


export default router
