import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

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
      alert(errorMessages[error] || error);
    }
  }, [searchParams]);

  const handleLogin = async () => {
    try {
      await initiateLogin();
    } catch (error) {
      alert('Failed to start login process');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌑 Nigredo</h1>
        <p style={{ color: '#999' }}>The blackening. The first stage.</p>
      </div>

      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '2rem',
        borderRadius: '8px',
        minWidth: '300px',
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Sign In</h2>
        <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Sign in with your Authentik account
        </p>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#4a4a4a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? "Redirecting..." : "Sign in with Authentik"}
        </button>
      </div>
    </div>
  );
}
