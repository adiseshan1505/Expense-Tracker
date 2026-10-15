const nodeEnv = process.env.NODE_ENV ?? 'development';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  jwtSecret = 'dev-only-insecure-secret';
  console.warn('JWT_SECRET is not set; using an insecure development secret.');
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT ?? 5050),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/expense-tracker',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientUrls: (process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),
};
