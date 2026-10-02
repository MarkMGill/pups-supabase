import { Redirect } from "expo-router";

import { useAuthStore } from "../store/auth";

export default function Index() {
  const user = useAuthStore((state) => state.user);

  return <Redirect href={user ? "/(app)/home" : "/(auth)/login"} />;
}