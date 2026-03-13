import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@marineos/ui";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.tertiary,
        headerStyle: { backgroundColor: colors.background.primary },
        headerTintColor: colors.text.primary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
    </Tabs>
  );
}
