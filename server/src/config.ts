import path from 'path';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  username: process.env.MOVESET_USERNAME || 'admin',
  password: process.env.MOVESET_PASSWORD || 'changeme',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
  dbPath: process.env.DB_PATH || path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'moveset.db'),
  gifDir: process.env.GIF_DIR || path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'gifs'),
  proxyUrl: process.env.PROXY_URL || '',
};
