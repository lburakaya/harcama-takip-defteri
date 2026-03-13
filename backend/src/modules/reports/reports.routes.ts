import { Router } from 'express';
import { prisma } from '../../config/database';
import { minioClient } from '../../config/minio';
import { env } from '../../config/env';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';
import nodemailer from 'nodemailer';

const router = Router();
router.use(authMiddleware);

// ─── LIST REPORTS ───────────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

// ─── GENERATE REPORT (simplified — creates a record, PDF generation can be async) ──
router.post('/generate', async (req: AuthRequest, res, next) => {
  try {
    const { analysisId } = req.body;

    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId: req.user!.id },
    });

    if (!analysis) {
      res.status(404).json({ message: 'Analiz bulunamadı' });
      return;
    }

    // Generate a simple text-based "report" file
    const reportContent = `Harcama Analizi Raporu\n${'='.repeat(40)}\n\n${analysis.rawResponse || analysis.summary || 'Analiz sonucu bulunamadı'}`;

    const fileName = `rapor_${analysis.type.toLowerCase()}_${Date.now()}.txt`;
    const fileKey = `${req.user!.id}/reports/${fileName}`;

    // Upload to MinIO
    await minioClient.putObject(
      env.MINIO_BUCKET_REPORTS,
      fileKey,
      Buffer.from(reportContent, 'utf-8'),
      reportContent.length,
      { 'Content-Type': 'text/plain; charset=utf-8' }
    );

    const report = await prisma.report.create({
      data: {
        userId: req.user!.id,
        analysisId: analysis.id,
        type: analysis.type as any,
        fileKey,
        fileName,
      },
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

// ─── DOWNLOAD REPORT ────────────────────────────────────
router.get('/:id/download', async (req: AuthRequest, res, next) => {
  try {
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!report) {
      res.status(404).json({ message: 'Rapor bulunamadı' });
      return;
    }

    const stream = await minioClient.getObject(env.MINIO_BUCKET_REPORTS, report.fileKey);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// ─── EMAIL REPORT ───────────────────────────────────────
router.post('/:id/email', async (req: AuthRequest, res, next) => {
  try {
    const { email } = req.body;

    const report = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!report) {
      res.status(404).json({ message: 'Rapor bulunamadı' });
      return;
    }

    // Get file from MinIO
    const chunks: Buffer[] = [];
    const stream = await minioClient.getObject(env.MINIO_BUCKET_REPORTS, report.fileKey);
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Send email
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: `Harcama Takip - ${report.fileName}`,
      text: 'Harcama analiz raporunuz ekte bulunmaktadır.',
      attachments: [
        {
          filename: report.fileName,
          content: fileBuffer,
        },
      ],
    });

    await prisma.report.update({
      where: { id: report.id },
      data: {
        emailSentTo: email,
        emailSentAt: new Date(),
        emailStatus: 'SENT',
      },
    });

    res.json({ message: 'E-posta gönderildi' });
  } catch (err) {
    // Update status as failed
    if (req.params.id) {
      await prisma.report.update({
        where: { id: req.params.id },
        data: { emailStatus: 'FAILED' },
      }).catch(() => {});
    }
    next(err);
  }
});

export default router;
