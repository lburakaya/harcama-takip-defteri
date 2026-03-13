import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, EnvelopeSimple, Lock, CurrencyDollar, Wallet, PiggyBank } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import * as Select from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  passwordConfirm: z.string(),
  currency: z.string().default('TRY'),
  monthlyIncome: z.number({ error: 'Geçerli bir tutar giriniz' }).positive('Gelir pozitif olmalıdır'),
  savingsGoal: z.number({ error: 'Geçerli bir tutar giriniz' }).min(0, 'Tasarruf hedefi 0 veya üzeri olmalıdır'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['passwordConfirm'],
}).refine((data) => data.savingsGoal < data.monthlyIncome, {
  message: 'Tasarruf hedefi gelirden düşük olmalıdır',
  path: ['savingsGoal'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('TRY');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { currency: 'TRY', firstName: '', lastName: '', email: '', password: '', passwordConfirm: '', monthlyIncome: 0, savingsGoal: 0 },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser({ ...data, currency });
      toast.success('Kayıt başarılı!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent-green rounded-xl flex items-center justify-center">
            <span className="text-bg-primary font-display font-bold">HT</span>
          </div>
          <span className="font-display font-bold text-2xl gradient-text">Harcama Takip</span>
        </div>

        <h2 className="text-2xl font-display font-semibold mb-1">Kayıt Ol</h2>
        <p className="text-text-secondary text-sm mb-6">Harcamalarınızı kontrol altına almaya başlayın</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ad"
              placeholder="Adınız"
              icon={<User size={18} />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Soyad"
              placeholder="Soyadınız"
              icon={<User size={18} />}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="E-posta"
            type="email"
            placeholder="ornek@email.com"
            icon={<EnvelopeSimple size={18} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Şifre"
              type="password"
              placeholder="En az 8 karakter"
              icon={<Lock size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Şifre Tekrar"
              type="password"
              placeholder="Şifrenizi tekrarlayın"
              icon={<Lock size={18} />}
              error={errors.passwordConfirm?.message}
              {...register('passwordConfirm')}
            />
          </div>

          {/* Currency Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Para Birimi</label>
            <Select.Root
              value={currency}
              onValueChange={(val) => {
                setCurrency(val);
                setValue('currency', val);
              }}
            >
              <Select.Trigger className="flex items-center justify-between px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-green/30">
                <div className="flex items-center gap-2">
                  <CurrencyDollar size={18} className="text-text-muted" />
                  <Select.Value />
                </div>
                <Select.Icon>
                  <CaretDown size={14} className="text-text-muted" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-bg-card border border-border-custom rounded-xl shadow-xl overflow-hidden z-50">
                  <Select.Viewport className="p-1">
                    {[
                      { value: 'TRY', label: '₺ Türk Lirası' },
                      { value: 'USD', label: '$ Amerikan Doları' },
                      { value: 'EUR', label: '€ Euro' },
                    ].map((item) => (
                      <Select.Item
                        key={item.value}
                        value={item.value}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary rounded-lg cursor-pointer hover:bg-bg-hover outline-none data-[highlighted]:bg-bg-hover"
                      >
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator>
                          <Check size={14} className="text-accent-green" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Aylık Net Gelir"
                type="number"
                placeholder="0.00"
                icon={<Wallet size={18} />}
                error={errors.monthlyIncome?.message}
                {...register('monthlyIncome', { valueAsNumber: true })}
              />
              <p className="text-[11px] text-text-muted mt-1">
                Bu bilgi size özel bütçe önerileri sunmamızı sağlar
              </p>
            </div>
            <div>
              <Input
                label="Aylık Tasarruf Hedefi"
                type="number"
                placeholder="0.00"
                icon={<PiggyBank size={18} />}
                error={errors.savingsGoal?.message}
                {...register('savingsGoal', { valueAsNumber: true })}
              />
              <p className="text-[11px] text-text-muted mt-1">
                Bu ay kenara koymak istediğiniz tutar
              </p>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Kayıt Ol
          </Button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="text-accent-green hover:underline font-medium">
            Giriş Yap
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
