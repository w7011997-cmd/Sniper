import { useState, type FormEvent } from "react";
import { supabase } from "../shared/supabaseClient";
import { COUNTRIES } from "../shared/countries";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
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
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "Please wait..." : mode === "signup" ? "Sign up" : "Sign in"}
        </button>
      </form>
      <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </div>
  );
}
