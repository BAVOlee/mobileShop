import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../../lib/config";
import { formatNaira } from "../../lib/api";
import { useCatalog } from "../../state/catalog";
import { useCart } from "../../state/cart";
import { useAuth } from "../../state/auth";
import { Button, Message, ProductPhoto, SectionEyebrow, Wordmark } from "../../components/ui";
import { Icon } from "../../components/icon";
import type { Product } from "../../lib/types";

const CATEGORIES = ["Everything", "Home", "Desk", "Carry", "Wellness"];

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  return (
    <View style={styles.productCard}>
      <View style={styles.productPhotoWrap}>
        <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })} style={({ pressed }) => [StyleSheet.absoluteFill, pressed && styles.pressed]} accessibilityLabel={`View ${product.name}`}>
          <ProductPhoto product={product} style={StyleSheet.absoluteFill} />
          {product.badge ? <View style={styles.productBadge}><Text style={styles.productBadgeText}>{product.badge}</Text></View> : null}
        </Pressable>
        <Pressable onPress={() => addItem(product.id)} hitSlop={8} style={({ pressed }) => [styles.quickAdd, pressed && styles.quickAddPressed]} accessibilityLabel={`Add ${product.name} to your bag`}>
          <Icon name="plus" size={17} color={COLORS.paper} />
        </Pressable>
      </View>
      <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })} style={styles.productTextBlock}>
        <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
        <Text numberOfLines={1} style={styles.productSubtitle}>{product.subtitle}</Text>
        <Text style={styles.productPrice}>{formatNaira(product.price_kobo)}</Text>
      </Pressable>
    </View>
  );
}

export default function ShopScreen() {
  const { products, loading, error, refresh } = useCatalog();
  const { count } = useCart();
  const { user } = useAuth();
  const [category, setCategory] = useState("Everything");
  const featured = useMemo(() => products.filter((item) => item.is_featured), [products]);
  const filtered = useMemo(() => category === "Everything" ? products : products.filter((item) => item.category === category), [products, category]);
  const remainingProducts = category === "Everything" ? filtered.filter((item) => !item.is_featured) : filtered;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.clay} />} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <Wordmark />
          <View style={styles.topActions}>
            {user ? <View style={styles.signedPill}><View style={styles.signedDot} /><Text style={styles.signedLabel}>Signed in</Text></View> : null}
            <Pressable onPress={() => router.push("/(tabs)/cart")} style={styles.topBag} accessibilityLabel={`Open bag with ${count} items`}>
              <Icon name="bag" size={21} />
              {count > 0 ? <View style={styles.topBagDot} /> : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <SectionEyebrow>THE MORROW EDIT · LAGOS</SectionEyebrow>
            <Text style={styles.heroTitle}>Small things,{"\n"}<Text style={styles.heroItalic}>softer days.</Text></Text>
            <Text style={styles.heroText}>Thoughtful goods for the rituals that make a day feel like yours.</Text>
            <Pressable onPress={() => router.push("/(tabs)/cart")} style={styles.heroLink}>
              <Text style={styles.heroLinkText}>Your bag {count > 0 ? `· ${count}` : ""}</Text><Icon name="arrow" size={17} color={COLORS.clay} />
            </Pressable>
          </View>
          <View style={styles.heroArt}>
            <View style={styles.heroSun} />
            <View style={styles.heroVase}>
              <View style={styles.vaseNeck} />
              <View style={styles.vaseBody} />
            </View>
            <View style={styles.heroStemOne} />
            <View style={styles.heroStemTwo} />
            <View style={styles.heroLeafOne} />
            <View style={styles.heroLeafTwo} />
            <View style={styles.heroLeafThree} />
            <View style={styles.heroShelf} />
            <Text style={styles.heroNumber}>01 / 05</Text>
          </View>
          <View style={styles.heroSpark}><Icon name="sparkle" size={19} color={COLORS.clay} /></View>
        </View>

        <View style={styles.sectionIntro}>
          <View><SectionEyebrow>MADE TO BE KEPT</SectionEyebrow><Text style={styles.sectionTitle}>A little lovely, every day.</Text></View>
          <Pressable onPress={() => router.push("/(tabs)/account")} hitSlop={8}><Text style={styles.aboutLink}>Our story ↗</Text></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {CATEGORIES.map((item) => {
            const selected = category === item;
            return <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, selected && styles.categoryChipSelected]}><Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item}</Text></Pressable>;
          })}
        </ScrollView>

        {error ? <View style={styles.errorWrap}><Message>{error}</Message><Button title="Try again" variant="outline" onPress={() => { void refresh(); }} style={styles.tryAgain} /></View> : null}
        {loading && products.length === 0 ? <View style={styles.loadingBox}><Text style={styles.loadingMark}>m.</Text><Text style={styles.loadingText}>Finding the good things…</Text></View> : null}
        {!loading && !error && filtered.length === 0 ? <View style={styles.emptyCatalog}><Icon name="heart" size={28} color={COLORS.clay} /><Text style={styles.emptyCatalogTitle}>Nothing here just yet.</Text><Text style={styles.emptyCatalogText}>Try another collection.</Text></View> : null}

        {category === "Everything" && featured.length > 0 && !loading ? (
          <View style={styles.featuredWrap}>
            <View style={styles.sectionRow}><Text style={styles.smallSectionTitle}>A few favourites</Text><View style={styles.sectionRule} /></View>
            <View style={styles.productGrid}>{featured.map((product) => <ProductCard key={product.id} product={product} />)}</View>
          </View>
        ) : null}
        <View style={styles.allWrap}>
          <View style={styles.sectionRow}><Text style={styles.smallSectionTitle}>{category === "Everything" ? "More good things" : category}</Text><View style={styles.sectionRule} /><Text style={styles.itemCount}>{remainingProducts.length.toString().padStart(2, "0")}</Text></View>
          <View style={styles.productGrid}>{remainingProducts.map((product) => <ProductCard key={product.id} product={product} />)}</View>
        </View>
        <View style={styles.footer}><Text style={styles.footerStar}>✳</Text><Text style={styles.footerText}>Made thoughtfully. Sent with care.</Text><Wordmark small /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  scrollContent: { paddingBottom: 36 },
  topBar: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 17, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topActions: { flexDirection: "row", gap: 13, alignItems: "center" },
  signedPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "#E8EEE3", paddingHorizontal: 10, paddingVertical: 6 },
  signedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  signedLabel: { color: COLORS.green, fontSize: 10, fontWeight: "600" },
  topBag: { width: 41, height: 41, borderRadius: 24, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, justifyContent: "center", alignItems: "center" },
  topBagDot: { position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.clay, borderWidth: 1, borderColor: COLORS.paper },
  hero: { marginHorizontal: 16, minHeight: 255, borderRadius: 22, backgroundColor: "#E8E1D5", overflow: "hidden", flexDirection: "row", padding: 19 },
  heroCopy: { flex: 1.1, justifyContent: "center", zIndex: 1, paddingRight: 2 },
  heroTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 32, lineHeight: 36, letterSpacing: -1.6, marginTop: 16 },
  heroItalic: { fontStyle: "italic", color: COLORS.clay },
  heroText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 12, maxWidth: 210 },
  heroLink: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 16 },
  heroLinkText: { color: COLORS.ink, fontSize: 11, fontWeight: "700" },
  heroArt: { flex: 0.85, alignItems: "center", justifyContent: "flex-end", minWidth: 100, marginRight: -4, marginBottom: 11 },
  heroSun: { position: "absolute", top: 22, right: 6, width: 88, height: 88, borderRadius: 44, backgroundColor: "#D5BBA1" },
  heroVase: { width: 76, height: 112, alignItems: "center", justifyContent: "flex-end", zIndex: 2 },
  vaseNeck: { position: "absolute", top: 0, width: 25, height: 30, backgroundColor: "#AB7B5C", borderTopLeftRadius: 5, borderTopRightRadius: 5, zIndex: 1 },
  vaseBody: { width: 74, height: 88, backgroundColor: "#B98969", borderTopLeftRadius: 23, borderTopRightRadius: 23, borderBottomLeftRadius: 13, borderBottomRightRadius: 13 },
  heroStemOne: { position: "absolute", top: 19, left: 31, width: 2, height: 60, backgroundColor: "#74805D", transform: [{ rotate: "-20deg" }] },
  heroStemTwo: { position: "absolute", top: 13, left: 70, width: 2, height: 60, backgroundColor: "#74805D", transform: [{ rotate: "23deg" }] },
  heroLeafOne: { position: "absolute", top: 32, left: 20, width: 24, height: 11, borderRadius: 24, backgroundColor: "#74805D", transform: [{ rotate: "-34deg" }] },
  heroLeafTwo: { position: "absolute", top: 40, right: 19, width: 23, height: 10, borderRadius: 24, backgroundColor: "#74805D", transform: [{ rotate: "32deg" }] },
  heroLeafThree: { position: "absolute", top: 13, right: 23, width: 24, height: 10, borderRadius: 24, backgroundColor: "#86906C", transform: [{ rotate: "-31deg" }] },
  heroShelf: { position: "absolute", bottom: -6, width: 150, height: 19, borderRadius: 7, backgroundColor: "#BAAA94" },
  heroNumber: { position: "absolute", bottom: -17, right: 0, color: COLORS.muted, fontSize: 8, letterSpacing: 1.6 },
  heroSpark: { position: "absolute", top: 15, right: 14 },
  sectionIntro: { paddingHorizontal: 22, paddingTop: 27, paddingBottom: 15, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  sectionTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 21, letterSpacing: -0.6, marginTop: 6 },
  aboutLink: { color: COLORS.clay, fontSize: 11, fontWeight: "600", paddingBottom: 4 },
  categories: { paddingHorizontal: 22, gap: 8, paddingBottom: 18 },
  categoryChip: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper },
  categoryChipSelected: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  categoryText: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  categoryTextSelected: { color: COLORS.paper },
  errorWrap: { paddingHorizontal: 20, gap: 10, paddingBottom: 12 },
  tryAgain: { alignSelf: "flex-start", minHeight: 43 },
  loadingBox: { paddingVertical: 50, alignItems: "center", gap: 10 },
  loadingMark: { fontFamily: "serif", fontSize: 36, color: COLORS.clay },
  loadingText: { fontSize: 12, color: COLORS.muted },
  emptyCatalog: { alignItems: "center", paddingVertical: 34, gap: 8 },
  emptyCatalogTitle: { color: COLORS.ink, fontFamily: "serif", fontSize: 20 },
  emptyCatalogText: { color: COLORS.muted, fontSize: 12 },
  featuredWrap: { paddingHorizontal: 20 },
  allWrap: { paddingHorizontal: 20, paddingTop: 15 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 13 },
  smallSectionTitle: { fontFamily: "serif", fontSize: 17, color: COLORS.ink },
  sectionRule: { flex: 1, height: 1, backgroundColor: COLORS.line },
  itemCount: { color: COLORS.faint, fontSize: 10, letterSpacing: 1 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 17 },
  productCard: { width: "48.2%", marginBottom: 3 },
  productPhotoWrap: { width: "100%", aspectRatio: 0.84, borderRadius: 17, overflow: "hidden", backgroundColor: "#E9E4DA" },
  pressed: { opacity: 0.85 },
  productBadge: { position: "absolute", top: 10, left: 10, backgroundColor: "rgba(255,253,250,.92)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  productBadgeText: { color: COLORS.clay, fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  quickAdd: { position: "absolute", bottom: 10, right: 10, width: 34, height: 34, borderRadius: 20, backgroundColor: COLORS.ink, justifyContent: "center", alignItems: "center" },
  quickAddPressed: { transform: [{ scale: 0.94 }], backgroundColor: COLORS.clay },
  productTextBlock: { paddingHorizontal: 2, paddingTop: 10 },
  productName: { color: COLORS.ink, fontSize: 13, fontWeight: "600" },
  productSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  productPrice: { color: COLORS.ink, fontSize: 12, fontWeight: "700", marginTop: 8 },
  footer: { marginHorizontal: 20, marginTop: 35, paddingTop: 22, borderTopWidth: 1, borderTopColor: COLORS.line, alignItems: "center", gap: 9 },
  footerStar: { color: COLORS.clay, fontSize: 16 },
  footerText: { color: COLORS.muted, fontSize: 11 },
});
