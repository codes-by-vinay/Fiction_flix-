import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {config} from '../config.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies[config.cookieName];
  if (!token) {
    return res.status(401).json({error: 'Sign in to continue.'});
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, {algorithms: ['HS256']});
  } catch {
    return res.status(401).json({error: 'Your session has expired. Sign in again.'});
  }

  const user = await User.findById(payload.sub).select('_id email');
  if (!user) {
    return res.status(401).json({error: 'Your session is no longer valid. Sign in again.'});
  }
  req.user = user;
  return next();
}