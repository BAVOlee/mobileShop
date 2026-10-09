import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiRequest, newId } from "../lib/api";
import type { CartLine } from "../lib/types";
import { useAuth } from "./auth";

const CART_KEY = "morrow-goods.cart.v1";
const MAX_QUANTITY = 20;
const MAX_STORED_QUANTITY = 99;
const POLL_INTERVAL_MS = 3000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Action = "increment" | "set" | "remove";
type Operation = { operationId: string; productId: string; action: Action; quantity?: number };
type StoredCart = { sessionId: string | null; ownerId: string | null; items: CartLine[] };
type CartPayload = { items?: unknown; persisted?: boolean; shared?: boolean; canMergeLocal?: boolean; ownerMismatch?: boolean };
type CartContextValue = {
  items: CartLine[];
  count: number;
  sessionId: string | null;
  loading: boolean;
  syncing: boolean;
  addItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalize(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const line = raw as { productId?: unknown; quantity?: unknown };
    const productId = typeof line.productId === "string" ? line.productId.trim() : "";
    const quantity = Number(line.quantity);
    if (!productId || productId.length > 100 || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_STORED_QUANTITY || seen.has(productId)) return [];
    seen.add(productId);
    return [{ productId, quantity }];
  });
}

async function readStored(): Promise<StoredCart> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return { sessionId: null, ownerId: null, items: [] };
    const parsed = JSON.parse(raw) as { sessionId?: unknown; ownerId?: unknown; items?: unknown };
    return {
      sessionId: typeof parsed.sessionId === "string" && UUID_PATTERN.test(parsed.sessionId) ? parsed.sessionId : null,
      ownerId: typeof parsed.ownerId === "string" ? parsed.ownerId : null,
      items: normalize(parsed.items),
    };
  } catch {
    return { sessionId: null, ownerId: null, items: [] };
  }
}

function apply(items: CartLine[], operations: Operation[]): CartLine[] {
  const next = new Map(items.map((line) => [line.productId, line.quantity]));
  for (const operation of operations) {
    if (operation.action === "increment") {
      const current = next.get(operation.productId) || 0;
      if (current < MAX_QUANTITY) next.set(operation.productId, current + 1);
    } else if (operation.action === "set") {
      if (operation.quantity && operation.quantity > 0) next.set(operation.productId, operation.quantity);
    } else {
      next.delete(operation.productId);
    }
  }
  return Array.from(next, ([productId, quantity]) => ({ productId, quantity }));
}

function same(left: CartLine[], right: CartLine[]) {
  if (left.length !== right.length) return false;
  const a = [...left].sort((x, y) => x.productId.localeCompare(y.productId));
  const b = [...right].sort((x, y) => x.productId.localeCompare(y.productId));
  return a.every((line, index) => line.productId === b[index]?.productId && line.quantity === b[index]?.quantity);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token, loading: authLoading } = useAuth();
  const userId = user?.id || null;
  const identity = userId ? `user:${userId}` : "guest";
  const [items, setItems] = useState<CartLine[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const itemsRef = useRef<CartLine[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const identityRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const cloudReadyRef = useRef(false);
  const sendingRef = useRef(false);
  const generationRef = useRef(0);
  const pendingRef = useRef<Operation[]>([]);
  const bootstrapOperationsRef = useRef<Operation[]>([]);
  const persistedRef = useRef<CartLine[]>([]);
  const fallbackRef = useRef<CartLine[]>([]);
  const fallbackOwnerRef = useRef<string | null>(null);
  const guestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const assignItems = useCallback((next: CartLine[]) => {
    const normalized = normalize(next);
    itemsRef.current = normalized;
    setItems(normalized);
  }, []);

  const refresh = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || !readyRef.current) return;
    const response = await apiRequest<CartPayload>(`/api/cart?sessionId=${encodeURIComponent(currentSessionId)}`, { method: "GET" }, token);
    if (response.persisted !== true) return;
    const remote = normalize(response.items);
    if (userId && response.shared && !cloudReadyRef.current) {
      const fallback = fallbackRef.current;
      const ownerId = fallbackOwnerRef.current;
      let canonical = remote;
      if (fallback.length > 0 && response.canMergeLocal && (ownerId === null || ownerId === userId)) {
        const merged = await apiRequest<CartPayload>("/api/cart", {
          method: "POST",
          body: JSON.stringify({ mode: "merge", sessionId: currentSessionId, items: fallback }),
        }, token);
        canonical = normalize(merged.items);
      }
      persistedRef.current = canonical;
      cloudReadyRef.current = true;
      setCloudReady(true);
      fallbackRef.current = [];
      assignItems(apply(canonical, pendingRef.current));
      return;
    }
    if (!userId && !response.shared) {
      persistedRef.current = remote;
      if (!response.ownerMismatch && remote.length === 0) return;
    } else {
      persistedRef.current = remote;
    }
    if (pendingRef.current.length === 0 && !sendingRef.current && !same(itemsRef.current, remote)) assignItems(remote);
  }, [assignItems, token, userId]);

  useEffect(() => {
    if (authLoading) return;
    const currentIdentity = identity;
    if (identityRef.current === currentIdentity && readyRef.current) return;
    let active = true;
    const generation = ++generationRef.current;

    void (async () => {
      const saved = await readStored();
      if (!active || generation !== generationRef.current) return;
      const previousIdentity = identityRef.current;
      const currentSessionId = sessionIdRef.current || saved.sessionId || newId();
      sessionIdRef.current = currentSessionId;
      setSessionId(currentSessionId);

      const localItems = previousIdentity === "guest" && userId ? itemsRef.current : saved.items;
      const localOwner = previousIdentity === "guest" && userId ? null : saved.ownerId;
      const fallback = userId
        ? (localOwner === null || localOwner === userId ? localItems : [])
        : (localOwner === null ? localItems : []);

      identityRef.current = currentIdentity;
      readyRef.current = false;
      cloudReadyRef.current = false;
      if (previousIdentity !== null && previousIdentity !== currentIdentity) bootstrapOperationsRef.current = [];
      pendingRef.current = [];
      persistedRef.current = [];
      fallbackRef.current = fallback;
      fallbackOwnerRef.current = localOwner;
      setLoading(true);
      setCloudReady(false);
      assignItems(fallback);
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

      let payload: CartPayload | null = null;
      try {
        payload = await apiRequest<CartPayload>(`/api/cart?sessionId=${encodeURIComponent(currentSessionId)}`, { method: "GET" }, token);
      } catch {
        // Keep the local cache usable; signed-in clients retry through the refresh poll.
      }
      if (!active || generation !== generationRef.current) return;

      const persisted = payload?.persisted === true;
      let remote = normalize(payload?.items);
      const bootstrapOperations = [...bootstrapOperationsRef.current];
      bootstrapOperationsRef.current = [];
      if (userId && persisted && payload?.shared) {
        if (localItems.length > 0 && localOwner === null && payload.canMergeLocal) {
          try {
            const merged = await apiRequest<CartPayload>("/api/cart", {
              method: "POST",
              body: JSON.stringify({ mode: "merge", sessionId: currentSessionId, items: localItems }),
            }, token);
            remote = normalize(merged.items);
          } catch {
            // The account copy remains the source of truth if guest merging fails.
          }
        }
        if (!active || generation !== generationRef.current) return;
        persistedRef.current = remote;
        pendingRef.current = bootstrapOperations;
        cloudReadyRef.current = true;
        setCloudReady(true);
        assignItems(apply(remote, bootstrapOperations));
      } else if (!userId && persisted) {
        const guestItems = payload?.ownerMismatch ? [] : remote.length > 0 ? remote : localItems;
        persistedRef.current = remote;
        cloudReadyRef.current = true;
        setCloudReady(true);
        assignItems(apply(guestItems, bootstrapOperations));
      } else {
        persistedRef.current = [];
        if (userId) pendingRef.current = bootstrapOperations;
        cloudReadyRef.current = false;
        setCloudReady(false);
        assignItems(apply(fallback, bootstrapOperations));
      }

      if (!active || generation !== generationRef.current) return;
      readyRef.current = true;
      setLoading(false);
    })();

    return () => { active = false; };
  }, [authLoading, identity, token, userId, assignItems]);

  useEffect(() => {
    if (!sessionId || !readyRef.current || identityRef.current !== identity) return;
    void AsyncStorage.setItem(CART_KEY, JSON.stringify({
      sessionId,
      ownerId: userId && cloudReady ? userId : null,
      items,
    })).catch(() => undefined);
  }, [items, sessionId, identity, userId, cloudReady]);

  const flushOperations = useCallback(async () => {
    if (!userId || !token || !sessionIdRef.current || !readyRef.current || !cloudReadyRef.current || sendingRef.current || pendingRef.current.length === 0) return;
    const currentSessionId = sessionIdRef.current;
    const batch = pendingRef.current.slice(0, 100);
    const ids = new Set(batch.map((operation) => operation.operationId));
    sendingRef.current = true;
    setSyncing(true);
    let failed = false;
    try {
      const response = await apiRequest<CartPayload>("/api/cart", {
        method: "POST",
        body: JSON.stringify({ sessionId: currentSessionId, operations: batch }),
      }, token);
      if (identityRef.current !== `user:${userId}`) return;
      pendingRef.current = pendingRef.current.filter((operation) => !ids.has(operation.operationId));
      const canonical = normalize(response.items);
      persistedRef.current = canonical;
      assignItems(apply(canonical, pendingRef.current));
    } catch {
      failed = true;
    } finally {
      sendingRef.current = false;
      setSyncing(false);
      if (failed) {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => setTrigger((value) => value + 1), 1800);
      } else if (pendingRef.current.length > 0) {
        setTrigger((value) => value + 1);
      }
    }
  }, [assignItems, token, userId]);

  useEffect(() => {
    if (!readyRef.current || !sessionId) return;
    if (userId && token) {
      if (!cloudReady || pendingRef.current.length === 0 || sendingRef.current) return;
      const timer = setTimeout(() => { void flushOperations(); }, 120);
      return () => clearTimeout(timer);
    }
    if (!cloudReady) return;
    if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    const itemsToSave = normalize(items);
    const saveSessionId = sessionId;
    guestTimerRef.current = setTimeout(() => {
      void apiRequest<CartPayload>("/api/cart", {
        method: "POST",
        body: JSON.stringify({ mode: "guest", sessionId: saveSessionId, items: itemsToSave }),
      })
        .then(() => { persistedRef.current = itemsToSave; })
        .catch(() => undefined);
    }, 450);
    return () => {
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
      guestTimerRef.current = null;
    };
  }, [items, sessionId, userId, token, cloudReady, flushOperations, trigger]);

  useEffect(() => {
    if (!userId || !token || !sessionId || loading) return;
    let active = true;
    const poll = async () => {
      if (!active || sendingRef.current || (cloudReadyRef.current && pendingRef.current.length > 0)) return;
      try {
        await refresh();
      } catch {
        // The next poll or foreground event will try again.
      }
    };
    const interval = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
    const appStateListener = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") void poll();
    });
    return () => {
      active = false;
      clearInterval(interval);
      appStateListener.remove();
    };
  }, [userId, token, sessionId, loading, refresh]);

  const recordOperations = useCallback((operations: Operation[]) => {
    if (operations.length === 0) return;
    const next = apply(itemsRef.current, operations);
    if (same(itemsRef.current, next)) return;
    if (userId && token && readyRef.current) pendingRef.current.push(...operations);
    else if (!readyRef.current) bootstrapOperationsRef.current.push(...operations);
    itemsRef.current = next;
    setItems(next);
  }, [token, userId]);

  const addItem = useCallback((productId: string) => {
    const current = itemsRef.current.find((line) => line.productId === productId)?.quantity || 0;
    if (current >= MAX_QUANTITY) return;
    recordOperations([{ operationId: newId(), productId, action: "increment" }]);
  }, [recordOperations]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const safe = Math.min(MAX_QUANTITY, Math.floor(quantity));
    const current = itemsRef.current.find((line) => line.productId === productId)?.quantity;
    if (safe <= 0) {
      if (current !== undefined) recordOperations([{ operationId: newId(), productId, action: "remove" }]);
    } else if (current !== safe) {
      recordOperations([{ operationId: newId(), productId, action: "set", quantity: safe }]);
    }
  }, [recordOperations]);

  const removeItem = useCallback((productId: string) => {
    if (itemsRef.current.some((line) => line.productId === productId)) recordOperations([{ operationId: newId(), productId, action: "remove" }]);
  }, [recordOperations]);

  const clearCart = useCallback(() => {
    recordOperations(itemsRef.current.map((line) => ({ operationId: newId(), productId: line.productId, action: "remove" as const })));
  }, [recordOperations]);

  const count = useMemo(() => items.reduce((total, line) => total + line.quantity, 0), [items]);
  const value = useMemo(() => ({ items, count, sessionId, loading, syncing, addItem, setQuantity, removeItem, clearCart, refresh }), [items, count, sessionId, loading, syncing, addItem, setQuantity, removeItem, clearCart, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
