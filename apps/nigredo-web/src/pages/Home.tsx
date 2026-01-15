import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { trpc } from "../api";

export default function Home() {
  const { user, logout } = useAuth();
  const [helloMessage, setHelloMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHello() {
      try {
        const response = await trpc.hello.query();
        setHelloMessage(response.message);
      } catch (error) {
        console.error('Failed to fetch hello:', error);
        setHelloMessage('Failed to load message');
      } finally {
        setLoading(false);
      }
    }

    fetchHello();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      padding: '2rem',
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #333',
      }}>
        <h1 style={{ fontSize: '2rem' }}>🌑 Nigredo</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#999' }}>{user?.email}</span>
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4a4a4a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            {loading ? 'Loading...' : helloMessage}
          </h2>
          <p style={{ color: '#999', lineHeight: '1.6' }}>
            Welcome to Nigredo - the blackening stage of the alchemical process.
            This is a simple "hello world" application demonstrating OAuth2 authentication
            with Authentik and a Bun/TRPC backend.
          </p>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '2rem',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>User Info</h3>
          <ul style={{ listStyle: 'none', padding: 0, color: '#999' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#fff' }}>Email:</strong> {user?.email}
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#fff' }}>Name:</strong> {user?.name}
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#fff' }}>Role:</strong> {user?.role}
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#fff' }}>ID:</strong> {user?.id}
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
