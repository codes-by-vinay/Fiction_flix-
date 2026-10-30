import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import authRoutes from './routes/auth.js';

const app = express();
const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  },
}));
app.use(express.json({limit: '10kb'}));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use(express.static(path.resolve(publicDirectory)));
app.use('/api', (_req, res) => res.status(404).json({error: 'API route not found.'}));

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({error: 'Request body must be valid JSON.'});
  }
  console.error(error);
  return res.status(500).json({error: 'Something went wrong. Please try again.'});
});

export default app;