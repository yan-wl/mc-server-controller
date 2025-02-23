import dotenv from 'dotenv';
dotenv.config();

const ENV_VARS = ['PORT', 'RCON_PASSWORD'] as const;

export function assertEnvironment(): void {
  for (const name of ENV_VARS) {
    if (process.env[name] === undefined) {
      process.exit(1);
    }
  }
}

assertEnvironment();

function get(name: typeof ENV_VARS[number]): string {
  const value = process.env[name];
  return value as string;
}

export default {
  get,
};
