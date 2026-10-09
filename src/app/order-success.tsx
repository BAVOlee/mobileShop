import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../lib/config";
import { Button, SectionEyebrow, Wordmark } from "../components/ui";
import { Icon } from "../components/icon";

export default function OrderSuccessScreen() {
  const params = useLocalSearchParams<{ orderNumber?: string; firstName?: string; email?: string; emailSent?: string; persisted?: string }>();
  const orderNumber = typeof params.orderNumber === "string" ? params.orderNumber : "Morrow Goods";
  const firstName = typeof params.firstName === "string" ? params.firstName : "friend";
  const email = typeof params.email === "string" ? params.email : "";
  const emailSent = params.emailSent === "true";
  const persisted = params.persisted === "true";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}><Wordmark small /><Pressable onPress={() => router.replace("/(tabs)")}><Text style={styles.homeLink}>Shop more ↗</Text></Pressable></View>
        <View style={styles.card}>
          <View style={styles.checkCircle}><Icon name="check" size={27} color={COLORS.paper} /></View>
          <SectionEyebrow>THAT’S A LOVELY CHOICE</SectionEyebrow>
          <Text style={styles.title}>Your order is{ "\n"}<Text style={styles.titleItalic}>{persisted ? "on its way." : "all received."}</Text></Text>
          <Text style={styles.message}>Thank you, {firstName}. {persisted ? "We’ve got your order and will be in touch as soon as it’s ready." : "Your order has been received in preview mode."}</Text>
          <View style={styles.orderRef}><Text style={styles.refLabel}>ORDER REFERENCE</Text><Text style={styles.refValue}>{orderNumber}</Text></View>
          <View style={styles.statusList}>
            <View style={styles.statusRow}><View style={styles.statusCheck}><Icon name="check" size={12} color={COLORS.green} /></View><Text style={styles.statusName}>Order received</Text><Text style={styles.statusMeta}>Just now</Text></View>
            <View style={styles.statusRow}><View style={[styles.statusCheck, !emailSent && styles.statusPending]}><Icon name={emailSent ? "check" : "clock"} size={12} color={emailSent ? COLORS.green : COLORS.clay} /></View><Text style={styles.statusName}>Confirmation email</Text><Text numberOfLines={1} style={styles.statusMeta}>{emailSent ? (email || "Sent") : "Email not sent"}</Text></View>
          </View>
          {persisted && !emailSent ? <Text style={styles.emailNote}>Your order is saved. The confirmation email wasn’t sent just now, but this won’t affect your order.</Text> : null}
          {!persisted ? <Text style={styles.previewNote}>Preview mode: this response says the order was not saved to the live order database.</Text> : null}
          <Button title="Back to the good things" onPress={() => router.replace("/(tabs)")} icon={<Icon name="arrow" size={17} color={COLORS.paper} />} style={styles.homeButton} />
          <Text style={styles.signoff}>With care, the Morrow team <Text style={styles.spark}>✳</Text></Text>
        </View>
        <View style={styles.footer}><Icon name="truck" size={18} color={COLORS.clay} /><Text style={styles.footerText}>We’ll be in touch about your Lagos delivery.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 28 },
  topBar: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  homeLink: { color: COLORS.clay, fontSize: 11, fontWeight: "600" },
  card: { flex: 1, marginTop: 14, backgroundColor: COLORS.paper, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, padding: 23, alignItems: "center", justifyContent: "center" },
  checkCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.green, marginBottom: 21 },
  title: { color: COLORS.ink, fontFamily: "serif", fontSize: 36, lineHeight: 39, textAlign: "center", letterSpacing: -1.4, marginTop: 14 },
  titleItalic: { color: COLORS.clay, fontStyle: "italic" },
  message: { color: COLORS.muted, fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 11, maxWidth: 290 },
  orderRef: { width: "100%", borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, backgroundColor: "#F8F5EF", padding: 13, alignItems: "center", marginTop: 21 },
  refLabel: { color: COLORS.faint, fontSize: 8, fontWeight: "700", letterSpacing: 1.8 },
  refValue: { color: COLORS.ink, fontSize: 14, fontWeight: "700", letterSpacing: 1.4, marginTop: 5 },
  statusList: { width: "100%", marginTop: 18, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10, gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#E8EEE3", alignItems: "center", justifyContent: "center" },
  statusPending: { backgroundColor: COLORS.paleClay },
  statusName: { flex: 1, color: COLORS.ink, fontSize: 10, fontWeight: "600" },
  statusMeta: { color: COLORS.muted, fontSize: 9, maxWidth: 130 },
  emailNote: { color: COLORS.muted, backgroundColor: "#F5F0E8", borderRadius: 11, padding: 10, fontSize: 10, lineHeight: 15, marginTop: 12 },
  previewNote: { color: COLORS.clay, backgroundColor: "#F5F0E8", borderRadius: 11, padding: 10, fontSize: 10, lineHeight: 15, marginTop: 12 },
  homeButton: { width: "100%", marginTop: 20 },
  signoff: { color: COLORS.muted, fontFamily: "serif", fontSize: 11, fontStyle: "italic", marginTop: 18 },
  spark: { color: COLORS.clay, fontStyle: "normal" },
  footer: { alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingTop: 18 },
  footerText: { color: COLORS.muted, fontSize: 10 },
});
