import { useState, useEffect } from 'react';
import { FileText, DownloadSimple, ArrowClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { getReports, downloadReport, emailReport } from '../api/reports.api';
import type { Report, EmailStatus } from '../types';

const typeLabels = {
  DAILY: 'Günlük',
  MONTHLY: 'Aylık',
  DOCUMENT: 'Döküman',
};

const emailStatusBadge = (status: EmailStatus) => {
  switch (status) {
    case 'SENT' as EmailStatus: return <Badge variant="success">Gönderildi</Badge>;
    case 'FAILED' as EmailStatus: return <Badge variant="danger">Başarısız</Badge>;
    default: return <Badge variant="default">Bekliyor</Badge>;
  }
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id: string) => {
    downloadReport(id);
  };

  const handleResend = async (id: string, existingEmail: string) => {
    try {
      await emailReport(id, existingEmail);
      toast.success('E-posta tekrar gönderildi');
      loadReports();
    } catch {
      toast.error('E-posta gönderilemedi');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h3 className="font-display font-semibold text-lg mb-4">Raporlarım</h3>

        {reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs border-b border-border-custom">
                  <th className="text-left py-3 px-2">Rapor</th>
                  <th className="text-left py-3 px-2">Tür</th>
                  <th className="text-left py-3 px-2">Tarih</th>
                  <th className="text-left py-3 px-2">E-posta Durumu</th>
                  <th className="text-right py-3 px-2">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-bg-hover/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-accent-green shrink-0" />
                        <span className="truncate max-w-[200px]">{report.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="default" size="sm">
                        {typeLabels[report.type] || report.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-text-secondary">
                      {new Date(report.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 px-2">
                      {report.emailSentTo ? (
                        <div className="flex items-center gap-2">
                          {emailStatusBadge(report.emailStatus)}
                          <span className="text-xs text-text-muted">{report.emailSentTo}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">Gönderilmedi</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleDownload(report.id)}
                          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-accent-green transition-colors"
                          title="İndir"
                        >
                          <DownloadSimple size={16} />
                        </button>
                        {report.emailSentTo && (
                          <button
                            onClick={() => handleResend(report.id, report.emailSentTo!)}
                            className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-accent-amber transition-colors"
                            title="Tekrar gönder"
                          >
                            <ArrowClockwise size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p>Henüz rapor oluşturulmamış</p>
            <p className="text-xs mt-1">Bir analiz yaptıktan sonra PDF rapor oluşturabilirsiniz</p>
          </div>
        )}
      </Card>
    </div>
  );
}
