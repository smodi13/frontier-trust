import raw from "./link-checks.json";

export type LinkStatus = "accessible" | "redirected" | "restricted" | "broken" | "unchecked";
export const LINK_LABEL: Record<LinkStatus, string> = {
  accessible: "Accessible",
  redirected: "Redirected",
  restricted: "Access restricted / verification inconclusive",
  broken: "Confirmed broken",
  unchecked: "Not checked",
};
export interface LinkCheck { status: LinkStatus; http: number | null; checkedAt: string; finalUrl?: string; error?: string }
export const LINK_CHECKS = raw.results as Record<string, LinkCheck>;
export const LINK_CHECK_METHOD = raw.method;
export const linkCheck = (url: string): LinkCheck => LINK_CHECKS[url] ?? { status: "unchecked", http: null, checkedAt: "" };
