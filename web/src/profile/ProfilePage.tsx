import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { usePushRegistration } from "../push/usePushRegistration";
import { useWallet } from "../wallet/useWallet";

export default function ProfilePage() {
  const { session } = useAuth();
  usePushRegistration();
  const { balanceCents } = useWallet();

  return (
    <div>
      <h1>Profile</h1>
      <p>Signed in as: {session?.user.email}</p>
      <p>Balance: ₦{balanceCents !== null ? (balanceCents / 100).toFixed(2) : "..."}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div>
  );
}
