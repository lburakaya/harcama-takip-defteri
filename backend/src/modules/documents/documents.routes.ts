import { Router } from 'express';
import { prisma } from '../../config/database';
import { minioClient } from '../../config/minio';
import { env } from '../../config/env';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();
router.use(authMiddleware);

// ─── LIST DOCUMENTS ─────────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (err) {
    next(err);
  }
});

// ─── UPLOAD DOCUMENT ────────────────────────────────────
router.post('/upload', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'Dosya gereklidir' });
      return;
    }

    const { bankName, periodType } = req.body;
    const fileKey = `${req.user!.id}/${Date.now()}-${file.originalname}`;

    // Upload to MinIO
    await minioClient.putObject(
      env.MINIO_BUCKET_DOCUMENTS,
      fileKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    // Calculate period dates
    const now = new Date();
    let periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (periodType === 'TWO_MONTHS') {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    } else if (periodType === 'YEARLY') {
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31);
    }

    const document = await prisma.document.create({
      data: {
        userId: req.user!.id,
        fileName: file.originalname,
        fileKey,
        fileSize: file.size,
        mimeType: file.mimetype,
        bankName: bankName || null,
        periodType: periodType || 'MONTHLY',
        periodStart,
        periodEnd,
      },
    });

    // TODO: Queue document parsing job

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE DOCUMENT ────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!doc) {
      res.status(404).json({ message: 'Döküman bulunamadı' });
      return;
    }

    // Delete from MinIO
    try {
      await minioClient.removeObject(env.MINIO_BUCKET_DOCUMENTS, doc.fileKey);
    } catch { /* ignore if already deleted */ }

    // Delete related expenses
    await prisma.expense.deleteMany({ where: { documentId: doc.id } });
    await prisma.document.delete({ where: { id: doc.id } });

    res.json({ message: 'Döküman silindi' });
  } catch (err) {
    next(err);
  }
});

// ─── REPARSE DOCUMENT ───────────────────────────────────
router.post('/:id/reparse', async (req: AuthRequest, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!doc) {
      res.status(404).json({ message: 'Döküman bulunamadı' });
      return;
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { parseStatus: 'PENDING', parseError: null },
    });

    // TODO: Queue re-parse job

    res.json({ message: 'Yeniden parse başlatıldı' });
  } catch (err) {
    next(err);
  }
});

export default router;
