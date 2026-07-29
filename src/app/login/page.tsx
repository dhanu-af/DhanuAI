"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">{t("appTitle")}</h1>
          <LanguageToggle />
        </div>
        <p className="mt-1 text-xs text-zinc-500">{t("loginSubtitle")}</p>

        <div className="mt-5 flex flex-col gap-3">
          <input
            name="username"
            type="text"
            placeholder={t("usernamePlaceholder")}
            autoComplete="username"
            required
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-white/[0.16]"
          />
          <input
            name="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-white/[0.16]"
          />
        </div>

        {state?.error && <p className="mt-3 text-[12px] text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-[14px] font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-60"
        >
          {pending ? t("signingIn") : t("signIn")}
        </button>
      </form>
    </div>
  );
}
