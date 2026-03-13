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
import { registerSchema } from "@marineos/validation";
import { useAuth } from "@marineos/hooks";
import { colors, spacing, typography, borderRadius } from "@marineos/ui";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setFieldErrors({});
    setError(null);

    const result = registerSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

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
    const authResult = await signUp({
      email: result.data.email,
      password: result.data.password,
      fullName: result.data.fullName,
    });
    setLoading(false);

    if (authResult.success) {
      setSuccess(true);
    } else if (authResult.error) {
      setError(authResult.error);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.card}>
            <Text style={styles.title} testID="register-success-title">
              {t("auth.register.success.title")}
            </Text>
            <Text style={styles.successText} testID="register-success-text">
              {t("auth.register.success.checkEmail")}
            </Text>
            <Pressable
              testID="register-success-login-link"
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.footerLink}>{t("auth.register.login")}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
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
            <Text style={styles.title}>{t("auth.register.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.register.subtitle")}</Text>

            {error && (
              <View style={styles.errorBanner} testID="register-error-banner">
                <Text style={styles.errorBannerText}>{t(`auth.register.error.${error}`)}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.register.fullName")}</Text>
              <TextInput
                testID="register-fullName-input"
                style={[styles.input, fieldErrors.fullName && styles.inputError]}
                placeholder={t("auth.register.fullNamePlaceholder")}
                placeholderTextColor={colors.text.tertiary}
                autoComplete="name"
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
              />
              {fieldErrors.fullName && (
                <Text style={styles.fieldError} testID="register-fullName-error">
                  {t(`auth.validation.fullName.${fieldErrors.fullName}`)}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.register.email")}</Text>
              <TextInput
                testID="register-email-input"
                style={[styles.input, fieldErrors.email && styles.inputError]}
                placeholder={t("auth.register.emailPlaceholder")}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              {fieldErrors.email && (
                <Text style={styles.fieldError} testID="register-email-error">
                  {t(`auth.validation.email.${fieldErrors.email}`)}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.register.password")}</Text>
              <TextInput
                testID="register-password-input"
                style={[styles.input, fieldErrors.password && styles.inputError]}
                placeholder={t("auth.register.passwordPlaceholder")}
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
              />
              {fieldErrors.password && (
                <Text style={styles.fieldError} testID="register-password-error">
                  {t(`auth.validation.password.${fieldErrors.password}`)}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.register.confirmPassword")}</Text>
              <TextInput
                testID="register-confirmPassword-input"
                style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <Text style={styles.fieldError} testID="register-confirmPassword-error">
                  {t(`auth.validation.confirmPassword.${fieldErrors.confirmPassword}`)}
                </Text>
              )}
            </View>

            <Pressable
              testID="register-submit-button"
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
                <Text style={styles.buttonText}>{t("auth.register.submit")}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.register.hasAccount")} </Text>
            <Pressable testID="register-login-link" onPress={() => router.back()}>
              <Text style={styles.footerLink}>{t("auth.register.login")}</Text>
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
  centered: {
    flex: 1,
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
  successText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
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
    textAlign: "center",
  },
});
