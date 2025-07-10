
import { type Request, type Response } from 'express';

export const getTestMessage = (req: Request, res: Response) => {
    res.json({
        service: 'flarebee-api',
        timestamp: new Date().toISOString(),
        message: 'This is a test response from the TypeScript API!',
    });
};
