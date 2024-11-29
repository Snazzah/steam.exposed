import { getCachedAchievementData, getCachedYearInReview } from '$lib/server/data';
import { achQ, runningAchJob } from '$lib/server/queue';
import { SSEConnection, SSEResponse } from '$lib/server/sse/client';
import { sseManager } from '$lib/server/sse/manager';
import { requestIsBot } from '$lib/server/util';
import throttle from 'just-throttle';

import type { RequestHandler } from './$types';
import type { AnyMessageEvent } from '$lib/sse/types';

export const GET: RequestHandler = async ({ request, params }) => {
	const userAgent = request.headers.get('User-Agent');
	const isBot = requestIsBot(userAgent);

	if (isBot)
		return new SSEResponse([
			{
				event: 'end',
				data: { error: 'NO_DATA' }
			}
		]);

	const year = parseInt(params.year, 10);
	const yearInReview = await getCachedYearInReview(params.id, year);
	if (!yearInReview || Object.keys(yearInReview).length === 0)
		return new SSEResponse([
			{
				event: 'end',
				data: { error: 'NO_DATA' }
			}
		]);

	// Fetched cached result
	const achievementData = await getCachedAchievementData(params.id, year);
	if (achievementData)
		return new SSEResponse([
			{ event: 'init', data: { streaming: false, data: achievementData } },
			{ event: 'end', data: {} }
		]);

	const jobId = `${params.id}-${params.year}`;

	const task = achQ.getQueue().find((t) => t.steamid === params.id && t.year === year);
	if (!task && runningAchJob !== jobId) {
		const throttledSend = throttle(
			(msg: AnyMessageEvent) => {
				const group = sseManager.jobGroups.get(jobId);
				if (group) group.send(msg);
			},
			500,
			{ trailing: true }
		);
		achQ.push({
			steamid: params.id,
			year,
			yearInReview,
			send(msg) {
				if (msg.event === 'update') return throttledSend(msg);
				const group = sseManager.jobGroups.get(jobId);
				if (group) {
					group.send(msg);
					if (msg.event === 'end') {
						group.destroy();
						throttledSend.cancel();
					}
				}
			}
		});
	}

	const connection = new SSEConnection();
	sseManager.push(jobId, connection);

	return new Response(connection.stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
