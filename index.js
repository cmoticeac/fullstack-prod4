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
const httpServer = http.createServer(app);
const ioServer = new Server(httpServer);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
  schema,
});

// ApolloServer constructor

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/subscriptions',
});
// Entrega el esquema al servidor WebSocket y comienza a escuchar.
const serverCleanup = useServer({ schema }, wsServer);


const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await apolloServer.start();

// Middlewares
app.use(express.static('public'));  // Serves the static files
dbConnection();
app.use('/db', cors(), express.json(), expressMiddleware(apolloServer)); // DB endpoint
app.use('/upload', fileUpload({ debug: true, uriDecodeFileNames: true }));

// Socket.io
ioServer.on('connection', socketHandler);

// Upload endpoint
app.post('/upload', uploadHandler);

// Server startup
await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at http://localhost:${PORT}`);