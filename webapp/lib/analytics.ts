import posthog from "posthog-js";

export const POSTHOG_CONSENT_STORAGE_KEY = "posthog-consent";

export type ConsentChoice = "granted" | "denied";

let initialized = false;

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized) return;
  initialized = true;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    opt_out_capturing_by_default: true,
    capture_pageview: false,
  });

  const stored = getStoredConsent();
  if (stored === "granted") posthog.opt_in_capturing();
}

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(POSTHOG_CONSENT_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setConsent(choice: ConsentChoice) {
  window.localStorage.setItem(POSTHOG_CONSENT_STORAGE_KEY, choice);
  if (choice === "granted") {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
}
