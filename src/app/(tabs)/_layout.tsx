import { Tabs } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { useCart } from "../../state/cart";
import { COLORS } from "../../lib/config";

function TabIcon({ name, color, size }: { name: "home" | "bag" | "person"; color: string; size: number }) {
  const shared = { fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "home" ? <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" {...shared} /> : null}
      {name === "bag" ? <><Path d="M5 8h14l1 13H4L5 8Z" {...shared} /><Path d="M9 9V6a3 3 0 0 1 6 0v3" {...shared} /></> : null}
      {name === "person" ? <><Circle cx="12" cy="8" r="3.3" {...shared} /><Path d="M4.5 21c.6-4.2 3.2-6.5 7.5-6.5s6.9 2.3 7.5 6.5" {...shared} /></> : null}
    </Svg>
  );
}

export default function TabLayout() {
  const { count } = useCart();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.ink,
      tabBarInactiveTintColor: COLORS.faint,
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 1, marginBottom: 4 },
      tabBarStyle: { height: 68, paddingTop: 8, paddingBottom: 8, backgroundColor: COLORS.paper, borderTopColor: COLORS.line, elevation: 0 },
      tabBarItemStyle: { paddingVertical: 2 },
      tabBarBadgeStyle: { backgroundColor: COLORS.clay, color: "white", fontSize: 9, minWidth: 17, height: 17, lineHeight: 17, right: -7, top: -3 },
    }}>
      <Tabs.Screen name="index" options={{ title: "Shop", tabBarIcon: ({ color, size }) => <TabIcon name="home" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Your bag", tabBarBadge: count > 0 ? (count > 99 ? "99+" : count) : undefined, tabBarIcon: ({ color, size }) => <TabIcon name="bag" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color, size }) => <TabIcon name="person" color={String(color)} size={size} /> }} />
    </Tabs>
  );
}
