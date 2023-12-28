// General imports
import express from 'express';
import http from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
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
import { pubsub } from './graphql/pubsub.js';

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

await apolloServer.start();

// Habilita las suscripciones utilizando SubscriptionServer
  SubscriptionServer.create(
    { execute, subscribe, schema: apolloServer.schema, pubsub },
    { server: httpServer, path: apolloServer.graphqlPath }
  );

// Middlewares
app.use(express.static('public'));  // Serves the static files
dbConnection();
app.use('/db', cors(), express.json(), expressMiddleware(apolloServer)); // DB endpoint
app.use('/upload', fileUpload({ debug: true, uriDecodeFileNames: true }));

// Upload endpoint
app.post('/upload', uploadHandler);

// Server startup
await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at http://localhost:${PORT}`);