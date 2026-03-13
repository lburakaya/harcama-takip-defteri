import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { EnvelopeSimple, Lock, Eye, EyeSlash, ChartLineUp, Shield, Lightning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import * as Switch from '@radix-ui/react-switch';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login({ ...data, rememberMe });
      toast.success('Giriş başarılı!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: ChartLineUp, title: 'Akıllı Analiz', desc: 'AI destekli harcama optimizasyonu' },
    { icon: Shield, title: 'Güvenli', desc: 'Verileriniz şifreli ve güvende' },
    { icon: Lightning, title: 'Anlık Takip', desc: 'Gerçek zamanlı bütçe kontrolü' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent-green rounded-xl flex items-center justify-center">
              <span className="text-bg-primary font-display font-bold">HT</span>
            </div>
            <span className="font-display font-bold text-2xl gradient-text">Harcama Takip</span>
          </div>

          <h2 className="text-2xl font-display font-semibold mb-2">Giriş Yap</h2>
          <p className="text-text-secondary text-sm mb-8">Hesabınıza giriş yaparak devam edin</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              icon={<EnvelopeSimple size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch.Root
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="w-9 h-5 bg-bg-hover rounded-full relative data-[state=checked]:bg-accent-green transition-colors"
                >
                  <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                </Switch.Root>
                <span className="text-sm text-text-secondary">Beni Hatırla</span>
              </div>
              <Link to="/forgot-password" className="text-sm text-accent-green hover:underline">
                Şifremi Unuttum
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Giriş Yap
            </Button>
          </form>

          <p className="text-sm text-text-secondary text-center mt-6">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-accent-green hover:underline font-medium">
              Kayıt Ol
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Feature Showcase */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-bg-secondary p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-64 h-64 bg-accent-green rounded-full blur-[120px]" />
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-accent-amber rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 max-w-lg"
        >
          <h2 className="text-4xl font-display font-bold mb-4">
            Finanslarınızı <br />
            <span className="gradient-text">Kontrol Altına Alın</span>
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            AI destekli analiz ile harcamalarınızı optimize edin, tasarruf hedeflerinize ulaşın.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-4 p-4 glass-card"
              >
                <div className="p-2.5 bg-accent-green/10 rounded-xl text-accent-green">
                  <f.icon size={24} weight="duotone" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{f.title}</h4>
                  <p className="text-xs text-text-muted">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
