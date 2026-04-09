import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { currentUser, isLoading } = useApp();
  if (isLoading) return null;
  if (currentUser) return <Redirect href="/(tabs)/" />;
  return <Redirect href="/(auth)/" />;
}
