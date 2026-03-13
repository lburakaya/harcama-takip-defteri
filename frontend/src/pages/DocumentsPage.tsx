import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { CloudArrowUp, FileText, Trash, ArrowClockwise, Check, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import * as Select from '@radix-ui/react-select';
import { CaretDown } from '@phosphor-icons/react';
import { getDocuments, uploadDocument, deleteDocument, reparseDocument } from '../api/documents.api';
import type { Document, PeriodType } from '../types';
import { PeriodTypeLabels, ParseStatus } from '../types';

const banks = ['Garanti', 'İş Bankası', 'Yapı Kredi', 'Akbank', 'Ziraat', 'Diğer'];
const periods: { value: PeriodType; label: string }[] = [
  { value: 'MONTHLY' as PeriodType, label: 'Aylık' },
  { value: 'TWO_MONTHS' as PeriodType, label: '2 Aylık' },
  { value: 'YEARLY' as PeriodType, label: 'Yıllık' },
];

const statusBadge = (status: ParseStatus) => {
  switch (status) {
    case ParseStatus.COMPLETED: return <Badge variant="success"><Check size={12} /> Analiz Edildi</Badge>;
    case ParseStatus.PROCESSING: return <Badge variant="warning">İşleniyor...</Badge>;
    case ParseStatus.FAILED: return <Badge variant="danger"><Warning size={12} /> Hata</Badge>;
    default: return <Badge variant="default">Bekliyor</Badge>;
  }
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('MONTHLY' as PeriodType);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch {
      // Silently handle error on first load
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!selectedBank) {
      toast.error('Lütfen bir banka seçiniz');
      return;
    }

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bankName', selectedBank);
        formData.append('periodType', selectedPeriod);
        await uploadDocument(formData);
      }
      toast.success(`${acceptedFiles.length} dosya yüklendi`);
      loadDocuments();
    } catch {
      toast.error('Dosya yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }, [selectedBank, selectedPeriod]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success('Döküman silindi');
      loadDocuments();
    } catch {
      toast.error('Silme başarısız');
    }
  };

  const handleReparse = async (id: string) => {
    try {
      await reparseDocument(id);
      toast.success('Yeniden analiz başlatıldı');
      loadDocuments();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card padding="lg">
        <h3 className="font-display font-semibold text-lg mb-4">Döküman Yükle</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Bank Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Banka</label>
            <Select.Root value={selectedBank} onValueChange={setSelectedBank}>
              <Select.Trigger className="flex items-center justify-between px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-sm text-text-primary">
                <Select.Value placeholder="Banka seçiniz" />
                <Select.Icon><CaretDown size={14} className="text-text-muted" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-bg-card border border-border-custom rounded-xl shadow-xl z-50">
                  <Select.Viewport className="p-1">
                    {banks.map((bank) => (
                      <Select.Item key={bank} value={bank} className="px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-bg-hover outline-none data-[highlighted]:bg-bg-hover text-text-primary">
                        <Select.ItemText>{bank}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Period Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Dönem</label>
            <Select.Root value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodType)}>
              <Select.Trigger className="flex items-center justify-between px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-sm text-text-primary">
                <Select.Value />
                <Select.Icon><CaretDown size={14} className="text-text-muted" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-bg-card border border-border-custom rounded-xl shadow-xl z-50">
                  <Select.Viewport className="p-1">
                    {periods.map((p) => (
                      <Select.Item key={p.value} value={p.value} className="px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-bg-hover outline-none data-[highlighted]:bg-bg-hover text-text-primary">
                        <Select.ItemText>{p.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-all duration-300
            ${isDragActive
              ? 'border-accent-green bg-accent-green/5'
              : 'border-border-custom hover:border-accent-green/50 hover:bg-bg-hover/30'
            }
          `}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={isDragActive ? { scale: 1.05, y: -5 } : { scale: 1, y: 0 }}
          >
            <CloudArrowUp size={48} className="text-text-muted mx-auto mb-3" weight="duotone" />
            <p className="text-sm text-text-secondary mb-1">
              {isDragActive
                ? 'Dosyayı bırakın...'
                : 'Dosyaları sürükleyip bırakın veya tıklayın'
              }
            </p>
            <p className="text-xs text-text-muted">PDF, XLSX, CSV — Maks. 20MB</p>
          </motion.div>
        </div>

        {uploading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-accent-green">
            <div className="w-4 h-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
            Yükleniyor...
          </div>
        )}
      </Card>

      {/* Documents List */}
      <Card padding="lg">
        <h3 className="font-display font-semibold text-lg mb-4">Yüklenmiş Dökümanlar</h3>

        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs border-b border-border-custom">
                  <th className="text-left py-3 px-2">Dosya Adı</th>
                  <th className="text-left py-3 px-2">Banka</th>
                  <th className="text-left py-3 px-2">Dönem</th>
                  <th className="text-left py-3 px-2">Tarih</th>
                  <th className="text-left py-3 px-2">Durum</th>
                  <th className="text-right py-3 px-2">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-bg-hover/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-text-muted shrink-0" />
                        <span className="truncate max-w-[200px]">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-text-secondary">{doc.bankName || '-'}</td>
                    <td className="py-3 px-2 text-text-secondary">{PeriodTypeLabels[doc.periodType]}</td>
                    <td className="py-3 px-2 text-text-secondary">
                      {new Date(doc.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 px-2">{statusBadge(doc.parseStatus)}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 justify-end">
                        {doc.parseStatus === ParseStatus.FAILED && (
                          <button
                            onClick={() => handleReparse(doc.id)}
                            className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-accent-amber transition-colors"
                            title="Yeniden parse et"
                          >
                            <ArrowClockwise size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
                          title="Sil"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            Henüz döküman yüklenmemiş
          </div>
        )}
      </Card>
    </div>
  );
}
