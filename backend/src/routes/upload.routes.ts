import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { upload } from '../utils/upload';
import { Response } from 'express';

const router = Router();

router.post('/voice', authenticate, upload.single('audio'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const audioUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      data: {
        audioUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
});

export default router;
