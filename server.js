#!/usr/bin/env node

/**
 * Module dependencies.
 */
 const { appPort, socialMediaProfileUpdateMode } = require('./config');
var app = require('./app');
var debug = require('debug')('social-profiles-syncker:server');
var http = require('http');
const {connectMongoDb} =  require('./models/mongo-db/index');
const {connectMysqlDb} =  require('./models/mysql');
/* registration of profile updater in app */
require('./profile-updater')
const SmProfileUpdateEmitter = require('./event-emitters/SmProfileUpdateEmitter')

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(appPort || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * 
 * connects to dbs
 */
const connectDb = () => {
  return new Promise(async(resolve, reject) => {
    try {
      /*Connecting to mongodb*/
      await connectMongoDb()
      /*Connection to mysql*/
      await connectMysqlDb()
      resolve()
    } catch (error) {
      reject()
    }
  })
}

/**
 * Listen on provided port, on all network interfaces.
 */
const startServer  = () => {
  return new Promise(async(resolve, reject) => {
    server.listen(port);
    server.on('error', onError);


    server.on('listening',  async() => {
      await onListening()

      resolve()
    });
  })
}


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  return new Promise( (resolve, reject) => {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);



    logger.info(`app listening at ${port}`);

    resolve()
  })
}


connectDb().then( async () => {
  await startServer()
  
  /* start profile updating process */
  if (socialMediaProfileUpdateMode  == 'true') {
    SmProfileUpdateEmitter.emit("update-social-profiles")
    console.log('profile updating process started!');
  }
})
