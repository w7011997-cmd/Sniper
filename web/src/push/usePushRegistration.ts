import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export function usePushRegistration() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;

    let registrationHandle: { remove: () => void } | null = null;
    let errorHandle: { remove: () => void } | null = null;
    let cancelled = false;

    async function setup() {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return;

      const regHandle = await PushNotifications.addListener("registration", async (token) => {
        await supabase
          .from("profiles")
          .update({ push_token: token.value })
          .eq("id", session!.user.id);
      });

      const errHandle = await PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error:", err);
      });

      if (cancelled) {
        regHandle.remove();
        errHandle.remove();
        return;
      }

      registrationHandle = regHandle;
      errorHandle = errHandle;

      await PushNotifications.register();
    }

    setup();

    return () => {
      cancelled = true;
      registrationHandle?.remove();
      errorHandle?.remove();
    };
  }, [session?.user.id]);
}
