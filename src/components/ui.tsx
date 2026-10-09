import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SvgUri } from "react-native-svg";
import { useState, type ReactNode } from "react";
import { COLORS } from "../lib/config";
import { imageUrl } from "../lib/api";
import type { Product } from "../lib/types";

export function Wordmark({ inverse = false, small = false }: { inverse?: boolean; small?: boolean }) {
  return <Text style={[styles.wordmark, inverse && styles.wordmarkInverse, small && styles.wordmarkSmall]}>morrow<Text style={styles.wordmarkDot}>.</Text></Text>;
}

export function Button({ title, onPress, variant = "dark", disabled = false, loading = false, icon, style }: {
  title: string; onPress: () => void; variant?: "dark" | "outline" | "quiet"; disabled?: boolean; loading?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.button, variant === "dark" ? styles.buttonDark : variant === "outline" ? styles.buttonOutline : styles.buttonQuiet, (disabled || loading) && styles.buttonDisabled, pressed && !disabled && styles.pressed, style]}>
      {loading ? <ActivityIndicator color={variant === "dark" ? COLORS.paper : COLORS.ink} size="small" /> : null}
      <Text style={[styles.buttonText, variant !== "dark" && styles.buttonTextDark]}>{title}</Text>
      {!loading && icon}
    </Pressable>
  );
}

export function Message({ children, tone = "error" }: { children: string; tone?: "error" | "info" | "success" }) {
  if (!children) return null;
  return <View style={[styles.message, tone === "error" ? styles.messageError : tone === "success" ? styles.messageSuccess : styles.messageInfo]}><Text style={[styles.messageText, tone === "error" ? styles.messageErrorText : tone === "success" ? styles.messageSuccessText : styles.messageInfoText]}>{children}</Text></View>;
}

export function SectionEyebrow({ children, color = COLORS.clay }: { children: string; color?: string }) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function ProductPhoto({ product, style, resizeMode = "cover" }: { product: Product; style?: StyleProp<ViewStyle>; resizeMode?: "cover" | "contain" }) {
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(product.image_url || "");
  const isSvg = uri.toLowerCase().split("?")[0].endsWith(".svg");
  return (
    <View style={[styles.photo, style]}>
      {!failed && isSvg ? <SvgUri uri={uri} width="100%" height="100%" onError={() => setFailed(true)} /> : null}
      {!failed && !isSvg ? <Image source={{ uri }} resizeMode={resizeMode} onError={() => setFailed(true)} style={StyleSheet.absoluteFill} /> : null}
      {failed && <View style={styles.photoFallback}><Text style={styles.photoFallbackMark}>m.</Text><Text style={styles.photoFallbackName}>{product.category || "made with care"}</Text></View>}
    </View>
  );
}

export function TextField({ label, value, onChangeText, placeholder, keyboardType = "default", autoCapitalize = "sentences", multiline = false, style, autoComplete, secureTextEntry, maxLength }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "email-address" | "phone-pad"; autoCapitalize?: "none" | "sentences" | "words" | "characters"; multiline?: boolean; style?: StyleProp<TextStyle>; autoComplete?: "name" | "email" | "tel" | "street-address" | "postal-code" | "off"; secureTextEntry?: boolean; maxLength?: number;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} autoCapitalize={autoCapitalize} multiline={multiline} style={[styles.fieldInput, multiline && styles.fieldTextarea, style]} placeholderTextColor={COLORS.faint} autoComplete={autoComplete} secureTextEntry={secureTextEntry} maxLength={maxLength} />
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: { color: COLORS.ink, fontFamily: "serif", fontSize: 30, letterSpacing: -1.5, fontWeight: "600" },
  wordmarkInverse: { color: COLORS.paper },
  wordmarkSmall: { fontSize: 26 },
  wordmarkDot: { color: COLORS.clay },
  button: { minHeight: 54, borderRadius: 999, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  buttonDark: { backgroundColor: COLORS.ink },
  buttonOutline: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: "transparent" },
  buttonQuiet: { backgroundColor: COLORS.paleClay },
  buttonDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  buttonText: { color: COLORS.paper, fontSize: 15, fontWeight: "600", letterSpacing: 0.1 },
  buttonTextDark: { color: COLORS.ink },
  message: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  messageError: { backgroundColor: "#F8E9E5", borderColor: "#E8C6BB" },
  messageSuccess: { backgroundColor: "#E8EEE3", borderColor: "#CDD9C5" },
  messageInfo: { backgroundColor: "#F1ECE4", borderColor: COLORS.line },
  messageText: { fontSize: 13, lineHeight: 19 },
  messageErrorText: { color: COLORS.red },
  messageSuccessText: { color: "#4B6540" },
  messageInfoText: { color: COLORS.ink },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  photo: { backgroundColor: "#ECE7DD", overflow: "hidden", justifyContent: "center", alignItems: "center" },
  photoFallback: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.paleClay },
  photoFallbackMark: { color: COLORS.clay, fontFamily: "serif", fontSize: 44, fontWeight: "500" },
  photoFallbackName: { color: COLORS.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 2 },
  fieldWrap: { gap: 8 },
  fieldLabel: { color: COLORS.ink, fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  fieldInput: { minHeight: 52, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15, color: COLORS.ink },
  fieldTextarea: { minHeight: 94, textAlignVertical: "top" },
});
