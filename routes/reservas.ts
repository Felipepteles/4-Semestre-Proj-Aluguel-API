import { PrismaClient, Reserva } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import nodemailer from "nodemailer"


const prisma = new PrismaClient()
const router = Router()

const reservasSchema = z.object({
    clienteId: z.string(),
    ferramentaId: z.number(),
    descricao: z.string(),
    dataInicio: z.string(),
    dataFim: z.string()
})

function gerarTabelaReservaHTML(dados: any) {
  const dataInicio = new Date(dados.dataInicio).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const dataFim = new Date(dados.dataFim).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  let html = `
    <html>
      <body style="font-family: Helvetica, Arial, sans-serif; color: #333;">
        <h2 style="color: #004aad;">Caixa de Ferramentas - Detalhes da Reserva</h2>

        <h3>Cliente</h3>
        <table border="1" cellpadding="8" cellspacing="0" 
               style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <tr><th align="left" style="background:#f0f0f0;">Nome</th><td>${dados.cliente.nome}</td></tr>
          <tr><th align="left" style="background:#f0f0f0;">E-mail</th><td>${dados.cliente.email || 'Não informado'}</td></tr>
          <tr><th align="left" style="background:#f0f0f0;">Telefone</th><td>${dados.cliente.telefone || 'Não informado'}</td></tr>
        </table>

        <h3>Informações da Reserva</h3>
        <table border="1" cellpadding="8" cellspacing="0" 
               style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <tr><th align="left" style="background:#f0f0f0;">Código da Reserva</th><td>${dados.id}</td></tr>
          <tr><th align="left" style="background:#f0f0f0;">Descrição</th><td>${dados.descricao}</td></tr>
          <tr><th align="left" style="background:#f0f0f0;">Data Início</th><td>${dataInicio}</td></tr>
          <tr><th align="left" style="background:#f0f0f0;">Data Fim</th><td>${dataFim}</td></tr>
          <tr><th align="left" style="background:#f0f0f0;">Valor Total</th><td>R$ ${Number(dados.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
        </table>

        <h3>Ferramenta Reservada</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead style="background-color: #e0e0e0;">
            <tr>
              <th>Nome</th>
              <th>Marca</th>
              <th>Categoria</th>
              <th>Preço Diaria (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${dados.ferramenta.nome}</td>
              <td>${dados.ferramenta.marca?.nome || 'N/A'}</td>
              <td>${dados.ferramenta.categoria?.nome || 'N/A'}</td>
              <td>${Number(dados.ferramenta.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 30px;">
          <strong>Observação:</strong> Por favor, compareça na data combinada para retirada e devolução da ferramenta.
        </p>

        <p style="margin-top: 20px; font-size: 12px; color: #777;">
          Este é um e-mail automático. Não responda diretamente a esta mensagem.
        </p>
      </body>
    </html>
  `

  return html
}

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "542a6bea815e32",
    pass: "6c141a399b82a7",
  },
})

async function enviaEmail(dados: any) {

  const mensagem = gerarTabelaReservaHTML(dados)
  const info = await transporter.sendMail({
    from: 'Caixa de Ferramentas <caixadeferramentas@gmail.com>',
    to: dados.cliente.email,
    subject: "Relatório de Reserva",
    text: "Relatório de Reserva...",
    html: mensagem, 
  })

  console.log("Message sent:", info.messageId)
}

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
    
    const { clienteId, ferramentaId, descricao, dataInicio, dataFim }= valida.data

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
    res.status(400).json({ erro: "Erro... Código da Ferramenta inválido" })
    return
  }

  let disponivelReservar = true
  const inicioReserva = new Date(dataInicio)
  const fimReserva = new Date(dataFim)
  const diferencaMili = fimReserva.getTime() - inicioReserva.getTime()
  const milisegundosPDia = 1000*60*60*24
  const diferencaDias = Math.abs(diferencaMili/milisegundosPDia)
  
  dadoFerramenta.reserva.forEach(reserva =>{
    if (reserva.dataInicio <= inicioReserva && reserva.dataFim >= inicioReserva  || reserva.dataInicio <= fimReserva && reserva.dataFim >= fimReserva || inicioReserva <= reserva.dataInicio && fimReserva >= reserva.dataFim){
      disponivelReservar = false
    }
  })

    try {
      if (disponivelReservar){
        const reserva = await prisma.reserva.create({
        data:{clienteId, ferramentaId, descricao, valor : Number(dadoFerramenta?.preco)*diferencaDias, dataInicio: inicioReserva, dataFim: fimReserva  }
        })
        res.status(201).json({...reserva, valor: reserva.valor.toNumber()})
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

router.patch("/:id", async (req, res) => {
const { id } = req.params;

  try {
    const reserva = await prisma.reserva.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true,
        ferramenta: {
          include: {
            marca: true,
            categoria: true
          }
        }
      }
    })

    const reservaAtualizada = await prisma.reserva.update({
      where: { id: Number(id) },
      data: { status: "confirmado" },
      include: {
        cliente: true,
        ferramenta: {
          include: {
            marca: true,
            categoria: true
          }
        }
      }
    })

    enviaEmail(reservaAtualizada)

    res.status(200).json({ mensagem: "E-mail enviado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao enviar e-mail"});
  }
})


export default router
