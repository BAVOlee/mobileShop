import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { COLORS } from "../lib/config";
import { AuthProvider } from "../state/auth";
import { CartProvider } from "../state/cart";
import { CatalogProvider } from "../state/catalog";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.canvas }, animation: "slide_from_right" }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="order-success" />
            </Stack>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
