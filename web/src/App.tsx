import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AuthForm from "./auth/AuthForm";
import BottomNav from "./nav/BottomNav";
import LiveMatches from "./dashboard/LiveMatches";
import IncomingChallenges from "./challenges/IncomingChallenges";
import FindOpponent from "./challenges/FindOpponent";
import MyMatches from "./matches/MyMatches";
import RankingsPage from "./rankings/RankingsPage";
import MessagesPage from "./messages/MessagesPage";
import ProfilePage from "./profile/ProfilePage";
import PlayerProfilePage from "./players/PlayerProfilePage";
import WalletPage from "./wallet/WalletPage";

function MatchesPage() {
  return (
    <div>
      <h1>Matches</h1>
      <IncomingChallenges />
      <MyMatches />
      <FindOpponent />
    </div>
  );
}

import { usePresenceHeartbeat } from "./shared/usePresenceHeartbeat";
function Gate() {
  const { session, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!session) return <AuthForm />;
  usePresenceHeartbeat();

  return (
    <div className="app-shell">
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LiveMatches />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/players/:id" element={<PlayerProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
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
