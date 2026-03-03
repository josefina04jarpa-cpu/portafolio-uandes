"use client";

import { useMemo } from "react";

type MailProvider = "gmail" | "outlook";

type Props = {
  email: string;
  subject: string;
  className?: string;
};

const PREFERRED_PROVIDER_KEY = "preferred_mail_provider";

function buildGmailComposeUrl(email: string, subject: string): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: subject,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function buildOutlookComposeUrl(email: string, subject: string): string {
  const params = new URLSearchParams({
    to: email,
    subject,
  });
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

function openInProvider(provider: MailProvider, email: string, subject: string) {
  const url = provider === "outlook" ? buildOutlookComposeUrl(email, subject) : buildGmailComposeUrl(email, subject);
  window.open(url, "_blank", "noopener,noreferrer");
  window.localStorage.setItem(PREFERRED_PROVIDER_KEY, provider);
}

export default function ExecutiveContactButton({ email, subject, className }: Props) {
  const normalizedEmail = String(email || "").trim();
  const normalizedSubject = String(subject || "").trim() || "Consulta";

  const fallbackHref = useMemo(() => `mailto:${normalizedEmail}?subject=${encodeURIComponent(normalizedSubject)}`, [normalizedEmail, normalizedSubject]);

  if (!normalizedEmail) return null;

  return (
    <div className="mt-4 space-y-1.5">
      <button
        type="button"
        onClick={() => {
          const preferred = window.localStorage.getItem(PREFERRED_PROVIDER_KEY);
          const provider: MailProvider = preferred === "outlook" ? "outlook" : "gmail";
          openInProvider(provider, normalizedEmail, normalizedSubject);
        }}
        className={className || "inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"}
      >
        Contactar
      </button>

      <div className="text-[11px] text-gray-500">
        Abrir en{" "}
        <button
          type="button"
          onClick={() => openInProvider("gmail", normalizedEmail, normalizedSubject)}
          className="font-medium text-slate-700 hover:underline"
        >
          Gmail
        </button>
        {" · "}
        <button
          type="button"
          onClick={() => openInProvider("outlook", normalizedEmail, normalizedSubject)}
          className="font-medium text-slate-700 hover:underline"
        >
          Outlook
        </button>
        {" · "}
        <a href={fallbackHref} className="font-medium text-slate-700 hover:underline">
          app de correo
        </a>
      </div>
    </div>
  );
}
