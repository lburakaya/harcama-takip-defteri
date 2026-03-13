import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, CurrencyDollar, EnvelopeSimple, Trash, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { deleteMe } from '../api/auth.api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  email: z.string().email('Geçerli e-posta giriniz'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
  newPassword: z.string().min(8, 'En az 8 karakter'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currency, setCurrency] = useState(user?.currency || 'TRY');
  const [reportEmail, setReportEmail] = useState(user?.reportEmail || '');
  const [autoCarry, setAutoCarry] = useState(false);

  // Profile form
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  // Password form
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      await updateProfile(data);
      toast.success('Profil güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const handlePasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await updateProfile({ password: data.newPassword } as any);
      toast.success('Şifre güncellendi');
      passwordForm.reset();
    } catch {
      toast.error('Şifre değiştirme başarısız');
    }
  };

  const handleCurrencyChange = async (val: string) => {
    setCurrency(val);
    try {
      await updateProfile({ currency: val } as any);
      updateUser({ currency: val });
      toast.success('Para birimi güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const handleReportEmail = async () => {
    try {
      await updateProfile({ reportEmail } as any);
      toast.success('Rapor e-postası güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteMe();
      toast.success('Hesap silindi');
      logout();
    } catch {
      toast.error('Hesap silinemedi');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card padding="lg">
        <h3 className="font-display font-semibold text-lg mb-4">Profil Bilgileri</h3>
        <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad"
              icon={<User size={18} />}
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName')}
            />
            <Input
              label="Soyad"
              icon={<User size={18} />}
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName')}
            />
          </div>
          <Input
            label="E-posta"
            type="email"
            icon={<EnvelopeSimple size={18} />}
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register('email')}
          />
          <Button type="submit" size="sm">Kaydet</Button>
        </form>
      </Card>

      {/* Password */}
      <Card padding="lg">
        <h3 className="font-display font-semibold text-lg mb-4">Şifre Değiştir</h3>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
          <Input
            label="Mevcut Şifre"
            type="password"
            icon={<Lock size={18} />}
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Yeni Şifre"
              type="password"
              icon={<Lock size={18} />}
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Yeni Şifre Tekrar"
              type="password"
              icon={<Lock size={18} />}
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
          </div>
          <Button type="submit" size="sm">Şifreyi Güncelle</Button>
        </form>
      </Card>

      {/* Financial Profile */}
      <Card padding="lg">
        <h3 className="font-display font-semibold text-lg mb-4">Finansal Profil</h3>
        <div className="space-y-4">
          {/* Currency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Para Birimi</label>
            <Select.Root value={currency} onValueChange={handleCurrencyChange}>
              <Select.Trigger className="flex items-center justify-between px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-sm text-text-primary w-48">
                <div className="flex items-center gap-2">
                  <CurrencyDollar size={18} className="text-text-muted" />
                  <Select.Value />
                </div>
                <Select.Icon><CaretDown size={14} className="text-text-muted" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-bg-card border border-border-custom rounded-xl shadow-xl z-50">
                  <Select.Viewport className="p-1">
                    {[
                      { value: 'TRY', label: '₺ Türk Lirası' },
                      { value: 'USD', label: '$ Amerikan Doları' },
                      { value: 'EUR', label: '€ Euro' },
                    ].map((c) => (
                      <Select.Item key={c.value} value={c.value} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-bg-hover outline-none data-[highlighted]:bg-bg-hover text-text-primary">
                        <Select.ItemText>{c.label}</Select.ItemText>
                        <Select.ItemIndicator><Check size={14} className="text-accent-green" /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Auto carry toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">Otomatik Kopyalama</span>
              <p className="text-xs text-text-muted">Her ay başında önceki ayın gelir ve hedef değerlerini kopyala</p>
            </div>
            <Switch.Root
              checked={autoCarry}
              onCheckedChange={setAutoCarry}
              className="w-9 h-5 bg-bg-hover rounded-full relative data-[state=checked]:bg-accent-green transition-colors"
            >
              <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
          </div>

          {/* Report Email */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Varsayılan Rapor E-postası"
                type="email"
                placeholder="rapor@email.com"
                icon={<EnvelopeSimple size={18} />}
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleReportEmail}>Kaydet</Button>
          </div>
        </div>
      </Card>

      {/* Delete Account */}
      <Card padding="lg" className="border-accent-red/20">
        <h3 className="font-display font-semibold text-lg text-accent-red mb-2">Tehlikeli Bölge</h3>
        <p className="text-sm text-text-secondary mb-4">
          Hesabınızı silmek tüm verilerinizi kalıcı olarak kaldıracaktır. Bu işlem geri alınamaz.
        </p>
        <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)} icon={<Trash size={16} />}>
          Hesabımı Sil
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hesabı Sil"
        size="sm"
      >
        <div className="flex items-start gap-3 p-3 bg-accent-red/5 rounded-xl mb-4">
          <Warning size={20} className="text-accent-red shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            Bu işlem geri alınamaz. Tüm harcamalarınız, analizleriniz, raporlarınız ve yüklediğiniz dökümanlar kalıcı olarak silinecektir.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={handleDeleteAccount}>Evet, Hesabımı Sil</Button>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>İptal</Button>
        </div>
      </Modal>
    </div>
  );
}
