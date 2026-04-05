const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const booleanSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }

  return Boolean(value);
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:5432/finance_dashboard'),
  DATABASE_SSL: booleanSchema.default(false),
  JWT_SECRET: z.string().min(16).default('change_me_in_development_only'),
  JWT_EXPIRES_IN: z.string().min(2).default('15m'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(parsedEnv.error.flatten().fieldErrors)}`
  );
}

const env = parsedEnv.data;

module.exports = {
  bcryptRounds: env.BCRYPT_ROUNDS,
  databaseSsl: env.DATABASE_SSL,
  databaseUrl: env.DATABASE_URL,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtSecret: env.JWT_SECRET,
  logLevel: env.LOG_LEVEL,
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
};
