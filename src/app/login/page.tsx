"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 card-elevated"
      >
        <h1 className="text-lg font-semibold text-foreground">Dhanu AI</h1>
        <p className="mt-1 text-xs text-muted-foreground">Private — sign in to continue.</p>

        <div className="mt-5 flex flex-col gap-3">
          <input
            name="username"
            type="text"
            placeholder="Username"
            autoComplete="username"
            required
            className="input"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            className="input"
          />
        </div>

        {state?.error && <p className="mt-3 text-[12px] text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
