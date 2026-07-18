"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

const COPY: Record<
  Mode,
  { heading: string; sub: string; submit: string; footPrompt: string; footHref: string; footCta: string }
> = {
  login: {
    heading: "Sign in to the Studio",
    sub: "Feed in a launch and watch an agent build the game.",
    submit: "Sign in",
    footPrompt: "Need an operator account?",
    footHref: "/signup",
    footCta: "Create one",
  },
  signup: {
    heading: "Create your operator console",
    sub: "Operator access is reserved for @ramp.com — everyone else joins as a viewer.",
    submit: "Create account",
    footPrompt: "Already have access?",
    footHref: "/login",
    footCta: "Sign in",
  },
};

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();
  const copy = COPY[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<null | "credentials" | "demo">(null);
  const [error, setError] = useState<string | null>(null);

  async function post(endpoint: string, body: Record<string, unknown>) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      redirect?: string;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? "Something went wrong. Try again.");
    }
    return data.redirect ?? "/studio";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending("credentials");
    try {
      // DEMO: credentials are accepted as-is; the server never checks a password.
      const redirect = await post("/api/auth/login", { email, password, next });
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(null);
    }
  }

  async function handleDemo() {
    setError(null);
    setPending("demo");
    try {
      const redirect = await post("/api/auth/demo", { next });
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="rounded-[--radius-lg] border border-line bg-surface p-6 sm:p-8">
      <Badge variant="mono" className="mb-5">
        For Ramp operators
      </Badge>

      <h1 className="text-[28px] leading-tight tracking-[-0.02em] text-ink">
        {copy.heading}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">{copy.sub}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <Field
          id="email"
          type="email"
          label="Work email"
          placeholder="you@ramp.com"
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
          disabled={busy}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-[--radius-sm] border border-line bg-bg px-3 py-2 text-sm text-blaze"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="solar"
          size="lg"
          className="mt-1 w-full"
          disabled={busy}
        >
          {pending === "credentials" ? "Signing in…" : copy.submit}
          {pending !== "credentials" ? <ArrowRight /> : null}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
          or
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="ink"
        size="lg"
        className="w-full"
        onClick={handleDemo}
        disabled={busy}
      >
        <Zap className={cn(pending === "demo" && "animate-pulse")} />
        {pending === "demo" ? "Entering…" : "Enter as demo operator"}
      </Button>
      <p className="mt-2 text-center text-xs text-ink-muted">
        No password needed — jump straight into the Studio.
      </p>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {copy.footPrompt}{" "}
        <Link
          href={copy.footHref}
          className="text-blaze underline-offset-4 hover:underline"
        >
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
        <span className="pointer-events-none absolute left-3 text-ink-muted">
          {icon}
        </span>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-[--radius-sm] border border-line bg-bg pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-ink/30 focus-visible:ring-2 focus-visible:ring-focus"
          {...props}
        />
      </span>
    </label>
  );
}
