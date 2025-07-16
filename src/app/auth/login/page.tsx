
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmailPassword, loading } = useAuth();
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const onEmailSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsSubmittingEmail(true);
    await signInWithEmailPassword(data.email, data.password);
    setIsSubmittingEmail(false);
  };
  
  if (loading && !user) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Gradient Circles */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl animate-pulse" />
      <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-40 left-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[40%] xl:max-w-[25%] backdrop-blur-xl bg-card/50 shadow-2xl border-border">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-bold text-card-foreground">
              Welcome back!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your account and services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-card-foreground">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  {...register('email')} 
                  placeholder="you@example.com" 
                  className="mt-1 bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:bg-card/75 transition-colors duration-200" 
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-card-foreground">Password</Label>
                <div className="relative mt-1">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    {...register('password')} 
                    placeholder="••••••••"
                    className="bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:bg-card/75 transition-colors duration-200"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200" 
                disabled={isSubmittingEmail || loading}
              >
                {isSubmittingEmail ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col items-center space-y-4 text-base text-muted-foreground">
          <Link 
            href="/auth/forgot-password" 
            className="font-medium hover:text-foreground transition-colors duration-200 hover:underline"
          >
            Forgot your password?
          </Link>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link 
              href="/auth/signup" 
              className="font-medium text-foreground hover:text-primary transition-colors duration-200 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
