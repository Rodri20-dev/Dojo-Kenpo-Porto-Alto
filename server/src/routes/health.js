import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({ data: { status: 'ok' }, meta: { requestId: req.requestId } });
});
