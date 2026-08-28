import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AuthForm from "./auth/AuthForm";
import { supabase } from "./shared/supabaseClient";
import { usePushRegistration } from "./push/usePushRegistration";

function Home() {
  const { session } = useAuth();
  return (
    <div>
      <h1>Sniper</h1>
      <p>Dashboard, challenges, betting, and match view will live here.</p>
      <p>Signed in as: {session?.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </div>
  );
}

function Dashboard() {
  return <h2>Live matches dashboard (placeholder)</h2>;
}

function Gate() {
  const { session, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!session) return <AuthForm />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
