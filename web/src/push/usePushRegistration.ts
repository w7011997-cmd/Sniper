import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export function usePushRegistration() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;

    async function setup() {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return;

      await PushNotifications.register();
    }

    const onRegistration = PushNotifications.addListener("registration", async (token) => {
      await supabase
        .from("profiles")
        .update({ push_token: token.value })
        .eq("id", session.user.id);
    });

    const onError = PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

    setup();

    return () => {
      onRegistration.remove();
      onError.remove();
    };
  }, [session?.user.id]);
}
