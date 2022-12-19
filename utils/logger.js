const winston = require('winston');

const logConfiguration = {
    transports: [
        new winston.transports.Console({
            level: 'warn',
            filename: 'logs/warn.log',
        }),
        new winston.transports.File({
            level: 'error',
            // Create the log directory if it does not exist
            filename: 'logs/errors.log',
        }),
        new winston.transports.Console({
            level: 'info',
            filename: 'logs/info.log',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        }),
    ],
    format: winston.format.combine(
        winston.format.label({
            label: `Label🏷️`,
        }),
        winston.format.timestamp({
            format: 'MMM-DD-YYYY HH:mm:ss',
        }),
        winston.format.printf((info) => `${info.level}: ${info.label}: ${[info.timestamp]}: ${info.message}`),
    ),
    exceptionHandlers: [
        new winston.transports.File({filename: 'logs/exceptions.log'}),
    ],
};


const logger = winston.createLogger(logConfiguration);

global.logger = logger;
