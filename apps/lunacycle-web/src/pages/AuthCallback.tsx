import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AuthCallback() {
  const { handleCallback } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      navigate('/login?error=' + encodeURIComponent(errorDescription || error));
      return;
    }

    // Handle successful callback
    if (code && state) {
      handleCallback(code, state)
        .then(() => {
          // Redirect to home page after successful login
          navigate('/');
        })
        .catch((err) => {
          console.error('Callback handling failed:', err);
          navigate('/login?error=callback_failed');
        });
    } else {
      // Missing required parameters
      console.error('Missing code or state parameter');
      navigate('/login?error=invalid_callback');
    }
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingScreen />
        <p className="mt-4 text-sm text-muted-foreground">
          Completing login...
        </p>
      </div>
    </div>
  );
}
