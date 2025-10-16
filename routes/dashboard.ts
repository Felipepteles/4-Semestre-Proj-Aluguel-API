import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const ferramentas = await prisma.ferramenta.count()
    const reservas = await prisma.reserva.count()

    res.status(200).json({ clientes, ferramentas, reservas })
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/topFerramentas", async (req, res) => {
  try {
    const groupedReservas = await prisma.reserva.groupBy({
      by: ['ferramentaId'],
      _count: {
        ferramentaId: true,
      },
      orderBy: {
        _count: {
          ferramentaId: 'desc',
        },
      },
      take: 5,
    });

    const topFerramentas = await Promise.all(
      groupedReservas.map(async (reserva) => {
        const ferramenta = await prisma.ferramenta.findUnique({
          where: { id: reserva.ferramentaId },
          select: { nome: true },
        });
        return {
          nome: ferramenta?.nome || 'Desconhecida',
          total: reserva._count.ferramentaId,
        };
      })
    );

    res.status(200).json(topFerramentas);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/topMarcas", async (req, res) => {
  try {
    const todasReservas = await prisma.reserva.findMany({
      include: {
        ferramenta: {
          include: {
            marca: true,
          },
        },
      },
    });

    const marcaCounts = todasReservas.reduce((acc, reserva) => {
      const marcaNome = reserva.ferramenta.marca.nome;
      acc[marcaNome] = (acc[marcaNome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMarcas = Object.entries(marcaCounts)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.status(200).json(topMarcas);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/reservasCategoria", async (req, res) => {
  try {
    const todasReservas = await prisma.reserva.findMany({
      include: {
        ferramenta: {
          include: {
            categoria: true,
          },
        },
      },
    });

    const categoriaCounts = todasReservas.reduce((acc, reserva) => {
      const categoriaNome = reserva.ferramenta.categoria.nome;
      acc[categoriaNome] = (acc[categoriaNome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reservasPorCategoria = Object.entries(categoriaCounts)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json(reservasPorCategoria);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/novosClientesMes", async (req, res) => {
  try {
    const result: { mes_numero: number, mes_nome: string, total: BigInt }[] = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") as mes_numero,
        TO_CHAR("createdAt", 'Mon') as mes_nome,
        COUNT(id) as total
      FROM clientes
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY mes_numero, mes_nome
      ORDER BY mes_numero;
    `;

    const mesesPt: Record<string, string> = {
      'Jan': 'Jan', 'Feb': 'Fev', 'Mar': 'Mar', 'Apr': 'Abr',
      'May': 'Mai', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Ago',
      'Sep': 'Set', 'Oct': 'Out', 'Nov': 'Nov', 'Dec': 'Dez'
    };
    
    const novosClientes = result.map(item => ({
      mes: mesesPt[item.mes_nome.trim()] || item.mes_nome,
      total: Number(item.total)
    }));

    res.status(200).json(novosClientes);
  } catch (error) {
    res.status(400).json(error)
  }
});


export default router