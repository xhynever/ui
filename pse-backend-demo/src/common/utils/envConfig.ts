import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  HOST: z.string().min(1).default("localhost"),
  PORT: z.coerce.number().int().positive().default(8080),
  CLIENT_CERT: isDevelopment ? z.string().default("") : z.string().min(1),
  CLIENT_KEY: isDevelopment ? z.string().default("") : z.string().min(1),
  GNOSIS_PSE_PRIVATE_API_BASE_URL: z.string().url().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

// Warn if running in development with missing certificates
if (isDevelopment && (!process.env.CLIENT_CERT || !process.env.CLIENT_KEY)) {
  console.warn("⚠️  Running in development mode without CLIENT_CERT and CLIENT_KEY. The /token endpoint will fail when called.");
}

export const env = {
  ...parsedEnv.data,
  isDevelopment: parsedEnv.data.NODE_ENV === "development",
  isProduction: parsedEnv.data.NODE_ENV === "production",
  isTest: parsedEnv.data.NODE_ENV === "test",
};
