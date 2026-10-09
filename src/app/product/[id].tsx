import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { COLORS } from "../../lib/config";
import { formatNaira } from "../../lib/api";
import { useCatalog } from "../../state/catalog";
import { useCart } from "../../state/cart";
import { Button, ProductPhoto, SectionEyebrow, Wordmark } from "../../components/ui";
import { Icon } from "../../components/icon";

export default function ProductScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { products, loading, error, refresh } = useCatalog();
  const { addItem, count } = useCart();
  const product = useMemo(() => products.find((item) => item.id === params.id), [products, params.id]);

  if (!product && loading) return <SafeAreaView style={styles.loadingSafe}><Text style={styles.loadingMark}>m.</Text><Text style={styles.loadingText}>Finding the good things…</Text></SafeAreaView>;
  if (!product) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.notFoundTop}><Pressable onPress={() => router.back()} style={styles.roundButton}><Icon name="back" /></Pressable><Wordmark small /></View>
      <View style={styles.notFound}><Icon name="sparkle" size={27} color={COLORS.clay} /><Text style={styles.notFoundTitle}>We couldn’t find that one.</Text><Text style={styles.notFoundText}>{error || "It may have found another home."}</Text><Button title="Try the shop again" variant="outline" onPress={() => { void refresh(); router.replace("/(tabs)"); }} style={styles.tryShop} /></View>
    </SafeAreaView>
  );

  const remaining = typeof product.stock === "number" ? product.stock : null;
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.roundButton} accessibilityLabel="Go back"><Icon name="back" /></Pressable>
        <Wordmark small />
        <Pressable onPress={() => router.push("/(tabs)/cart")} style={styles.roundButton} accessibilityLabel={`Open bag with ${count} items`}><Icon name="bag" size={20} /></Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroPhoto}><ProductPhoto product={product} style={StyleSheet.absoluteFill} /><View style={styles.photoTag}><Text style={styles.photoTagText}>{product.category}</Text></View></View>
        <View style={styles.productContent}>
          <View style={styles.productEyebrow}><SectionEyebrow>{product.badge ? product.badge.toUpperCase() : "MADE TO BE KEPT"}</SectionEyebrow><View style={styles.productSpark}><Icon name="sparkle" size={18} color={COLORS.clay} /></View></View>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.subtitle}>{product.subtitle}</Text>
          <View style={styles.priceRow}><Text style={styles.price}>{formatNaira(product.price_kobo)}</Text>{product.compare_at_kobo && product.compare_at_kobo > product.price_kobo ? <Text style={styles.comparePrice}>{formatNaira(product.compare_at_kobo)}</Text> : null}</View>
          <View style={styles.line} />
          <Text style={styles.description}>{product.description}</Text>
          <View style={styles.detailsBlock}>
            <View style={styles.detailRow}><View style={styles.detailIcon}><Icon name="heart" size={17} color={COLORS.clay} /></View><View style={styles.detailCopy}><Text style={styles.detailTitle}>A thoughtful little find</Text><Text style={styles.detailText}>Selected for the everyday moments that deserve a little more.</Text></View></View>
            <View style={styles.detailRow}><View style={styles.detailIcon}><Icon name="truck" size={17} color={COLORS.clay} /></View><View style={styles.detailCopy}><Text style={styles.detailTitle}>Delivered with care</Text><Text style={styles.detailText}>{remaining !== null && remaining <= 5 ? `${remaining} left in this small batch.` : "Lagos delivery, with complimentary shipping over ₦50,000."}</Text></View></View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}><View style={styles.bottomPrice}><Text style={styles.bottomPriceLabel}>YOUR LITTLE JOY</Text><Text style={styles.bottomPriceValue}>{formatNaira(product.price_kobo)}</Text></View><Button title="Add to your bag" onPress={() => addItem(product.id)} disabled={remaining === 0} icon={<Icon name="arrow" size={17} color={COLORS.paper} />} style={styles.addButton} /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  loadingSafe: { flex: 1, backgroundColor: COLORS.canvas, alignItems: "center", justifyContent: "center", gap: 9 },
  loadingMark: { color: COLORS.clay, fontFamily: "serif", fontSize: 38 },
  loadingText: { color: COLORS.muted, fontSize: 12 },
  notFoundTop: { paddingHorizontal: 20, paddingTop: 7, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 25, gap: 10 },
  notFoundTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 23, marginTop: 4 },
  notFoundText: { color: COLORS.muted, fontSize: 12, textAlign: "center" },
  tryShop: { marginTop: 10 },
  topBar: { height: 58, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roundButton: { width: 39, height: 39, borderRadius: 20, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingBottom: 20 },
  heroPhoto: { height: 340, marginHorizontal: 15, borderRadius: 21, overflow: "hidden", backgroundColor: "#E9E4DA" },
  photoTag: { position: "absolute", left: 13, bottom: 13, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,253,250,.93)" },
  photoTagText: { color: COLORS.ink, fontSize: 10, fontWeight: "600" },
  productContent: { paddingHorizontal: 22, paddingTop: 23 },
  productEyebrow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productSpark: { marginRight: 3 },
  title: { color: COLORS.ink, fontFamily: "serif", fontSize: 31, lineHeight: 37, letterSpacing: -1.1, marginTop: 8 },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 15 },
  price: { color: COLORS.ink, fontSize: 18, fontWeight: "700" },
  comparePrice: { color: COLORS.faint, fontSize: 13, textDecorationLine: "line-through" },
  line: { height: 1, backgroundColor: COLORS.line, marginVertical: 19 },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 22 },
  detailsBlock: { backgroundColor: COLORS.paper, borderRadius: 17, padding: 15, gap: 15, marginTop: 24, borderWidth: 1, borderColor: COLORS.line },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  detailIcon: { width: 31, height: 31, borderRadius: 16, backgroundColor: COLORS.paleClay, alignItems: "center", justifyContent: "center" },
  detailCopy: { flex: 1, paddingTop: 1 },
  detailTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "600" },
  detailText: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  bottomBar: { borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: COLORS.paper, paddingHorizontal: 19, paddingTop: 11, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  bottomPrice: { minWidth: 104, gap: 5 },
  bottomPriceLabel: { color: COLORS.faint, fontSize: 8, fontWeight: "700", letterSpacing: 1.3 },
  bottomPriceValue: { color: COLORS.ink, fontSize: 15, fontWeight: "700" },
  addButton: { flex: 1, minHeight: 50 },
});
