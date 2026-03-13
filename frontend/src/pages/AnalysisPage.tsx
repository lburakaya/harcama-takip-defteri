import { useState, useRef, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Sparkle, CalendarBlank, FileText, DownloadSimple, EnvelopeSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

import { useRealTime } from '../hooks/useRealTime';
import {
  startDailyAnalysis,
  startMonthlyAnalysis,
  startDocumentAnalysis,
  createAnalysisStream,
  getAnalysisList,
} from '../api/analysis.api';
import { getDocuments } from '../api/documents.api';
import { generateReport, downloadReport, emailReport } from '../api/reports.api';
import type { Analysis, Document, UnnecessaryExpense, SavingsSuggestion } from '../types';
import * as Select from '@radix-ui/react-select';
import { CaretDown } from '@phosphor-icons/react';

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export default function AnalysisPage() {
  const { currentYear, currentMonth, realDate } = useRealTime();

  // Common state
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [email, setEmail] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Daily tab state
  const [dailyDate, setDailyDate] = useState(realDate || '');

  // Monthly tab state
  const [monthlyYear, setMonthlyYear] = useState(currentYear);
  const [monthlyMonth, setMonthlyMonth] = useState(currentMonth);

  // Document tab state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');

  // History
  const [history, setHistory] = useState<Analysis[]>([]);

  useEffect(() => {
    if (realDate) setDailyDate(realDate);
  }, [realDate]);

  useEffect(() => {
    loadDocuments();
    loadHistory();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch { /* ignore */ }
  };

  const loadHistory = async () => {
    try {
      const list = await getAnalysisList();
      setHistory(list);
    } catch { /* ignore */ }
  };

  const startStream = (analysisId: string) => {
    setStreaming(true);
    setStreamText('');

    const es = createAnalysisStream(analysisId);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === '[DONE]') {
        es.close();
        setStreaming(false);
        loadHistory();
        return;
      }
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.content) {
          setStreamText((prev) => prev + parsed.content);
        }
        if (parsed.result) {
          setCurrentAnalysis(parsed.result);
        }
      } catch {
        setStreamText((prev) => prev + event.data);
      }
    };

    es.onerror = () => {
      es.close();
      setStreaming(false);
      toast.error('Analiz akışı kesildi');
    };
  };

  const handleDailyAnalysis = async () => {
    if (!dailyDate) {
      toast.error('Tarih seçiniz');
      return;
    }
    try {
      const analysis = await startDailyAnalysis(dailyDate);
      setCurrentAnalysis(analysis);
      startStream(analysis.id);
    } catch {
      toast.error('Analiz başlatılamadı');
    }
  };

  const handleMonthlyAnalysis = async () => {
    try {
      const analysis = await startMonthlyAnalysis(monthlyYear, monthlyMonth);
      setCurrentAnalysis(analysis);
      startStream(analysis.id);
    } catch {
      toast.error('Analiz başlatılamadı');
    }
  };

  const handleDocumentAnalysis = async () => {
    if (!selectedDocId) {
      toast.error('Döküman seçiniz');
      return;
    }
    try {
      const analysis = await startDocumentAnalysis(selectedDocId);
      setCurrentAnalysis(analysis);
      startStream(analysis.id);
    } catch {
      toast.error('Analiz başlatılamadı');
    }
  };

  const handleGeneratePdf = async () => {
    if (!currentAnalysis) return;
    try {
      const report = await generateReport(currentAnalysis.id);
      downloadReport(report.id);
      toast.success('PDF oluşturuldu');
    } catch {
      toast.error('PDF oluşturulamadı');
    }
  };

  const handleSendEmail = async () => {
    if (!currentAnalysis || !email) return;
    try {
      const report = await generateReport(currentAnalysis.id);
      await emailReport(report.id, email);
      toast.success('E-posta gönderildi!');
    } catch {
      toast.error('E-posta gönderilemedi');
    }
  };

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <Tabs.Root defaultValue="daily">
        <Tabs.List className="flex border-b border-border-custom mb-6">
          {[
            { value: 'daily', label: 'Günlük Analiz', icon: CalendarBlank },
            { value: 'monthly', label: 'Aylık Analiz', icon: Sparkle },
            { value: 'document', label: 'Döküman Analizi', icon: FileText },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-muted border-b-2 border-transparent data-[state=active]:text-accent-green data-[state=active]:border-accent-green transition-colors"
            >
              <tab.icon size={16} />
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Daily Tab */}
        <Tabs.Content value="daily">
          <Card padding="lg">
            <div className="flex items-end gap-4 mb-6">
              <div className="flex-1">
                <Input
                  label="Tarih"
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                />
              </div>
              <Button onClick={handleDailyAnalysis} loading={streaming} icon={<Sparkle size={16} />}>
                Analiz Et
              </Button>
            </div>
          </Card>
        </Tabs.Content>

        {/* Monthly Tab */}
        <Tabs.Content value="monthly">
          <Card padding="lg">
            <div className="flex items-end gap-4 mb-6">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Yıl</label>
                  <select
                    value={monthlyYear}
                    onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                    className="px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-text-primary text-sm"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Ay</label>
                  <select
                    value={monthlyMonth}
                    onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                    className="px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-text-primary text-sm"
                  >
                    {monthNames.map((name, i) => (
                      <option key={i} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button onClick={handleMonthlyAnalysis} loading={streaming} icon={<Sparkle size={16} />}>
                Analiz Et
              </Button>
            </div>
          </Card>
        </Tabs.Content>

        {/* Document Tab */}
        <Tabs.Content value="document">
          <Card padding="lg">
            <div className="flex items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium text-text-secondary block mb-1.5">Döküman</label>
                <Select.Root value={selectedDocId} onValueChange={setSelectedDocId}>
                  <Select.Trigger className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-sm text-text-primary">
                    <Select.Value placeholder="Döküman seçiniz" />
                    <Select.Icon><CaretDown size={14} className="text-text-muted" /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-bg-card border border-border-custom rounded-xl shadow-xl z-50">
                      <Select.Viewport className="p-1">
                        {documents.map((doc) => (
                          <Select.Item key={doc.id} value={doc.id} className="px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-bg-hover outline-none data-[highlighted]:bg-bg-hover text-text-primary">
                            <Select.ItemText>{doc.fileName}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <Button onClick={handleDocumentAnalysis} loading={streaming} icon={<Sparkle size={16} />}>
                Analiz Et
              </Button>
            </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {/* Analysis Result */}
      {(streamText || currentAnalysis) && (
        <Card padding="lg">
          <h3 className="font-display font-semibold text-lg mb-4">Analiz Sonucu</h3>

          {/* Stream text with typewriter */}
          {streamText && (
            <div className={`text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-6 ${streaming ? 'typewriter-cursor' : ''}`}>
              {streamText}
            </div>
          )}

          {/* Parsed results */}
          {currentAnalysis?.unnecessaryExpenses && currentAnalysis.unnecessaryExpenses.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-text-primary mb-2">Gereksiz Harcamalar</h4>
              <div className="space-y-2">
                {(currentAnalysis.unnecessaryExpenses as UnnecessaryExpense[]).map((exp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-accent-red/5 rounded-xl border border-accent-red/10">
                    <div>
                      <Badge variant="danger" size="sm">{exp.name}</Badge>
                      <p className="text-xs text-text-muted mt-1">{exp.reason}</p>
                    </div>
                    <span className="text-sm font-medium text-accent-red">₺{exp.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentAnalysis?.savingsSuggestions && currentAnalysis.savingsSuggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-text-primary mb-2">Tasarruf Önerileri</h4>
              <div className="space-y-2">
                {(currentAnalysis.savingsSuggestions as SavingsSuggestion[]).map((sug, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-accent-green/5 rounded-xl border border-accent-green/10">
                    <div>
                      <Badge variant="success" size="sm">{sug.title}</Badge>
                      <p className="text-xs text-text-muted mt-1">{sug.description}</p>
                    </div>
                    <span className="text-sm font-medium text-accent-green">₺{sug.potentialSaving}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!streaming && currentAnalysis && (
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border-custom">
              <Button variant="secondary" size="sm" onClick={handleGeneratePdf} icon={<DownloadSimple size={16} />}>
                PDF İndir
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="E-posta adresi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="!py-1.5 text-sm"
                />
                <Button variant="secondary" size="sm" onClick={handleSendEmail} icon={<EnvelopeSimple size={16} />}>
                  Gönder
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Analysis History */}
      {history.length > 0 && (
        <Card padding="lg">
          <h3 className="font-display font-semibold text-lg mb-4">Geçmiş Analizler</h3>
          <div className="space-y-2">
            {history.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 border-b border-border-custom last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={item.type === 'DAILY' ? 'info' : item.type === 'MONTHLY' ? 'success' : 'warning'} size="sm">
                    {item.type === 'DAILY' ? 'Günlük' : item.type === 'MONTHLY' ? 'Aylık' : 'Döküman'}
                  </Badge>
                  <span className="text-sm text-text-secondary">
                    {item.analysisDate || (item.year && item.month ? `${monthNames[(item.month || 1) - 1]} ${item.year}` : '')}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
