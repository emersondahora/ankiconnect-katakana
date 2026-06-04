import { Router } from 'express';
import { EventEmitter } from 'events';

export const progressEmitter = new EventEmitter();
export const decisionEmitter = new EventEmitter();

const router = Router();

router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('CONNECTED', { message: 'Connected to SSE' });

    const onProgress = (data: any) => sendEvent('PROGRESS', data);
    const onCardCreated = (data: any) => sendEvent('CARD_CREATED', data);
    const onDecisionRequired = (data: any) => sendEvent('DECISION_REQUIRED', data);
    const onFinished = (data: any) => sendEvent('FINISHED', data);

    progressEmitter.on('progress', onProgress);
    progressEmitter.on('card_created', onCardCreated);
    progressEmitter.on('decision_required', onDecisionRequired);
    progressEmitter.on('finished', onFinished);

    req.on('close', () => {
        progressEmitter.removeListener('progress', onProgress);
        progressEmitter.removeListener('card_created', onCardCreated);
        progressEmitter.removeListener('decision_required', onDecisionRequired);
        progressEmitter.removeListener('finished', onFinished);
    });
});

export default router;
