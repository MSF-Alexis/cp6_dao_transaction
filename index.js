// src/index.js

import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

import productRoutes from './api/routes/products.js';
import orderRoutes from './api/routes/orders.js';
import errorHandler from './api/middlewares/errorHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares globaux
app.use(helmet());               // Sécurisation des headers HTTP
app.use(cors());                 // Cross-Origin Resource Sharing
app.use(bodyParser.json());      // Analyse JSON du corps des requêtes

// Point de santé
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Routes API
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Middleware de gestion des erreurs (dernier)
app.use(errorHandler);

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});

export default app;
