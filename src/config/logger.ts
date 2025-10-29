import winston, { format } from 'winston'
import 'winston-daily-rotate-file'

const { combine, timestamp, json, colorize, printf, errors } = format

// Define os níveis de log padrão do NPM (error, warn, info, http, verbose, debug, silly)
const levels = winston.config.npm.levels

// Determina o nível de log com base no ambiente
const level = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'

// --- Formatos ---

// Formato para os arquivos de log (JSON)
const fileJsonFormat = combine(
  timestamp({ format: 'DD/MM/YYYY - HH:mm:ss' }),
  errors({ stack: true }), // Garante que o stack trace do erro seja logado
  json()
)

// Formato para o console (Legível, com cores)
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      // Formato especial para erros, incluindo o stack trace
      return `[${timestamp}] ${level}: ${message} \n${stack}`
    }
    return `[${timestamp}] ${level}: ${message}`
  })
)

// --- Transportes ---

// Transporte para salvar todos os logs em arquivos diários
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/all-%DATE%.log', // Padrão do nome do arquivo
  datePattern: 'YYYY-MM-DD',      // Rotaciona diariamente
  zippedArchive: true,            // Compacta logs antigos
  maxSize: '20m',                 // Tamanho máximo de 20MB
  maxFiles: '14d',                // Guarda logs por 14 dias
  level: 'silly',                 // Loga tudo (desde 'silly' para cima)
  format: fileJsonFormat,
})

// Transporte para salvar APENAS logs de erro
const errorFileTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',                 // Loga apenas 'error'
  format: fileJsonFormat,
})

// Transporte para o console (usado apenas em desenvolvimento)
const consoleTransport = new winston.transports.Console({
  level: 'debug',                 // Mostra até 'debug' no console dev
  format: consoleFormat,
})

// --- Criação do Logger ---

const logger = winston.createLogger({
  levels,
  level, // Nível mínimo de log (ignora logs abaixo de 'warn' em produção)
  transports: [
    dailyRotateFileTransport,
    errorFileTransport,
  ],
  exitOnError: false, // Não encerra a aplicação em um erro de log
})

// Se não estiver em produção, adiciona o log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport)
}

export default logger