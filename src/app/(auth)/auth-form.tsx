"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth/client";

type Mode = "login" | "signup";

const COPY: Record<
  Mode,
  { heading: string; sub: string; submit: string; footPrompt: string; footHref: string; footCta: string }
> = {
  login: {
    heading: "Sign in",
    sub: "Admin emails get Studio access. Everyone else plays and saves scores.",
    submit: "Sign in",
    footPrompt: "No account yet?",
    footHref: "/signup",
    footCta: "Create one",
  },
  signup: {
    heading: "Create account",
    sub: "Admin emails get Studio access. All others join as players.",
    submit: "Create account",
    footPrompt: "Already have access?",
    footHref: "/login",
    footCta: "Sign in",
  },
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();
  const copy = COPY[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<null | "credentials" | "google">(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending("credentials");
    try {
      if (mode === "signup") {
        const res = await authClient.signUp.email({ email, password, name: email.split("@")[0] ?? email });
        if (res.error) throw new Error(res.error.message ?? "Sign up failed");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message ?? "Sign in failed");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    setPending("google");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: next,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="rounded-[--radius-lg] border border-line bg-surface p-6 sm:p-8">
      <Badge variant="mono" className="mb-5">
        Ramp Minigames
      </Badge>

      <h1 className="text-[28px] leading-tight tracking-[-0.02em] text-ink">
        {copy.heading}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">{copy.sub}</p>

      <div className="mt-6">
        <Button
          type="button"
          variant="ink"
          size="lg"
          className="w-full"
          onClick={handleGoogle}
          disabled={busy}
        >
          <GoogleIcon className="size-5" />
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          icon={<Mail className="size-4" />}
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
          disabled={busy}
        />
        <Field
          id="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={setPassword}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          disabled={busy}
        />

        {error && (
          <p role="alert" className="rounded-[--radius-sm] border border-line bg-bg px-3 py-2 text-sm text-blaze">
            {error}
          </p>
        )}

        <Button type="submit" variant="solar" size="lg" className="mt-1 w-full" disabled={busy}>
          {pending === "credentials" ? "Please wait…" : copy.submit}
          {pending !== "credentials" && <ArrowRight />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {copy.footPrompt}{" "}
        <Link href={copy.footHref} className="text-blaze underline-offset-4 hover:underline">
          {copy.footCta}
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  value,
  onChange,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <span className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-ink-muted">{icon}</span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-[--radius-sm] border border-line bg-bg pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-ink/30 focus-visible:ring-2 focus-visible:ring-focus"
          {...props}
        />
      </span>
    </label>
  );
}
