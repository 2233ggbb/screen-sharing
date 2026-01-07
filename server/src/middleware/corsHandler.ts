/**
 * CORS中间件配置
 */

import cors from 'cors';
import { config } from '../config';

/**
 * CORS中间件
 */
export const corsHandler = cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
