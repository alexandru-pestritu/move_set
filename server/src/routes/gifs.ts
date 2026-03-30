import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const router = Router();

router.get('/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  const filepath = path.join(config.gifDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'GIF not found' });
  }

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  return res.sendFile(filepath);
});

export default router;
