"use client";

import { createContext, useContext } from "react";

/** Server feature flags (see src/lib/config.ts → getPublicConfig). */
export type ClientConfig = {
  mode: "db" | "mock";
  auth: boolean;
  google: boolean;
  email: boolean;
  storage: boolean;
};

const AppConfigContext = createContext<ClientConfig>({
  mode: "mock",
  auth: false,
  google: false,
  email: false,
  storage: false,
});

export function AppConfigProvider({ value, children }: { value: ClientConfig; children: React.ReactNode }) {
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export const useAppConfig = () => useContext(AppConfigContext);
