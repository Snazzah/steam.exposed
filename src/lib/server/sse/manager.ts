import type { AnyMessageEvent } from '$lib/sse/types';
import { achQ, runningAchJob } from '../queue';

import { ConnectionReadyState, type SSEConnection } from './client';

class SSEManager {
	jobGroups = new Map<string, SSEGroup>();
	interval = setInterval(() => this.onIntervalTick(), 1000 * 5) as unknown as number;

	async onIntervalTick() {
		const currentQueue = achQ.getQueue();
		for (const group of Array.from(this.jobGroups.values())) {
			if (group.clients.size === 0) group.destroy();
			else {
				const [steamid, yearStr] = group.id.split('-');
				const year = parseInt(yearStr, 10);
				const taskIndex = currentQueue.findIndex((t) => t.steamid === steamid && t.year === year);
				if (runningAchJob !== group.id && taskIndex === -1) group.destroy();
				else if (taskIndex !== -1)
					group.send({ event: 'update', data: { text: `In queue: ${taskIndex + 1}` } });
			}
		}
	}

	async push(jobId: string, connection: SSEConnection) {
		const group = this.jobGroups.get(jobId) ?? new SSEGroup(this, jobId);
		if (!this.jobGroups.has(jobId)) this.jobGroups.set(jobId, group);
		group.add(connection);
	}

	async destroy() {
		clearInterval(this.interval);
		for (const group of Array.from(this.jobGroups.values())) await group.destroy();
	}
}

class SSEGroup {
	public clients = new Map<string, SSEConnection>();
	subscribed = false;

	constructor(
		public manager: SSEManager,
		public id: string
	) {
		console.debug(`[SSE] Created SSE group ${id}`);
	}

	add(connection: SSEConnection) {
		if (connection.state !== ConnectionReadyState.READY) {
			console.warn(`[SSE:${this.id}] Tried to add a closed client`);
			return;
		}

		connection.send({ event: 'init', data: { id: connection.id, streaming: true } });
		this.clients.set(connection.id, connection);
		console.debug(`[SSE:${this.id}] Added client ${connection.id}`);

		connection.on('close', () => {
			console.debug(`[SSE:${this.id}] Client ${connection.id} closed`);
			this.clients.delete(connection.id);
		});

		return connection.id;
	}

	close(clientId: string) {
		console.debug(`[SSE:${this.id}] Closing client ${clientId}`);
		const connection = this.clients.get(clientId);
		if (!connection) return false;
		connection.close();
		return true;
	}

	send(event: AnyMessageEvent) {
		for (const connection of this.clients.values()) connection.send(event);
	}

	async destroy() {
		console.debug(`[SSE] Destroying SSE group ${this.id}`);
		for (const clientId of Array.from(this.clients.keys())) this.close(clientId);
		this.manager.jobGroups.delete(this.id);
	}
}

export const sseManager = new SSEManager();
