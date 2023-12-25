function loggerPrefix() {
  return `[${new Date().toISOString()}]`
}

export function logInfo(...args: any[]) {
  console.info(loggerPrefix(), '{INFO}', ...args)
}
