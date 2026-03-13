import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { loginSchema } from "@marineos/validation";
import { useAuth } from "@marineos/hooks";
import { colors, spacing, typography, borderRadius } from "@marineos/ui";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setFieldErrors({});
    setError(null);

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const authResult = await signIn(result.data.email, result.data.password);
    setLoading(false);

    if (!authResult.success && authResult.error) {
      setError(authResult.error);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.brandIcon}>⚓</Text>
            <Text style={styles.brandName}>MarineOS</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{t("auth.login.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>

            {error && (
              <View style={styles.errorBanner} testID="login-error-banner">
                <Text style={styles.errorBannerText} testID="login-error-text">
                  {t(`auth.login.error.${error}`)}
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.login.email")}</Text>
              <TextInput
                testID="login-email-input"
                style={[styles.input, fieldErrors.email && styles.inputError]}
                placeholder={t("auth.login.emailPlaceholder")}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              {fieldErrors.email && (
                <Text style={styles.fieldError} testID="login-email-error">
                  {t(`auth.validation.email.${fieldErrors.email}`)}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.login.password")}</Text>
              <TextInput
                testID="login-password-input"
                style={[styles.input, fieldErrors.password && styles.inputError]}
                placeholder={t("auth.login.passwordPlaceholder")}
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                autoComplete="current-password"
                value={password}
                onChangeText={setPassword}
              />
              {fieldErrors.password && (
                <Text style={styles.fieldError} testID="login-password-error">
                  {t(`auth.validation.password.${fieldErrors.password}`)}
                </Text>
              )}
            </View>

            <Pressable
              testID="login-submit-button"
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={styles.buttonText}>{t("auth.login.submit")}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.login.noAccount")} </Text>
            <Pressable testID="login-register-link" onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.footerLink}>{t("auth.login.register")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  brand: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  brandIcon: {
    fontSize: typography.fontSize["4xl"],
    marginBottom: spacing.xs,
  },
  brandName: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  errorBanner: {
    backgroundColor: colors.status.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  errorBannerText: {
    color: colors.status.error,
    fontSize: typography.fontSize.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  fieldError: {
    fontSize: typography.fontSize.xs,
    color: colors.status.error,
  },
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  buttonPressed: {
    backgroundColor: colors.primary[600],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  footerLink: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
