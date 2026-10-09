import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, FREE_SHIPPING_THRESHOLD_KOBO, SHIPPING_FEE_KOBO } from "../lib/config";
import { apiRequest, formatNaira } from "../lib/api";
import { useCatalog } from "../state/catalog";
import { useCart } from "../state/cart";
import { useAuth } from "../state/auth";
import { Button, Message, ProductPhoto, SectionEyebrow, TextField, Wordmark } from "../components/ui";
import { Icon } from "../components/icon";

type CustomerForm = { name: string; email: string; phone: string; address: string; city: string; postalCode: string; notes: string };
const EMPTY_FORM: CustomerForm = { name: "", email: "", phone: "", address: "", city: "", postalCode: "", notes: "" };
type OrderResponse = { orderNumber: string; persisted: boolean; emailSent: boolean; totalKobo: number };

export default function CheckoutScreen() {
  const { products, loading: catalogLoading, refresh: refreshCatalog } = useCatalog();
  const { items, sessionId, loading: cartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState<CustomerForm>(() => ({ ...EMPTY_FORM, name: user?.name || "", email: user?.email || "" }));
  const visibleForm = { ...form, name: form.name || user?.name || "", email: form.email || user?.email || "" };
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const lines = items.map((line) => ({ ...line, product: productMap.get(line.productId) }));
  const orderLines = lines.filter((line): line is typeof line & { product: NonNullable<typeof line.product> } => Boolean(line.product));
  const unavailable = lines.length !== orderLines.length;
  const subtotal = orderLines.reduce((sum, line) => sum + line.product.price_kobo * line.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_KOBO ? 0 : SHIPPING_FEE_KOBO;


  function update(field: keyof CustomerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder() {
    setError("");
    if (cartLoading || catalogLoading) return;
    if (!sessionId || orderLines.length === 0 || unavailable) {
      setError("Your bag needs a quick refresh before checkout. Please return to your bag and check the items.");
      return;
    }
    setPlacing(true);
    try {
      const response = await apiRequest<OrderResponse>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          items: orderLines.map(({ productId, quantity }) => ({ productId, quantity })),
          customer: form,
          paymentMethod: "pay_on_delivery",
        }),
      });
      clearCart();
      router.replace({ pathname: "/order-success", params: {
        orderNumber: response.orderNumber,
        firstName: form.name.trim().split(/\s+/)[0] || "friend",
        email: form.email,
        emailSent: String(Boolean(response.emailSent)),
        persisted: String(Boolean(response.persisted)),
      } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  const canPlace = Boolean(form.name.trim() && form.email.trim() && form.phone.trim() && form.address.trim() && form.city.trim());

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back to bag"><Icon name="back" size={20} /></Pressable>
          <Wordmark small />
          <View style={styles.securePill}><Icon name="lock" size={13} color={COLORS.green} /><Text style={styles.secureText}>Secure</Text></View>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <SectionEyebrow>ALMOST YOURS</SectionEyebrow>
          <Text style={styles.title}>Let’s make it{ "\n"}<Text style={styles.titleItalic}>official.</Text></Text>
          <Text style={styles.subtitle}>A few details and these good things will be on their way.</Text>

          {user ? <View style={styles.accountNote}><Icon name="check" size={15} color={COLORS.green} /><Text style={styles.accountNoteText}>Signed in as {user.email || user.name}; this order will be linked to your account.</Text></View> : null}

          <View style={styles.formCard}>
            <View style={styles.sectionHead}><Text style={styles.stepNumber}>01</Text><View><Text style={styles.formTitle}>Your details</Text><Text style={styles.formSub}>Where should we send your updates?</Text></View></View>
            <View style={styles.fields}>
              <TextField label="Full name *" value={visibleForm.name} onChangeText={(value) => update("name", value)} placeholder="Your full name" autoComplete="name" autoCapitalize="words" maxLength={120} />
              <TextField label="Email address *" value={form.email} onChangeText={(value) => update("email", value)} placeholder="you@example.com" autoComplete="email" keyboardType="email-address" autoCapitalize="none" maxLength={254} />
              <TextField label="Phone number *" value={form.phone} onChangeText={(value) => update("phone", value)} placeholder="+234 800 000 0000" autoComplete="tel" keyboardType="phone-pad" maxLength={40} />
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.sectionHead}><Text style={styles.stepNumber}>02</Text><View><Text style={styles.formTitle}>Delivery details</Text><Text style={styles.formSub}>We currently deliver across Lagos.</Text></View></View>
            <View style={styles.fields}>
              <TextField label="Street address *" value={form.address} onChangeText={(value) => update("address", value)} placeholder="House number, street, area" autoComplete="street-address" maxLength={250} />
              <TextField label="City / area *" value={form.city} onChangeText={(value) => update("city", value)} placeholder="e.g. Lekki Phase 1" autoCapitalize="words" maxLength={100} />
              <TextField label="Postcode · optional" value={form.postalCode} onChangeText={(value) => update("postalCode", value)} placeholder="Postcode" autoComplete="postal-code" maxLength={24} />
              <TextField label="Delivery note · optional" value={form.notes} onChangeText={(value) => update("notes", value)} placeholder="Anything our delivery team should know?" multiline maxLength={500} />
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.sectionHead}><Text style={styles.stepNumber}>03</Text><View><Text style={styles.formTitle}>Payment</Text><Text style={styles.formSub}>Simple, safe and no surprises.</Text></View></View>
            <View style={styles.paymentCard}><View style={styles.paymentRadio}><View style={styles.paymentRadioInner} /></View><View style={styles.paymentCopy}><Text style={styles.paymentTitle}>Pay on delivery</Text><Text style={styles.paymentSub}>Pay by cash or transfer when your order arrives.</Text></View><Text style={styles.lagosTag}>LAGOS</Text></View>
          </View>

          {error ? <View style={styles.errorWrap}><Message>{error}</Message></View> : null}
          {unavailable ? <View style={styles.errorWrap}><Message>{"One or more items are no longer available. Please update your bag."}</Message><Button title="Refresh shop items" variant="outline" onPress={() => { void refreshCatalog(); }} /></View> : null}
          <View style={styles.privacyRow}><Icon name="lock" size={15} color={COLORS.green} /><Text style={styles.privacyText}>Your details are only used to fulfil this order. We’ll never share them.</Text></View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}><View><SectionEyebrow>THE GOOD THINGS</SectionEyebrow><Text style={styles.summaryTitle}>Your order <Text style={styles.summaryCount}>({items.reduce((sum, line) => sum + line.quantity, 0)})</Text></Text></View><Icon name="sparkle" size={20} color={COLORS.clay} /></View>
            {orderLines.map(({ product, productId, quantity }) => (
              <View key={productId} style={styles.orderLine}><View style={styles.thumb}><ProductPhoto product={product} style={StyleSheet.absoluteFill} /><View style={styles.thumbCount}><Text style={styles.thumbCountText}>{quantity}</Text></View></View><View style={styles.orderText}><Text numberOfLines={1} style={styles.orderName}>{product.name}</Text><Text numberOfLines={1} style={styles.orderSub}>{product.subtitle}</Text></View><Text style={styles.orderPrice}>{formatNaira(product.price_kobo * quantity)}</Text></View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.costRow}><Text style={styles.costLabel}>Subtotal</Text><Text style={styles.costValue}>{formatNaira(subtotal)}</Text></View>
            <View style={styles.costRow}><Text style={styles.costLabel}>Delivery</Text><Text style={[styles.costValue, shipping === 0 && styles.freeValue]}>{shipping === 0 ? "On us" : formatNaira(shipping)}</Text></View>
            {shipping > 0 && subtotal > 0 ? <Text style={styles.deliveryHint}>Add {formatNaira(FREE_SHIPPING_THRESHOLD_KOBO - subtotal)} more for free delivery.</Text> : null}
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatNaira(subtotal + shipping)}</Text></View>
            <Text style={styles.taxNote}>All prices include applicable taxes.</Text>
          </View>
          <Button title={placing ? "Placing your order…" : "Place my order"} onPress={() => { void placeOrder(); }} disabled={placing || !canPlace || !orderLines.length || unavailable || cartLoading || catalogLoading} loading={placing} icon={<Icon name="arrow" size={17} color={COLORS.paper} />} style={styles.placeButton} />
          <View style={styles.payNote}><Icon name="lock" size={12} color={COLORS.faint} /><Text style={styles.payNoteText}>Secure order · Pay on delivery</Text></View>
          <Pressable onPress={() => router.back()} style={styles.backToBag}><Text style={styles.backToBagText}>←  Return to your bag</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  topBar: { height: 57, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 38, height: 38, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, alignItems: "center", justifyContent: "center" },
  securePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E8EEE3", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  secureText: { color: COLORS.green, fontSize: 9, fontWeight: "700" },
  content: { paddingHorizontal: 19, paddingTop: 10, paddingBottom: 35 },
  title: { color: COLORS.ink, fontFamily: "serif", fontSize: 36, lineHeight: 39, letterSpacing: -1.5, marginTop: 11 },
  titleItalic: { color: COLORS.clay, fontStyle: "italic" },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 9, marginBottom: 17 },
  accountNote: { flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 13, padding: 11, backgroundColor: "#E8EEE3", marginBottom: 13 },
  accountNoteText: { color: COLORS.green, fontSize: 10, lineHeight: 15, flex: 1 },
  formCard: { backgroundColor: COLORS.paper, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 15, marginBottom: 12 },
  sectionHead: { flexDirection: "row", gap: 11, alignItems: "flex-start", marginBottom: 16 },
  stepNumber: { color: COLORS.clay, fontFamily: "serif", fontSize: 16, marginTop: -1 },
  formTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 19 },
  formSub: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  fields: { gap: 13 },
  paymentCard: { borderWidth: 1, borderColor: COLORS.clay, borderRadius: 13, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FBF7F2" },
  paymentRadio: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.clay, justifyContent: "center", alignItems: "center" },
  paymentRadioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.clay },
  paymentCopy: { flex: 1 },
  paymentTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "600" },
  paymentSub: { color: COLORS.muted, fontSize: 9, marginTop: 4, lineHeight: 14 },
  lagosTag: { color: COLORS.clay, fontSize: 8, fontWeight: "700", letterSpacing: 0.8, backgroundColor: COLORS.paleClay, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 4 },
  errorWrap: { marginBottom: 12, gap: 8 },
  privacyRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingHorizontal: 2, marginVertical: 4 },
  privacyText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, flex: 1 },
  summaryCard: { marginTop: 15, backgroundColor: COLORS.paper, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 15 },
  summaryHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  summaryTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 20, marginTop: 5 },
  summaryCount: { color: COLORS.faint, fontSize: 13, fontFamily: "serif" },
  orderLine: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
  thumb: { width: 47, height: 50, borderRadius: 9, overflow: "hidden", backgroundColor: "#E9E4DA" },
  thumbCount: { position: "absolute", top: 3, right: 3, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: COLORS.ink, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  thumbCountText: { color: "white", fontSize: 8, fontWeight: "700" },
  orderText: { flex: 1, gap: 4 },
  orderName: { color: COLORS.ink, fontSize: 10, fontWeight: "600" },
  orderSub: { color: COLORS.muted, fontSize: 9 },
  orderPrice: { color: COLORS.ink, fontSize: 10, fontWeight: "600" },
  summaryDivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 8 },
  costRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  costLabel: { color: COLORS.muted, fontSize: 11 },
  costValue: { color: COLORS.ink, fontSize: 11, fontWeight: "600" },
  freeValue: { color: COLORS.green },
  deliveryHint: { color: COLORS.clay, fontSize: 9, marginTop: 3 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 11, marginTop: 8 },
  totalLabel: { color: COLORS.ink, fontFamily: "serif", fontSize: 15 },
  totalValue: { color: COLORS.ink, fontSize: 15, fontWeight: "700" },
  taxNote: { color: COLORS.faint, fontSize: 8, marginTop: 6 },
  placeButton: { marginTop: 15 },
  payNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10 },
  payNoteText: { color: COLORS.faint, fontSize: 9 },
  backToBag: { alignItems: "center", paddingVertical: 15 },
  backToBagText: { color: COLORS.clay, fontSize: 11, fontWeight: "600" },
});
