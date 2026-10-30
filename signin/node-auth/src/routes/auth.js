import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {requireAuth} from '../middleware/requireAuth.js';
import {config} from '../config.js';
import {validateCredentials} from '../validation.js';

const router = Router();
const sessionCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  path: '/',
  maxAge: config.sessionDurationMs,
};

router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {error: 'Too many authentication attempts. Try again in 15 minutes.'},
}));

function publicUser(user) {
  return {id: user.id, email: user.email};
}

function startSession(res, user) {
  const token = jwt.sign({}, config.jwtSecret, {
    subject: user.id,
    expiresIn: '8h',
    algorithm: 'HS256',
  });
  res.cookie(config.cookieName, token, sessionCookieOptions);
}

router.post('/signup', async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) {
    return res.status(400).json({error: credentials.error});
  }

  try {
    const user = await User.create(credentials);
    startSession(res, user);
    return res.status(201).json({user: publicUser(user)});
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({error: 'An account with that email already exists.'});
    }
    throw error;
  }
});

router.post('/login', async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) {
    return res.status(400).json({error: credentials.error});
  }

  const user = await User.findOne({email: credentials.email}).select('+password');
  if (!user || !(await user.comparePassword(credentials.password))) {
    return res.status(401).json({error: 'Email or password is incorrect.'});
  }

  startSession(res, user);
  return res.json({user: publicUser(user)});
});

router.get('/me', requireAuth, (req, res) => {
  res.json({user: publicUser(req.user)});
});

router.post('/logout', (req, res) => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
  });
  res.sendStatus(204);
});

export default router;