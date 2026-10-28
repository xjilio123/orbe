import { defineConfig, devices } from "@playwright/test";

// Pruebas E2E contra la app compilada (next start), sin sesión ni datos reales.
// FLUIDEZ=1 corre solo la prueba de fluidez, con la vitrina de datos ficticios activada.
const fluidez = process.env.FLUIDEZ === "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: fluidez ? ["fluidez.spec.ts"] : undefined,
  testIgnore: fluidez ? undefined : ["fluidez.spec.ts"],
  // Las mediciones de fluidez se hacen de a una para que no compitan por la CPU.
  fullyParallel: !fluidez,
  workers: fluidez ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    ...devices["Desktop Chrome"],
    viewport: { width: 430, height: 932 }, // iPhone 15 Plus
  },
  webServer: {
    command: "npx next start -p 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: fluidez ? { ORBE_VITRINA: "1" } : {},
  },
});
