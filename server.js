const jsonServer  = require('json-server');
const path        = require('path');

const server      = jsonServer.create();
const router      = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({ static: '.' });

server.use(middlewares);
server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, function() {
  console.log('DecoFlow API lancée sur le port ' + PORT);
});