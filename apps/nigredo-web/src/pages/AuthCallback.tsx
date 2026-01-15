import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      navigate(`/login?error=${error}`);
      return;
    }

    if (!code || !state) {
      console.error("Missing code or state");
      navigate("/login?error=invalid_callback");
      return;
    }

    handleCallback(code, state)
      .then(() => {
        navigate("/");
      })
      .catch((err) => {
        console.error("Callback failed:", err);
        navigate("/login?error=callback_failed");
      });
  }, [searchParams, navigate, handleCallback]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Authenticating...</h2>
        <p style={{ color: '#999' }}>Please wait while we complete your login.</p>
      </div>
    </div>
  );
}
