import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, FREE_SHIPPING_THRESHOLD_KOBO, SHIPPING_FEE_KOBO } from "../../lib/config";
import { formatNaira } from "../../lib/api";
import { useCatalog } from "../../state/catalog";
import { useCart } from "../../state/cart";
import { useAuth } from "../../state/auth";
import { Button, Message, ProductPhoto, SectionEyebrow, Wordmark } from "../../components/ui";
import { Icon } from "../../components/icon";

export default function CartScreen() {
  const { products, refresh: refreshProducts } = useCatalog();
  const { items, count, loading, syncing, setQuantity, removeItem, clearCart, refresh } = useCart();
  const { user } = useAuth();
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const lines = useMemo(() => items.map((line) => ({ ...line, product: productMap.get(line.productId) })), [items, productMap]);
  const availableLines = lines.filter((line): line is typeof line & { product: NonNullable<typeof line.product> } => Boolean(line.product));
  const unavailableCount = lines.length - availableLines.length;
  const subtotal = availableLines.reduce((sum, line) => sum + line.product.price_kobo * line.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_KOBO ? 0 : SHIPPING_FEE_KOBO;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_KOBO - subtotal);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { void refresh().catch(() => undefined); void refreshProducts(); }} tintColor={COLORS.clay} />} contentContainerStyle={styles.content}>
        <View style={styles.topLine}><Wordmark /><Pressable onPress={() => router.push("/(tabs)")} style={styles.continueLink}><Text style={styles.continueText}>Keep browsing</Text><Icon name="arrow" size={15} color={COLORS.clay} /></Pressable></View>
        <View style={styles.headingRow}><View><SectionEyebrow>THE GOOD THINGS</SectionEyebrow><Text style={styles.title}>Your bag<Text style={styles.itemCount}>{count > 0 ? `  ·  ${count}` : ""}</Text></Text></View><View style={styles.syncPill}><View style={[styles.syncDot, syncing && styles.syncDotActive]} /><Text style={styles.syncLabel}>{syncing ? "Saving" : user ? "Shared bag" : "Your bag"}</Text></View></View>
        {user ? <Text style={styles.syncCaption}>This bag stays in sync with the Morrow Goods website.</Text> : <Text style={styles.syncCaption}>Your bag is saved on this device. Sign in to share it with the website.</Text>}

        {loading && items.length === 0 ? <View style={styles.loadingBox}><Text style={styles.loadingMark}>m.</Text><Text style={styles.bodyMuted}>Opening your bag…</Text></View> : null}
        {!loading && items.length === 0 ? (
          <View style={styles.emptyCard}><View style={styles.emptyIcon}><Icon name="bag" size={26} color={COLORS.clay} /></View><Text style={styles.emptyTitle}>A little room for something lovely.</Text><Text style={styles.emptyText}>Your bag is empty for now. Take a look around; you might find a new favourite.</Text><Button title="Browse the shop" onPress={() => router.push("/(tabs)")} icon={<Icon name="arrow" size={17} color={COLORS.paper} />} style={styles.emptyButton} /></View>
        ) : null}

        {items.length > 0 ? (
          <>
            <View style={styles.cartCard}>
              {availableLines.map(({ product, productId, quantity }, index) => (
                <View key={productId} style={[styles.cartLine, index > 0 && styles.cartLineBorder]}>
                  <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })} style={styles.photoWrap}><ProductPhoto product={product} style={StyleSheet.absoluteFill} /></Pressable>
                  <View style={styles.lineInfo}>
                    <View style={styles.lineTitleRow}><Text numberOfLines={2} style={styles.lineName}>{product.name}</Text><Pressable onPress={() => removeItem(productId)} hitSlop={8} style={styles.removeButton} accessibilityLabel={`Remove ${product.name}`}><Icon name="trash" size={16} color={COLORS.faint} /></Pressable></View>
                    <Text numberOfLines={1} style={styles.lineSubtitle}>{product.subtitle}</Text>
                    <Text style={styles.linePrice}>{formatNaira(product.price_kobo * quantity)}</Text>
                    <View style={styles.quantityRow}>
                      <View style={styles.quantityControl}>
                        <Pressable onPress={() => setQuantity(productId, quantity - 1)} style={styles.quantityButton} accessibilityLabel="Decrease quantity"><Icon name="minus" size={15} /></Pressable>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <Pressable onPress={() => setQuantity(productId, quantity + 1)} style={styles.quantityButton} accessibilityLabel="Increase quantity" disabled={quantity >= 20}><Icon name="plus" size={15} color={quantity >= 20 ? COLORS.faint : COLORS.ink} /></Pressable>
                      </View>
                      <Text style={styles.eachPrice}>{formatNaira(product.price_kobo)} each</Text>
                    </View>
                  </View>
                </View>
              ))}
              {lines.filter((line) => !line.product).map(({ productId }) => <View key={productId} style={styles.missingLine}><Text style={styles.missingText}>An item is no longer available in the shop.</Text><Pressable onPress={() => removeItem(productId)}><Text style={styles.removeText}>Remove</Text></Pressable></View>)}
              <Pressable onPress={clearCart} style={styles.clearButton}><Icon name="trash" size={14} color={COLORS.clay} /><Text style={styles.clearText}>Clear bag</Text></Pressable>
            </View>

            {!user ? <Pressable onPress={() => router.push("/(tabs)/account")} style={styles.shareCard}><View style={styles.shareIcon}><Icon name="refresh" size={18} color={COLORS.green} /></View><View style={styles.shareCopy}><Text style={styles.shareTitle}>Take your bag with you</Text><Text style={styles.shareBody}>Sign in with your website account to keep this bag shared between both.</Text></View><Icon name="arrow" size={17} color={COLORS.green} /></Pressable> : null}

            {unavailableCount > 0 ? <Message>{`${unavailableCount} item${unavailableCount === 1 ? " is" : "s are"} no longer in the catalogue. Remove ${unavailableCount === 1 ? "it" : "them"} to continue.`}</Message> : null}
            <View style={styles.summaryCard}>
              <View style={styles.deliveryProgress}>
                <View style={styles.deliveryHeader}><View style={styles.deliveryIcon}><Icon name="truck" size={17} color={COLORS.clay} /></View><Text style={styles.deliveryTitle}>{remaining === 0 ? "Delivery is on us." : `Add ${formatNaira(remaining)} for free delivery.`}</Text></View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_KOBO) * 100)}%` as `${number}%` }]} /></View>
                <Text style={styles.deliverySub}>Complimentary Lagos delivery on orders over ₦50,000.</Text>
              </View>
              <View style={styles.costRow}><Text style={styles.costLabel}>Subtotal</Text><Text style={styles.costValue}>{formatNaira(subtotal)}</Text></View>
              <View style={styles.costRow}><Text style={styles.costLabel}>Delivery</Text><Text style={[styles.costValue, shipping === 0 && styles.freeValue]}>{shipping === 0 ? "On us" : formatNaira(shipping)}</Text></View>
              <View style={styles.costDivider} />
              <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatNaira(subtotal + shipping)}</Text></View>
              <Text style={styles.paymentNote}>Pay on delivery · Lagos only</Text>
              <Button title="Continue to checkout" disabled={!availableLines.length || unavailableCount > 0} onPress={() => router.push("/checkout")} icon={<Icon name="arrow" size={17} color={COLORS.paper} />} style={styles.checkoutButton} />
              <View style={styles.secureNote}><Icon name="lock" size={12} color={COLORS.faint} /><Text style={styles.secureText}>Your details stay private and are used only to fulfil your order.</Text></View>
            </View>
          </>
        ) : null}

        <View style={styles.footer}><Text style={styles.footerText}>A good choice, made with care.</Text><Text style={styles.footerSpark}>✳</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  content: { paddingHorizontal: 20, paddingBottom: 35 },
  topLine: { paddingTop: 7, paddingBottom: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  continueLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  continueText: { color: COLORS.clay, fontSize: 11, fontWeight: "600" },
  headingRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  title: { color: COLORS.ink, fontFamily: "serif", fontSize: 35, letterSpacing: -1.5, marginTop: 8 },
  itemCount: { color: COLORS.faint, fontFamily: "serif", fontSize: 19, letterSpacing: 0 },
  syncPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: "#E8EEE3", marginBottom: 5 },
  syncDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: COLORS.green },
  syncDotActive: { backgroundColor: COLORS.clay },
  syncLabel: { color: COLORS.green, fontSize: 9, fontWeight: "700" },
  syncCaption: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 19 },
  loadingBox: { alignItems: "center", paddingVertical: 45, gap: 8 },
  loadingMark: { color: COLORS.clay, fontFamily: "serif", fontSize: 37 },
  bodyMuted: { color: COLORS.muted, fontSize: 12 },
  emptyCard: { alignItems: "center", backgroundColor: COLORS.paper, borderRadius: 21, padding: 24, borderWidth: 1, borderColor: COLORS.line, marginTop: 8 },
  emptyIcon: { width: 55, height: 55, borderRadius: 28, backgroundColor: COLORS.paleClay, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 23, lineHeight: 28, textAlign: "center" },
  emptyText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 7 },
  emptyButton: { width: "100%", marginTop: 20 },
  cartCard: { backgroundColor: COLORS.paper, borderRadius: 19, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 13, paddingTop: 4, paddingBottom: 4 },
  cartLine: { flexDirection: "row", paddingVertical: 14, gap: 12 },
  cartLineBorder: { borderTopWidth: 1, borderTopColor: COLORS.line },
  photoWrap: { width: 84, height: 100, borderRadius: 13, overflow: "hidden", backgroundColor: "#E9E4DA" },
  lineInfo: { flex: 1, justifyContent: "space-between", minHeight: 100, paddingVertical: 1 },
  lineTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 5, alignItems: "flex-start" },
  lineName: { color: COLORS.ink, fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 17 },
  removeButton: { padding: 1, marginTop: 1 },
  lineSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  linePrice: { color: COLORS.ink, fontSize: 12, fontWeight: "700", marginTop: 5 },
  quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.line, borderRadius: 9, height: 29 },
  quantityButton: { width: 30, height: 28, alignItems: "center", justifyContent: "center" },
  quantityValue: { minWidth: 19, textAlign: "center", color: COLORS.ink, fontSize: 11, fontWeight: "600" },
  eachPrice: { color: COLORS.faint, fontSize: 9 },
  missingLine: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  missingText: { color: COLORS.muted, fontSize: 11, flex: 1 },
  removeText: { color: COLORS.clay, fontSize: 11, fontWeight: "600" },
  clearButton: { height: 41, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderTopWidth: 1, borderTopColor: COLORS.line },
  clearText: { color: COLORS.clay, fontSize: 10, fontWeight: "600" },
  shareCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 13, borderRadius: 15, backgroundColor: "#E8EEE3", marginTop: 13 },
  shareIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F5F7F2", alignItems: "center", justifyContent: "center" },
  shareCopy: { flex: 1 },
  shareTitle: { color: "#4B6540", fontSize: 11, fontWeight: "700" },
  shareBody: { color: "#66755B", fontSize: 10, lineHeight: 15, marginTop: 3 },
  summaryCard: { marginTop: 14, backgroundColor: COLORS.paper, borderRadius: 19, borderWidth: 1, borderColor: COLORS.line, padding: 16 },
  deliveryProgress: { paddingBottom: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  deliveryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  deliveryIcon: { width: 29, height: 29, borderRadius: 15, backgroundColor: COLORS.paleClay, alignItems: "center", justifyContent: "center" },
  deliveryTitle: { color: COLORS.ink, fontSize: 11, fontWeight: "600", flex: 1 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: COLORS.line, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: COLORS.green },
  deliverySub: { color: COLORS.faint, fontSize: 9, marginTop: 7 },
  costRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  costLabel: { color: COLORS.muted, fontSize: 12 },
  costValue: { color: COLORS.ink, fontSize: 12, fontWeight: "600" },
  freeValue: { color: COLORS.green },
  costDivider: { height: 1, backgroundColor: COLORS.line, marginTop: 7 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12 },
  totalLabel: { color: COLORS.ink, fontFamily: "serif", fontSize: 16 },
  totalValue: { color: COLORS.ink, fontSize: 16, fontWeight: "700" },
  paymentNote: { color: COLORS.faint, fontSize: 9, marginTop: 5 },
  checkoutButton: { marginTop: 17 },
  secureNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 11 },
  secureText: { color: COLORS.faint, fontSize: 9 },
  footer: { alignItems: "center", marginTop: 27, gap: 5 },
  footerText: { color: COLORS.muted, fontFamily: "serif", fontSize: 13, fontStyle: "italic" },
  footerSpark: { color: COLORS.clay, fontSize: 16 },
});
