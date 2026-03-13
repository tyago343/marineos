import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "@marineos/hooks";
import { colors, spacing, typography } from "@marineos/ui";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const name = user?.user_metadata?.full_name;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.container}>
        <Text style={styles.brandIcon}>⚓</Text>
        <Text style={styles.title}>MarineOS</Text>
        <Text style={styles.subtitle}>
          {name ? t("home.welcomeUser", { name }) : t("home.welcome")}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>{t("home.signOut")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  brandIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  signOutButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  signOutPressed: {
    backgroundColor: colors.neutral[100],
  },
  signOutText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
