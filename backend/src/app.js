'use strict';
require('./config/zod');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.set('trust proxy', 1); // di belakang proxy Vercel: IP klien yang benar untuk rate limit
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // tanpa header Origin (curl, server-ke-server) diizinkan; browser hanya dari CORS_ORIGIN
      callback(null, !origin || env.corsOrigins.includes(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: '100kb' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
