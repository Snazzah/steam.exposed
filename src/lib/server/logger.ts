function loggerPrefix() {
	return `[${new Date().toISOString()}]`;
}

export function logInfo(...args: any[]) {
	console.info(loggerPrefix(), '{INFO}', ...args);
}

export function logError(...args: any[]) {
	console.error(loggerPrefix(), '{INFO}', ...args);
}

export function logQueue(...args: any[]) {
	console.info(loggerPrefix(), '{QUEUE}', ...args);
}
