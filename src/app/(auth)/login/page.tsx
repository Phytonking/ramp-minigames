import type { Metadata } from "next";
import { AuthForm } from "../auth-form";
import { sanitizeNext } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in · Ramp Minigames",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={sanitizeNext(next)} />;
}
