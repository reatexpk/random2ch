import winston from 'winston';

const { printf } = winston.format;

const myFormat = printf(({ level, message }) => {
  return `[${new Date().toISOString()}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  format: myFormat,
  transports: [
    new winston.transports.File({ filename: 'common.log' }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

export default logger;
