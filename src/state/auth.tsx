import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { API_BASE_URL, APP_REDIRECT_URI } from "../lib/config";
import { apiRequest } from "../lib/api";
import type { ShopUser } from "../lib/types";

if (Platform.OS === "web") WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "morrow-goods.mobile.access-token.v1";

type AuthContextValue = {
  user: ShopUser | null;
  token: string | null;
  loading: boolean;
  signingIn: boolean;
  error: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

type MobileAuthExchange = { accessToken: string; expiresAt: number; user: ShopUser };
const AuthContext = createContext<AuthContextValue | null>(null);

function randomHex(byteCount: number) {
  return Array.from(Crypto.getRandomBytes(byteCount), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function pkceChallenge(verifier: string) {
  const base64 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ShopUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!savedToken) return;
        const response = await apiRequest<{ user: ShopUser }>("/api/mobile/me", { method: "GET" }, savedToken);
        if (!active) return;
        setToken(savedToken);
        setUser(response.user);
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
      } finally {
        if (active) setLoading(false);
      }
    };
    void restore();
    return () => { active = false; };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    setError("");
    try {
      const state = randomHex(32);
      const verifier = randomHex(32);
      const challenge = await pkceChallenge(verifier);
      const startUrl = `${API_BASE_URL}/api/mobile/auth/start?state=${encodeURIComponent(state)}&challenge=${encodeURIComponent(challenge)}`;
      const result = await WebBrowser.openAuthSessionAsync(startUrl, APP_REDIRECT_URI);
      if (result.type !== "success") throw new Error("Google sign-in was cancelled.");

      const callback = new URL(result.url);
      const returnedState = callback.searchParams.get("state");
      const code = callback.searchParams.get("code");
      if (callback.protocol !== "morrowgoods:" || callback.hostname !== "auth" || returnedState !== state || !code) {
        throw new Error("The sign-in return could not be verified. Please try again.");
      }

      const session = await apiRequest<MobileAuthExchange>("/api/mobile/auth/exchange", {
        method: "POST",
        body: JSON.stringify({ code, verifier }),
      });
      await SecureStore.setItemAsync(TOKEN_KEY, session.accessToken);
      setToken(session.accessToken);
      setUser(session.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in did not finish. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    setToken(null);
    setUser(null);
    setError("");
  }, []);

  const clearError = useCallback(() => setError(""), []);
  const value = useMemo(() => ({ user, token, loading, signingIn, error, signInWithGoogle, signOut, clearError }), [user, token, loading, signingIn, error, signInWithGoogle, signOut, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
