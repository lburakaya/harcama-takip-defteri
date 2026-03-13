import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── LIST ANALYSES ──────────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(analyses);
  } catch (err) {
    next(err);
  }
});

// ─── DAILY ANALYSIS ─────────────────────────────────────
router.post('/daily', async (req: AuthRequest, res, next) => {
  try {
    const { date } = req.body;
    const dateObj = new Date(date);

    const analysis = await prisma.analysis.create({
      data: {
        userId: req.user!.id,
        type: 'DAILY',
        status: 'PENDING',
        analysisDate: dateObj,
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
      },
    });

    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
});

// ─── MONTHLY ANALYSIS ───────────────────────────────────
router.post('/monthly', async (req: AuthRequest, res, next) => {
  try {
    const { year, month } = req.body;

    const analysis = await prisma.analysis.create({
      data: {
        userId: req.user!.id,
        type: 'MONTHLY',
        status: 'PENDING',
        year,
        month,
      },
    });

    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
});

// ─── DOCUMENT ANALYSIS ──────────────────────────────────
router.post('/document', async (req: AuthRequest, res, next) => {
  try {
    const { documentId } = req.body;

    const analysis = await prisma.analysis.create({
      data: {
        userId: req.user!.id,
        type: 'DOCUMENT',
        status: 'PENDING',
        documentId,
      },
    });

    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
});

// ─── SSE STREAM ─────────────────────────────────────────
router.get('/stream/:id', async (req: AuthRequest, res, next) => {
  try {
    const analysis = await prisma.analysis.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!analysis) {
      res.status(404).json({ message: 'Analiz bulunamadı' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Update status
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { status: 'PROCESSING' },
    });

    // Get expense data based on analysis type
    let expenses;
    let prompt: string;

    if (analysis.type === 'DAILY' && analysis.analysisDate) {
      const dateObj = new Date(analysis.analysisDate);
      expenses = await prisma.expense.findMany({
        where: {
          userId: req.user!.id,
          year: dateObj.getFullYear(),
          month: dateObj.getMonth() + 1,
          day: dateObj.getDate(),
        },
      });
      prompt = buildDailyPrompt(expenses, dateObj);
    } else if (analysis.type === 'MONTHLY' && analysis.year && analysis.month) {
      expenses = await prisma.expense.findMany({
        where: {
          userId: req.user!.id,
          year: analysis.year,
          month: analysis.month,
        },
      });
      prompt = buildMonthlyPrompt(expenses, analysis.year, analysis.month);
    } else {
      prompt = 'Bu analiz türü henüz desteklenmiyor.';
      expenses = [];
    }

    // If no API key, return mock
    if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY === 'sk-ant-your-key-here') {
      const mockResponse = generateMockAnalysis(expenses || []);
      for (const chunk of mockResponse.split(' ')) {
        res.write(`data: ${JSON.stringify({ content: chunk + ' ' })}\n\n`);
        await sleep(50);
      }
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          rawResponse: mockResponse,
          summary: mockResponse.substring(0, 200),
        },
      });
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Real Anthropic streaming
    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

      const stream = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
        system: 'Sen bir finansal analiz uzmanısın. Türkçe cevap ver. Harcamaları analiz et, gereksiz harcamaları belirle ve tasarruf önerileri sun. Yanıtını düzenli ve okunabilir şekilde formatla.',
      });

      let fullResponse = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          rawResponse: fullResponse,
          rawPrompt: prompt,
          summary: fullResponse.substring(0, 200),
        },
      });

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (aiError) {
      console.error('Anthropic API error:', aiError);
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: { status: 'FAILED' },
      });
      res.write(`data: ${JSON.stringify({ error: 'AI analizi başarısız oldu' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (err) {
    next(err);
  }
});

// ─── HELPERS ────────────────────────────────────────────

function buildDailyPrompt(expenses: any[], date: Date): string {
  const dateStr = date.toLocaleDateString('tr-TR');
  const total = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  const items = expenses.map((e: any) =>
    `- ${e.name}: ₺${Number(e.amount).toFixed(2)} (${e.category}${e.note ? ', Not: ' + e.note : ''})`
  ).join('\n');

  return `${dateStr} tarihli günlük harcama analizi:

Toplam: ₺${total.toFixed(2)}
Harcama sayısı: ${expenses.length}

Harcamalar:
${items || 'Harcama bulunamadı'}

Lütfen şunları yap:
1. Bu günkü harcamaları değerlendir
2. Gereksiz veya azaltılabilir harcamaları belirle
3. Tasarruf önerileri sun
4. Genel bir puan ver (1-10)`;
}

function buildMonthlyPrompt(expenses: any[], year: number, month: number): string {
  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const total = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  }

  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => `- ${cat}: ₺${amount.toFixed(2)}`)
    .join('\n');

  return `${monthNames[month - 1]} ${year} aylık harcama analizi:

Toplam harcama: ₺${total.toFixed(2)}
Harcama sayısı: ${expenses.length}
Günlük ortalama: ₺${(total / new Date(year, month, 0).getDate()).toFixed(2)}

Kategori bazında:
${categoryBreakdown || 'Veri yok'}

Lütfen şunları yap:
1. Aylık harcama trendini değerlendir
2. En çok harcama yapılan kategorileri analiz et
3. Gereksiz harcamaları listele (JSON formatında)
4. Tasarruf önerilerini listele (JSON formatında)
5. Genel değerlendirme ve puan (1-10)`;
}

function generateMockAnalysis(expenses: any[]): string {
  const total = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  return `📊 **Harcama Analizi**

Toplam harcamanız: ₺${total.toFixed(2)}
Harcama sayısı: ${expenses.length}

**Değerlendirme:**
Bu dönemde harcamalarınız genel olarak makul seviyelerde. Ancak bazı kategorilerde optimize edilebilecek alanlar mevcut.

**Tasarruf Önerileri:**
1. Market harcamalarında liste yaparak %15-20 tasarruf sağlayabilirsiniz
2. Abonelik hizmetlerinizi gözden geçirmenizi öneriyorum
3. Ulaşım giderlerini toplu taşıma ile azaltabilirsiniz

**Genel Puan:** 7/10

> Not: Bu bir demo analizdir. Gerçek analiz için Anthropic API anahtarınızı .env dosyasına ekleyin.`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
