const warnedKeys = new Set<string>();

function warnOnce(message: string, key: string) {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
}

export function getEnvOrFallback(key: string, fallback: string): string {
  const value = process.env[key];
  if (value && value.trim().length > 0) {
    return value;
  }

  warnOnce(
    `[env] ${key} is not set. Using fallback value for compatibility. Set ${key} in your .env for production safety.`,
    key
  );
  return fallback;
}
