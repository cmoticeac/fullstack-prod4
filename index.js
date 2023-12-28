// General imports
import express from 'express';
import http from 'http';
import cors from 'cors';
import 'dotenv/config';

// Apollo imports
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

// Socket.io imports
import { Server } from 'socket.io';

// Upload imports
import fileUpload from 'express-fileupload';

// Application imports
import { dbConnection } from './config/config.js';
import typeDefs from './graphql/typeDefs.js';
import resolvers from './graphql/resolvers.js';
import socketHandler from './handlers/socket.js';
import uploadHandler from './handlers/upload.js';

// Constants
const PORT = process.env.PORT || 4000;

// Create main app
const app = express();
app.use(cors());

// Crear el servidor HTTP
const httpServer = createServer(app);

// Crear el socket.io
const ioServer = new Server(httpServer);

// Crear un esquema GraphQL
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Crear el servidor WebSocket
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/subscriptions',
});

// Inicializar el servidor WebSocket
const serverCleanup = useServer({ schema }, wsServer);

// Configurar ApolloServer
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

// Iniciar ApolloServer
await apolloServer.start();

// Middlewares
app.use(express.static('public')); // Serves the static files
dbConnection();
app.use('/db', cors(), express.json(), expressMiddleware(apolloServer)); // DB endpoint
app.use('/upload', fileUpload({ debug: true, uriDecodeFileNames: true }));

// Configurar Socket.io
ioServer.on('connection', socketHandler);

// Configurar el endpoint de carga
app.post('/upload', uploadHandler);

// Iniciar el servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`Socket.IO server listening on port ${PORT}`);
});
