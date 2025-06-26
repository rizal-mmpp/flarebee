
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, KeyRound, AlertTriangle, ArrowLeft, Save, ShieldCheck, Settings } from 'lucide-react';
import { CustomDropzone } from '@/components/ui/custom-dropzone';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.').max(50, 'Display name is too long.'),
  photoFile: z.instanceof(File).optional().nullable(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, sendPasswordReset, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      photoFile: null,
    },
  });
  
  useEffect(() => {
    if (user) {
      reset({ displayName: user.displayName || '' });
      setImagePreview(user.photoURL || null);
    }
  }, [user, reset]);

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFile) {
      objectUrl = URL.createObjectURL(selectedFile);
      setImagePreview(objectUrl);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };
  
  const onProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    startUpdateTransition(async () => {
      const result = await updateUserProfile({
        displayName: data.displayName,
        photoFile: selectedFile,
      });

      if (result.success) {
        toast({ title: "Profile Updated", description: "Your profile information has been saved." });
        setSelectedFile(null); // Clear selected file after successful upload
        reset({ displayName: data.displayName, photoFile: null }); // Reset form to new state
      } else {
        toast({ title: "Update Failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    await sendPasswordReset(user.email);
    // Toast is handled within sendPasswordReset in AuthContext
    setIsSendingReset(false);
  };

  const handleDeleteAccount = () => {
    // In a real app, this would trigger a server action after confirmation
    toast({
      title: "Account Deletion (Not Implemented)",
      description: "This is a placeholder for the account deletion flow.",
      variant: "destructive",
    });
    setIsDeleteModalOpen(false);
  };

  const getAvatarFallback = (displayName: string | null | undefined) => {
    if (!displayName) return <User className="h-10 w-10" />;
    const initials = displayName.split(' ').map(name => name[0]).join('').toUpperCase();
    return initials || <User className="h-10 w-10" />;
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Settings className="mr-3 h-8 w-8 text-primary" />
          Account Settings
        </h1>
        <Button variant="outline" asChild className="group">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onProfileSubmit)}>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your display name and profile picture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imagePreview || undefined} alt={user?.displayName || 'User'} />
                <AvatarFallback className="text-2xl">{getAvatarFallback(user?.displayName)}</AvatarFallback>
              </Avatar>
              <CustomDropzone 
                onFileChange={handleFileChange}
                currentFileName={selectedFile?.name}
                maxSize={1 * 1024 * 1024}
                className="w-full"
              />
            </div>
             <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" {...register('displayName')} className="mt-1" />
              {errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isUpdating || authLoading || !isDirty}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Security</CardTitle>
          <CardDescription>Manage your account security settings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-t">
          <div>
            <h4 className="font-semibold text-foreground">Password</h4>
            <p className="text-sm text-muted-foreground">Change your password by requesting a secure reset link to your email.</p>
          </div>
          <Button variant="outline" onClick={handlePasswordReset} disabled={isSendingReset || authLoading}>
            {isSendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Send Password Reset Email
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/70">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center py-4 border-t border-destructive/20">
           <div>
            <h4 className="font-semibold text-foreground">Delete Account</h4>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
          </div>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Yes, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
