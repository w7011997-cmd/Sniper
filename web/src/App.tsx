import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AuthForm from "./auth/AuthForm";
import { supabase } from "./shared/supabaseClient";
import { usePushRegistration } from "./push/usePushRegistration";
import { useWallet } from "./wallet/useWallet";
import PlayerList from "./challenges/PlayerList";
import IncomingChallenges from "./challenges/IncomingChallenges";

function Home() {
  const { session } = useAuth();
  usePushRegistration();
  return (
    <div>
      <h1>Sniper</h1>
      <p>Signed in as: {session?.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </div>
  );
}

function Dashboard() {
  const { balanceCents } = useWallet();
  return (
    <div>
      <h2>Wallet</h2>
      <p>
        Balance: ₦{balanceCents !== null ? (balanceCents / 100).toFixed(2) : "..."}
      </p>
      <IncomingChallenges />
      <PlayerList />
    </div>
  );
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
