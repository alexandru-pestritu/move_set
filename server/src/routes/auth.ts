import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

const passwordHash = bcrypt.hashSync(config.password, 10);

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username !== config.username || !bcrypt.compareSync(password, passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return res.json({ ok: true, username });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ ok: true });
});

router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { username: string };
    return res.json({ username: decoded.username });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
