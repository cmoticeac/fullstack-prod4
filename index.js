// General imports
import express from 'express';
import http from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import cors from 'cors';
import 'dotenv/config';
import { pubsub } from './graphql/pubsub.js';
 
// Apollo imports
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import {
  ApolloServerPluginDrainHttpServer
} from '@apollo/server/plugin/drainHttpServer';

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

// ApolloServer constructor
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

//Iniciar Apollo Server
await apolloServer.start();

// Middlewares
app.use(express.static('public'));  // Serves the static files
dbConnection();
app.use('/db', cors(), express.json(), expressMiddleware(apolloServer)); // DB endpoint
app.use('/upload', fileUpload({ debug: true, uriDecodeFileNames: true }));

// Configurar el servidor de websockets con SubscriptionServer
SubscriptionServer.create(
  { execute, subscribe, schema: apolloServer.schema, pubSub },
  { server: httpServer, path: apolloServer.graphqlPath }
);


// Upload endpoint
app.post('/upload', uploadHandler);

// Iniciar servidor de subscriptions (WebSocket)
SubscriptionServer.create(
  { execute, subscribe, schema: apolloServer.schema },
  { server: httpServer, path: apolloServer.graphqlPath }
);

// Server startup
await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at http://localhost:${PORT}`);