
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, Loader2, Hexagon } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogin: () => Promise<void>;
}

export function LoginModal({ isOpen, onOpenChange, onLogin }: LoginModalProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await onLogin();
      // AuthContext will handle user state update. Modal might close due to parent re-render or explicitly.
    } catch (error) {
      console.error("Login failed from modal:", error);
      // Optionally show an error message within the modal
    } finally {
      setIsLoggingIn(false);
      onOpenChange(false); // Ensure modal closes
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Hexagon className="h-6 w-6 text-primary mr-2" />
            Login Required
          </DialogTitle>
          <DialogDescription>
            Please log in to continue with your action. It's quick and easy with Google.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Access your cart, purchase history, and enjoy a seamless experience by logging into your RIO account.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoggingIn}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="bg-primary hover:bg-primary/90 text-primary-foreground group"
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            )}
            Login with Google
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
