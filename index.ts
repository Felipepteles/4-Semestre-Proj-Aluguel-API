import express from 'express'
import cors from 'cors'
import logger from './src/config/logger'

import routesClientes from './routes/clientes'
import routesAdmins from './routes/admins'
import routesCategorias from './routes/categorias'
import routesFerramentas from './routes/ferramentas'
import routesEnderecos from './routes/enderecos'
import routesMarcas from './routes/marcas'
import routesTelefones from './routes/telefones'
import routesReservas from './routes/reservas'
import routesDashboard from './routes/dashboard'


const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use((req, res, next) => {
  // Loga cada requisição no nível 'http'
  logger.http(`[${req.method}] ${req.originalUrl}`, { 
    ip: req.ip,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  })
  next()
})

app.use("/clientes", routesClientes)
app.use("/admins", routesAdmins)
app.use("/categorias", routesCategorias)
app.use("/ferramentas", routesFerramentas)
app.use("/enderecos", routesEnderecos)
app.use("/marcas", routesMarcas)
app.use("/telefones", routesTelefones)
app.use("/reservas", routesReservas)
app.use("/dashboard", routesDashboard)

app.get('/', (req, res) => {
  res.send('API: Sistema de Aluguel de Ferramentas')
})

app.listen(port, () => {
  // console.log(`Servidor rodando na porta: ${port}`)
  logger.info(`Servidor rodando na porta: ${port}`)
})