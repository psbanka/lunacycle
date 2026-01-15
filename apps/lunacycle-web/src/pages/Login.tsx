import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LunarPhase from "@/components/Moon";
import { toast } from "sonner";

export default function Login() {
  const { initiateLogin, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        'callback_failed': 'Login failed. Please try again.',
        'invalid_callback': 'Invalid login callback.',
        'access_denied': 'Access was denied.',
      };
      toast.error(errorMessages[error] || error);
    }
  }, [searchParams]);

  const handleLogin = async () => {
    try {
      await initiateLogin();
    } catch (error) {
      toast.error('Failed to start login process');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center mb-8">
        <LunarPhase size="lg" className="mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Lunacycle</h1>
        <p className="text-muted-foreground mt-2">Complete your tasks with the rhythm of the moon</p>
      </div>

      <div className="w-full max-w-md space-y-6 glass-card p-8 rounded-lg">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold">Sign In</h2>
          <p className="text-sm text-muted-foreground">
            Sign in with your Authentik account
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? "Redirecting..." : "Sign in with Authentik"}
          </Button>
        </div>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            You'll be redirected to Authentik to sign in securely
          </p>
        </div>
      </div>
    </div>
  );
}
