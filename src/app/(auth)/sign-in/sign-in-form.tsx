"use client";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { sendCode, verifyCode } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { InlineNotice } from "@/components/ui/states";
import type { Channel } from "@/server/auth/otp";

export function SignInForm({ next, phone }: { next?: string; phone: { countryCode: string; placeholder: string } }) {
  const t = useTranslations("auth");
  const [channel, setChannel] = React.useState<Channel>("phone");
  const [contact, setContact] = React.useState("");
  const [target, setTarget] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | undefined>();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [cooldown, setCooldown] = React.useState(0);
  const codeRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!cooldown) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const send = () =>
    start(async () => {
      setError(null);
      const r = await sendCode(channel, contact);
      if (!r.ok) return setError(r.error);
      setTarget(r.target);
      setDevCode(r.devCode);
      setCooldown(30);
      setTimeout(() => codeRef.current?.focus(), 50);
    });

  const verify = () =>
    start(async () => {
      setError(null);
      const r = await verifyCode(channel, target!, code, next);
      if (r && !r.ok) setError(r.error);
    });

  if (target) {
    return (
      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
      >
        <p className="text-small text-ink-2">
          {t("codeSentTo", { target })}{" "}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setTarget(null); setCode(""); setError(null); }}>
            {t("changeContact")}
          </button>
        </p>
        {devCode && (
          <InlineNotice tone="info" icon={<KeyRound />}>
            {t("devCode", { code: devCode })}
          </InlineNotice>
        )}
        <Field label={t("codeLabel")} htmlFor="code" error={error ? t(`errors.${error}`) : undefined}>
          <Input
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            className="h-14 text-center text-h2 font-semibold tracking-[0.4em] tabular"
            placeholder="••••••"
          />
        </Field>
        <Button type="submit" size="lg" block loading={pending} disabled={code.length !== 6}>
          {t("verify")}
        </Button>
        <div className="text-center text-small">
          <button type="button" onClick={send} disabled={cooldown > 0 || pending} className="font-medium text-primary disabled:text-ink-3">
            {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <Segmented
        className="w-full"
        label={t("title")}
        value={channel}
        onChange={(c) => {
          setChannel(c);
          setContact("");
          setError(null);
        }}
        options={[
          { value: "phone", label: t("phone") },
          { value: "email", label: t("email") },
        ]}
      />
      {channel === "phone" ? (
        <Field label={t("phoneLabel")} htmlFor="contact" error={error ? t(`errors.${error}`) : undefined}>
          <Input
            leading={phone.countryCode}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={phone.placeholder}
            className="h-12 tabular"
          />
        </Field>
      ) : (
        <Field label={t("emailLabel")} htmlFor="contact" error={error ? t(`errors.${error}`) : undefined}>
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className="h-12"
          />
        </Field>
      )}
      <Button type="submit" size="lg" block loading={pending} disabled={!contact.trim()}>
        {t("sendCode")}
      </Button>
      <p className="text-center text-caption text-ink-3">
        {t.rich("terms", {
          terms: (c) => <Link href="/legal/terms" className="underline underline-offset-2 hover:text-ink">{c}</Link>,
          privacy: (c) => <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-ink">{c}</Link>,
        })}
      </p>
    </form>
  );
}
