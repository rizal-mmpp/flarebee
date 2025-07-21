
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth as useFirebaseAuth } from '@/lib/firebase/AuthContext'; // Keep for Google Sign-In

// Allow string for username or email, but enforce email format for firebase
const loginSchema = z.object({
  loginId: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, signIn, loading, authMethod, setAuthMethod } = useCombinedAuth();
  const { signInWithGoogle } = useFirebaseAuth();
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onEmailSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsSubmittingEmail(true);
    // Use loginId for both username and email
    await signIn(data.loginId, data.password);
    // Let the useEffect handle redirection
    setIsSubmittingEmail(false);
  };
  
  const handleGoogleSignIn = async () => {
    setIsSubmittingGoogle(true);
    await signInWithGoogle();
    setIsSubmittingGoogle(false);
  };
  
  if (loading && !isAuthenticated) {
    return (
        <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="auth-method">Authentication Method</Label>
        <Select value={authMethod} onValueChange={(value: 'firebase' | 'erpnext') => setAuthMethod(value)}>
          <SelectTrigger id="auth-method" className="bg-card/50 border-border text-card-foreground">
            <SelectValue placeholder="Select authentication method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="firebase">Firebase</SelectItem>
            <SelectItem value="erpnext">ERPNext</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {authMethod === 'firebase' && (
        <Button
          type="button"
          variant="outline"
          className="w-full bg-card/50 border-border text-card-foreground hover:bg-card/75"
          onClick={handleGoogleSignIn}
          disabled={isSubmittingEmail || isSubmittingGoogle || loading}
        >
          {isSubmittingGoogle ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <img src="/img/google.webp" alt="Google" className="mr-2 h-5 w-5" />
          )}
          Sign In with Google
        </Button>
      )}

      {authMethod === 'firebase' && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground bg-card/50">OR</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="loginId" className="text-sm font-medium text-card-foreground">
            {authMethod === 'erpnext' ? 'Username or Email' : 'Email'}
          </Label>
          <Input 
            id="loginId" 
            type={authMethod === 'firebase' ? 'email' : 'text'} 
            {...register('loginId')} 
            placeholder={authMethod === 'erpnext' ? "Your Username or Email" : "you@example.com"}
            className="mt-1 bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:bg-card/75 transition-colors duration-200" 
          />
          {errors.loginId && <p className="text-sm text-destructive mt-1">{errors.loginId.message}</p>}
        </div>
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-medium text-card-foreground">Password</Label>
            <Link 
              href="/auth/forgot-password" 
              className="text-sm font-medium text-primary hover:text-primary/90 transition-colors duration-200 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
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
          disabled={isSubmittingEmail || isSubmittingGoogle || loading}
        >
          {isSubmittingEmail ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
          Sign In
        </Button>
      </form>
    </div>
  );
}


export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Gradient Circles */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl animate-pulse" />
      <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-40 left-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[40%] xl:max-w-[30%] backdrop-blur-xl bg-card/50 shadow-2xl border-border">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-bold text-card-foreground">
              Welcome back!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your account and services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center text-base text-muted-foreground">
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
