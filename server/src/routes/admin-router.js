
import { Router } from 'express';

export const adminTestRouter = Router();

adminTestRouter.get('/', (req, res) => {
  res.status(200).json({
    data: {
      status: 'authenticated',
      userId: req.auth.userId,
      role: req.auth.role,
    },
    meta: {
      requestId: res.getHeader('X-Request-Id'),
    },
  });
});
