import { useState, type FormEvent } from "react";
import { supabase } from "../shared/supabaseClient";
import { COUNTRIES } from "../shared/countries";
import PrivacyPolicyContent from "../legal/PrivacyPolicyContent";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (mode === "signup") {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        setError("Username is required.");
        setBusy(false);
        return;
      }
      if (!country) {
        setError("Please select your country.");
        setBusy(false);
        return;
      }
      if (!agreedToPrivacy) {
        setError("You must agree to the Privacy Policy to create an account.");
        setBusy(false);
        return;
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmedUsername)
        .maybeSingle();

      if (existing) {
        setError("That username is already taken — try another.");
        setBusy(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: trimmedUsername, country } },
      });

      if (error) {
        setError(
          error.message.toLowerCase().includes("username")
            ? "That username was just taken — try another."
            : error.message
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setBusy(false);
  }

  return (
    <div>
      <h2>{mode === "signup" ? "Create account" : "Sign in"}</h2>
      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}
        {mode === "signup" && (
          <div>
            <label htmlFor="country">Country</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            >
              <option value="" disabled>
                Select your country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {mode === "signup" && (
          <div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                I have read and agree to the{" "}
                <span
                  style={{ color: "var(--accent)", textDecoration: "underline" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyPolicy((s) => !s);
                  }}
                >
                  Privacy Policy
                </span>
              </span>
            </label>
            {showPrivacyPolicy && (
              <div
                style={{
                  maxHeight: 240,
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                }}
              >
                <PrivacyPolicyContent />
              </div>
            )}
          </div>
        )}

        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy || (mode === "signup" && !agreedToPrivacy)}>
          {busy ? "Please wait..." : mode === "signup" ? "Sign up" : "Sign in"}
        </button>
      </form>
      <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </div>
  );
}
