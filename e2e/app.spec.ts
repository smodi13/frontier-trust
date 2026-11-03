import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import downloads from "../src/data/downloads.json";

const ROUTES = ["/", "/opportunities", "/companies/vanta", "/companies/chainguard", "/underwriting", "/allocation", "/committee", "/monitoring", "/evidence", "/valuation-evidence"];

for (const path of ROUTES) {
  test(`loads ${path} without errors and passes accessibility`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    expect(errors).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("overview shows computed base-case figures and disclosures", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("conclusion")).toContainText("Neither company clears the illustrative 20% 5-year gross IRR");
  for (const t of ["1.47x", "8.1%", "$2.92B", "1.29x", "5.2%", "$2.02B"]) await expect(page.getByText(t).first()).toBeVisible();
  await expect(page.getByText("Illustrative:").first()).toBeVisible();
});

test("allocation edit persists across refresh and reset restores originals", async ({ page }) => {
  await page.goto("/allocation");
  const pre = page.getByLabel("Pre-money valuation", { exact: true }).first();
  await pre.fill("2000");
  await expect(page.getByTestId("verdict")).toContainText("clears the screen");
  await expect(page.getByText("Assumptions differ from the workbook.")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("verdict")).toContainText("clears the screen");
  await page.getByRole("button", { name: "Reset to original" }).first().click();
  await expect(page.getByTestId("verdict")).toContainText("8.1%");
});

test("corrupt local storage falls back to workbook defaults", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("frontier-trust:model:v1", '{"inputs":{"checkSize":"x","companies":5},"entry":7}'));
  await page.goto("/");
  await expect(page.getByTestId("conclusion")).toContainText("Neither company clears");
  await expect(page.getByText("Workbook assumptions (unmodified)")).toBeVisible();
});

test("opportunities filtering", async ({ page }) => {
  await page.goto("/opportunities");
  await expect(page.getByTestId("count")).toContainText("16 of 16");
  await page.getByLabel("Research region").selectOption("India");
  await expect(page.getByTestId("count")).toContainText("2 of 16");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("searchbox", { name: "Search" }).fill("zzz");
  await expect(page.getByText("No companies match")).toBeVisible();
});

test("underwriting: scenario switch and edit update forecast", async ({ page }) => {
  await page.goto("/underwriting");
  await expect(page.getByRole("cell", { name: "$1,105.7M" }).first()).toBeVisible();
  await page.getByRole("radio", { name: "Chainguard" }).click();
  await expect(page.getByRole("cell", { name: "$755.2M" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "($68.7M)" }).first()).toBeVisible();
});

test("evidence: 18 records, filters, anchors, downloads", async ({ page, request }) => {
  await page.goto("/evidence");
  await expect(page.getByTestId("evidence-count")).toContainText("18 of 18");
  await page.getByLabel("Company / entity").selectOption("Docker");
  await expect(page.getByTestId("evidence-count")).toContainText("2 of 18");
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByLabel("Claim / keyword").fill("Canva");
  await expect(page.getByTestId("evidence-count")).toContainText("1 of 18");
  for (const d of downloads) {
    const res = await request.get(`/downloads/${d.file}`);
    expect(res.status()).toBe(200);
    const buf = await res.body();
    expect(createHash("sha256").update(buf).digest("hex")).toBe(d.sha256);
    expect(createHash("sha256").update(readFileSync(`source-documents/${d.file}`)).digest("hex")).toBe(d.sha256);
  }
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator('a[href$="Frontier_Trust_Formula_Driven_Underwriting.xlsx"]').click()]);
  expect(dl.suggestedFilename()).toBe("Frontier_Trust_Formula_Driven_Underwriting.xlsx");
});

test("citation chip navigates to evidence record", async ({ page }) => {
  await page.goto("/companies/vanta");
  await page.getByRole("link", { name: "Evidence record S03" }).first().click();
  await expect(page).toHaveURL(/\/evidence#S03$/);
  await expect(page.locator("#S03")).toBeVisible();
});

test("monitoring: manual entry is labeled, persists, deletable", async ({ page }) => {
  await page.goto("/monitoring");
  await expect(page.getByText("Update mode: manual.")).toBeVisible();
  const before = await page.getByTestId("event-count").innerText();
  await page.getByLabel("What happened").fill("Hypothetical test note");
  await page.getByRole("button", { name: "Add entry" }).click();
  await expect(page.getByText("Hypothetical test note")).toBeVisible();
  await expect(page.getByText("User-entered").first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Hypothetical test note")).toBeVisible();
  await page.getByRole("button", { name: /Delete entry: Hypothetical/ }).click();
  await expect(page.getByTestId("event-count")).toHaveText(before);
});

test("committee keeps a conditional conclusion and prints", async ({ page }) => {
  await page.goto("/committee");
  await expect(page.getByText("PASS at the hypothetical entry prices")).toBeVisible();
  await expect(page.getByText("conditional").first()).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Print / save as PDF" })).toBeHidden();
});

test("mobile navigation menu works", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "Evidence Center" }).click();
  await expect(page).toHaveURL(/\/evidence/);
});

test("evidence separates original and supplemental records with canonical links", async ({ page }) => {
  await page.goto("/evidence");
  await expect(page.getByTestId("evidence-count")).toContainText("18 of 18 original");
  await expect(page.getByTestId("supplemental-count")).toContainText("3 of 3");
  await expect(page.getByRole("heading", { name: /Original workbook evidence register/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Supplemental public announcements/ })).toBeVisible();
  await expect(page.locator("#S14 a[target=_blank]")).toHaveAttribute("href", "https://www.otpp.com/en-ca/about-us/news-and-insights/2026/ontario-teachers-delivers-total-fund-net-return-in-first-half-of-2026/");
  await expect(page.locator("#S18 a[target=_blank]")).toHaveAttribute("href", "https://www.chainguard.dev/unchained/adopt-hardened-containers-without-changing-your-pipelines-tooling-or-environment");
  for (const [id, slug] of [["X01", "harness"], ["X02", "workspaces"], ["X03", "checks"]]) {
    await expect(page.locator(`#${id} a[target=_blank]`)).toHaveAttribute("href", `https://www.chainguard.dev/unchained/introducing-chainguard-${slug}`);
  }
  await expect(page.getByText("not independent verification").first()).toBeVisible();
  await page.getByLabel("Company / entity").selectOption("Vanta");
  await expect(page.getByTestId("supplemental-count")).toContainText("0 of 3");
});

test("chainguard page and monitoring show the October 2026 announcements", async ({ page }) => {
  await page.goto("/companies/chainguard");
  await expect(page.getByRole("heading", { name: /Supplemental company announcements/ })).toBeVisible();
  await expect(page.getByText("Not evidence of traction.")).toBeVisible();
  await page.goto("/monitoring");
  await expect(page.getByText("Latest dated entry: 2026-10-14")).toBeVisible();
  await page.getByLabel("Origin").selectOption("supplemental");
  await expect(page.getByTestId("event-count")).toContainText("3 of");
  await expect(page.getByText("isolated microVM-based development environments")).toBeVisible();
});

test("model limitations appear on underwriting and committee", async ({ page }) => {
  for (const path of ["/underwriting", "/committee"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Model limitations and transaction structure" })).toBeVisible();
    await expect(page.getByText("not a Teachers' Venture Growth (TVG) requirement")).toBeVisible();
    await expect(page.getByText(/liquidation waterfalls are excluded/)).toBeVisible();
  }
});

test("editing assumptions shows the static-downloads notice; originals stay byte-identical", async ({ page, request }) => {
  await page.goto("/allocation");
  await expect(page.getByText("Downloads have not changed.")).toHaveCount(0);
  await page.getByLabel("Pre-money valuation", { exact: true }).first().fill("3000");
  await expect(page.getByText("Downloads have not changed.").first()).toBeVisible();
  await expect(page.getByText(/does not update from website inputs/).first()).toBeVisible();
  for (const d of downloads) {
    const buf = await (await request.get(`/downloads/${d.file}`)).body();
    expect(createHash("sha256").update(buf).digest("hex")).toBe(d.sha256);
  }
});

test("valuation evidence: eight peers, calculated median, disclosures, links", async ({ page }) => {
  await page.goto("/valuation-evidence");
  await expect(page.locator('nav a[href="/valuation-evidence"]').first()).toBeAttached();
  await expect(page.locator("#comps tbody tr")).toHaveCount(8);
  for (const t of ["RPD", "TENB", "S", "VRNS", "QLYS", "OKTA", "ZS", "CRWD"]) await expect(page.locator(`#peer-${t}`)).toBeVisible();
  await expect(page.locator("#peer-QLYS")).toContainText("9.29x");
  await expect(page.getByTestId("peer-stats")).toContainText("8.44x");
  await expect(page.getByText("EV / revenue is not EV / ARR.")).toBeVisible();
  await expect(page.getByText("Raw quotients are not exit multiples.")).toBeVisible();
  await expect(page.getByText("MISMATCH: 2025 valuation / 2026 ARR")).toBeVisible();
  await expect(page.getByText("BOUND ONLY").first()).toBeVisible();
  await expect(page.getByText("Equity financing valuation (post-money)").first()).toBeVisible();
  await expect(page.getByText("Acquisition price (M&A)")).toBeVisible();
  await expect(page.locator("#peer-ZS a[target=_blank]").first()).toHaveAttribute("href", "https://stockanalysis.com/stocks/zs/statistics/");
  // reverse underwriting values match the extension workbook
  const rev = page.locator("#reverse");
  await expect(rev).toContainText("13.50x");
  await expect(rev).toContainText("17.15x");
  await expect(rev).toContainText("$1,866.2M");
  await expect(rev).toContainText("9.2%");
  await expect(rev).toContainText("3.8%");
  await expect(rev).toContainText("($68.7M)");
  await expect(page.getByText("Investment conclusion unchanged.")).toBeVisible();
});

test("valuation evidence recalculates when assumptions change", async ({ page }) => {
  await page.goto("/allocation");
  await page.getByLabel("Pre-money valuation", { exact: true }).first().fill("3000");
  await page.goto("/valuation-evidence");
  const rev = page.locator("#reverse");
  await expect(rev).not.toContainText("13.50x");
  await expect(rev).toContainText("Assumptions modified.");
  await expect(page.getByText("Downloads have not changed.").first()).toBeVisible();
  await page.goto("/underwriting");
  await page.getByLabel("First-year ARR growth (2027)").fill("60");
  await page.goto("/valuation-evidence");
  await expect(page.locator("#peer-QLYS")).toContainText("9.29x"); // public inputs stay fixed
  await expect(page.getByTestId("peer-stats")).toContainText("8.44x");
});

test("extension workbook download is available and distinct from the original", async ({ page, request }) => {
  await page.goto("/valuation-evidence");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /Download extension workbook/ }).click()]);
  expect(dl.suggestedFilename()).toBe("Frontier_Trust_Underwriting_With_Market_Comparables.xlsx");
  await page.goto("/evidence");
  await expect(page.getByText("Research extension · separate from the original workbook")).toBeVisible();
  await expect(page.getByRole("link", { name: /Download XLSX/ })).toHaveCount(2);
  expect((await request.get("/downloads/Frontier_Trust_Formula_Driven_Underwriting.xlsx")).status()).toBe(200);
});

test("evidence center lists V01–V18 with link-check classifications", async ({ page }) => {
  await page.goto("/evidence");
  await expect(page.getByTestId("valuation-count")).toContainText("18 of 18");
  for (const id of ["V01", "V02", "V09", "V17", "V18"]) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator("#V08")).toContainText("Not established");
  await expect(page.locator("#V18")).toContainText("2026-03-11");
  await expect(page.locator("#V08 [data-link-status=restricted]")).toContainText("Access restricted / verification inconclusive (HTTP 403)");
  await expect(page.locator("#V01 [data-link-status=accessible]")).toContainText("Accessible");
  await expect(page.locator("#S01")).toBeVisible(); // originals intact
  await expect(page.getByText(/neither verified nor shown to be broken/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Valuation Evidence" }).first()).toBeVisible();
  await page.getByLabel("Company / entity").selectOption("Okta");
  await expect(page.getByTestId("valuation-count")).toContainText("2 of 18");
});

test("valuation figures cross-link to V-series records; Rapid7 caveat is explicit", async ({ page }) => {
  await page.goto("/valuation-evidence");
  await expect(page.getByTestId("caveat-RPD")).toContainText("Different metrics and periods");
  await expect(page.getByTestId("caveat-RPD")).toContainText("$824M");
  await expect(page.getByTestId("caveat-RPD")).toContainText("trailing-twelve-month revenue growth");
  await page.locator("#peer-TENB").getByRole("link", { name: "Evidence record V03" }).first().click();
  await expect(page).toHaveURL(/\/evidence#V03$/);
  await expect(page.locator("#V03")).toBeVisible();
  await page.goto("/valuation-evidence");
  await expect(page.getByTestId("deal-Wiz-2026-03-11").getByRole("link", { name: "Evidence record V17" })).toBeVisible();
  await expect(page.getByTestId("deal-Vanta-2025-07-23").getByRole("link", { name: "Evidence record S03" })).toBeVisible();
  await expect(page.locator("#reverse")).toContainText("13.50x");
});

test("valuation page reachable by direct and client-side navigation, desktop and mobile", async ({ page }) => {
  const compact = (page.viewportSize()?.width ?? 0) < 1024; // sidebar collapses to the Menu button below 1024px
  await page.goto("/");
  await page.evaluate(() => { (window as unknown as { __marker: number }).__marker = 1; });
  if (compact) await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: /Valuation Evidence/ }).first().click();
  await expect(page).toHaveURL(/\/valuation-evidence$/);
  await expect(page.getByRole("heading", { level: 1, name: "Valuation Evidence" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1); // no full reload
  await page.goto("/evidence");
  await page.getByRole("link", { name: "Valuation Evidence" }).first().click();
  await expect(page).toHaveURL(/\/valuation-evidence$/);
  const res = await page.goto("/valuation-evidence");
  expect(res?.status()).toBe(200);
});

test("canonical S14 and S18 links render in the page", async ({ page }) => {
  await page.goto("/evidence");
  await expect(page.locator("#S14 a[target=_blank]")).toHaveAttribute("href", "https://www.otpp.com/en-ca/about-us/news-and-insights/2026/ontario-teachers-delivers-total-fund-net-return-in-first-half-of-2026/");
  await expect(page.locator("#S18 a[target=_blank]")).toHaveAttribute("href", "https://www.chainguard.dev/unchained/adopt-hardened-containers-without-changing-your-pipelines-tooling-or-environment");
});
