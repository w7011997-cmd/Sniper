import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

interface Settings {
  blocks_all_messages: boolean;
  only_played_with_can_message: boolean;
  auto_clear_messages_24h: boolean;
}

export default function MessageSettingsPanel() {
  const { session } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("blocks_all_messages, only_played_with_can_message, auto_clear_messages_24h")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setSettings(data));
  }, [session]);

  async function toggle(key: keyof Settings) {
    if (!settings || !session) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(true);
    await supabase.from("profiles").update({ [key]: next[key] }).eq("id", session.user.id);
    setSaving(false);
  }

  if (!settings) return <p className="stat-secondary">Loading settings...</p>;

  return (
    <div className="message-settings-panel">
      <label className="message-settings-row">
        <span>I don't want to receive any messages from anyone</span>
        <input
          type="checkbox"
          checked={settings.blocks_all_messages}
          onChange={() => toggle("blocks_all_messages")}
        />
      </label>

      <label className="message-settings-row">
        <span>Only people I have played with should be able to message me</span>
        <input
          type="checkbox"
          checked={settings.only_played_with_can_message}
          onChange={() => toggle("only_played_with_can_message")}
        />
      </label>

      <label className="message-settings-row">
        <span>Automatically clear all messages after 24 hours</span>
        <input
          type="checkbox"
          checked={settings.auto_clear_messages_24h}
          onChange={() => toggle("auto_clear_messages_24h")}
        />
      </label>

      {saving && <p className="stat-secondary">Saving...</p>}
    </div>
  );
}
