import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../../lib/config";
import { useAuth } from "../../state/auth";
import { Button, Message, SectionEyebrow, Wordmark } from "../../components/ui";
import { Icon } from "../../components/icon";

export default function AccountScreen() {
  const { user, loading, signingIn, error, signInWithGoogle, signOut, clearError } = useAuth();

  function confirmSignOut() {
    Alert.alert("Sign out?", "Your shared bag stays saved to your account.", [
      { text: "Stay signed in", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => { void signOut(); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topLine}><Wordmark /><Pressable onPress={() => router.push("/(tabs)")} hitSlop={10}><Text style={styles.shopLink}>Back to the shop ↗</Text></Pressable></View>
        <View style={styles.heading}>
          <SectionEyebrow>YOUR LITTLE CORNER</SectionEyebrow>
          <Text style={styles.title}>Good to have{ "\n"}<Text style={styles.titleItalic}>you here.</Text></Text>
          <Text style={styles.subtitle}>One account, wherever you shop.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}><Text style={styles.loadingMark}>m.</Text><Text style={styles.bodyMuted}>Checking your account…</Text></View>
        ) : user ? (
          <View style={styles.accountCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || user.email || "M").trim().slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.profileCopy}><Text style={styles.profileName}>{user.name || "Morrow friend"}</Text><Text style={styles.profileEmail}>{user.email || "Signed in with Google"}</Text></View>
              <View style={styles.verified}><Icon name="check" size={16} color={COLORS.green} /></View>
            </View>
            <View style={styles.divider} />
            <View style={styles.syncRow}><View style={styles.syncIcon}><Icon name="refresh" size={17} color={COLORS.green} /></View><View style={styles.syncCopy}><Text style={styles.syncTitle}>Your bag follows you</Text><Text style={styles.syncText}>Add something here and it appears on the website too.</Text></View></View>
            <View style={styles.syncRow}><View style={styles.syncIcon}><Icon name="lock" size={17} color={COLORS.green} /></View><View style={styles.syncCopy}><Text style={styles.syncTitle}>Signed in securely</Text><Text style={styles.syncText}>Google sign-in is handled in your browser. Your password stays with Google.</Text></View></View>
            <Button title="Sign out" variant="outline" onPress={confirmSignOut} style={styles.signOutButton} />
          </View>
        ) : (
          <View style={styles.signInCard}>
            <View style={styles.signInIcon}><Icon name="person" size={25} color={COLORS.clay} /></View>
            <Text style={styles.signInTitle}>Bring your bag along.</Text>
            <Text style={styles.signInBody}>Sign in with the same Google account you use on the Morrow Goods website. Your account and cart stay in step across both.</Text>
            {Platform.OS === "web" ? <View style={styles.errorBox}><Message tone="info">Google sign-in is tested in the Android development app, not this browser preview.</Message></View> : error ? <View style={styles.errorBox}><Message>{error}</Message><Pressable onPress={clearError} style={styles.dismissError}><Text style={styles.dismissText}>Dismiss</Text></Pressable></View> : null}
            <Button title="Continue with Google" onPress={() => { void signInWithGoogle(); }} disabled={Platform.OS === "web"} loading={signingIn} icon={<Text style={styles.googleG}>G</Text>} style={styles.googleButton} />
            <Text style={styles.signInFoot}>A secure browser window will open for sign-in.</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <SectionEyebrow>MADE THOUGHTFULLY</SectionEyebrow>
          <Text style={styles.infoTitle}>Objects for a life well noticed.</Text>
          <Text style={styles.infoBody}>Morrow Goods brings together small-batch objects, home comforts and everyday rituals, selected with care in Lagos.</Text>
          <View style={styles.infoBottom}><Text style={styles.infoSignature}>A little more meaning in the everyday.</Text><Text style={styles.infoSpark}>✳</Text></View>
        </View>
        <View style={styles.footer}><Text style={styles.footerText}>Morrow Goods · Lagos, Nigeria</Text><Text style={styles.footerVersion}>Made for the slower moments.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  content: { paddingHorizontal: 21, paddingBottom: 38 },
  topLine: { paddingTop: 6, paddingBottom: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shopLink: { color: COLORS.clay, fontSize: 11, fontWeight: "600" },
  heading: { marginBottom: 23 },
  title: { fontFamily: "serif", fontSize: 38, lineHeight: 41, letterSpacing: -1.8, color: COLORS.ink, marginTop: 12 },
  titleItalic: { color: COLORS.clay, fontStyle: "italic" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 10 },
  loadingCard: { backgroundColor: COLORS.paper, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, padding: 28, alignItems: "center", gap: 8 },
  loadingMark: { fontFamily: "serif", fontSize: 34, color: COLORS.clay },
  bodyMuted: { color: COLORS.muted, fontSize: 13 },
  accountCard: { backgroundColor: COLORS.paper, borderRadius: 21, borderWidth: 1, borderColor: COLORS.line, padding: 17 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 49, height: 49, borderRadius: 25, backgroundColor: COLORS.paleClay, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.clay, fontFamily: "serif", fontSize: 21, fontWeight: "600" },
  profileCopy: { flex: 1, gap: 3 },
  profileName: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  profileEmail: { fontSize: 11, color: COLORS.muted },
  verified: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E8EEE3", alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 17 },
  syncRow: { flexDirection: "row", gap: 11, marginBottom: 15 },
  syncIcon: { width: 31, height: 31, borderRadius: 16, backgroundColor: "#E8EEE3", alignItems: "center", justifyContent: "center" },
  syncCopy: { flex: 1, paddingTop: 2, gap: 4 },
  syncTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "600" },
  syncText: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  signOutButton: { marginTop: 6, minHeight: 48 },
  signInCard: { backgroundColor: COLORS.paper, borderRadius: 21, borderWidth: 1, borderColor: COLORS.line, padding: 20 },
  signInIcon: { width: 49, height: 49, borderRadius: 25, backgroundColor: COLORS.paleClay, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  signInTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 23, letterSpacing: -0.5 },
  signInBody: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 9 },
  errorBox: { marginTop: 15, gap: 5 },
  dismissError: { alignSelf: "flex-end", paddingVertical: 4, paddingHorizontal: 3 },
  dismissText: { color: COLORS.clay, fontSize: 11, fontWeight: "600" },
  googleButton: { marginTop: 18 },
  googleG: { fontSize: 17, lineHeight: 20, color: "#4285F4", backgroundColor: "white", borderRadius: 10, paddingHorizontal: 5, fontWeight: "700" },
  signInFoot: { color: COLORS.faint, fontSize: 10, textAlign: "center", marginTop: 13 },
  infoCard: { marginTop: 21, backgroundColor: "#E9E2D6", borderRadius: 20, padding: 19, overflow: "hidden" },
  infoTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 22, lineHeight: 27, marginTop: 11 },
  infoBody: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  infoBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 17 },
  infoSignature: { color: COLORS.clay, fontFamily: "serif", fontSize: 12, fontStyle: "italic" },
  infoSpark: { fontSize: 20, color: COLORS.clay },
  footer: { alignItems: "center", marginTop: 25, gap: 5 },
  footerText: { color: COLORS.muted, fontSize: 10 },
  footerVersion: { color: COLORS.faint, fontSize: 9 },
});
