import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import {
  isEntitlementActive,
  type Entitlement,
} from "../lib/entitlements";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export function usePremiumEntitlement() {
  const { session } = useAuth();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshEntitlement = useCallback(async () => {
    if (!session?.user.id) {
      setEntitlement(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("user_entitlements")
      .select("entitlement_key, status, expires_at")
      .eq("user_id", session.user.id)
      .eq("entitlement_key", "ai_coach")
      .maybeSingle();

    if (error) {
      setEntitlement(null);
      setErrorMessage(error.message);
    } else {
      setEntitlement(data as Entitlement | null);
    }

    setIsLoading(false);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void refreshEntitlement();
    }, [refreshEntitlement]),
  );

  return {
    entitlement,
    errorMessage,
    hasAiCoachAccess: isEntitlementActive(entitlement),
    isLoading,
    refreshEntitlement,
  };
}
