import type { Metadata } from "next";
import { AuthForm } from "../auth-form";
import { sanitizeNext } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create account · Ramp Minigames",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="signup" next={sanitizeNext(next)} />;
}
