import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";
type Plan = {
  name: string;
  description: string;
  monthly: number | null; // null = custom pricing
  cta: string;
  featured?: string;
  features: string[];
};

const ANNUAL_DISCOUNT = 0.2;

const PLANS: Plan[] = [
  {
    name: "Organic+",
    description: "Never let a feed go quiet.",
    monthly: 30,
    cta: "Book a demo",
    features: [
      "Live canvas editor with your brand kit",
      "Posts fitted to Instagram, TikTok, and LinkedIn",
      "Organic agent rewrites and schedules",
      "Post and channel analytics",
    ],
  },
  {
    name: "Performance+",
    description: "Jaina and the Optimizer on your ad accounts.",
    monthly: 300,
    cta: "Book a demo",
    featured: "Includes Organic+",
    features: [
      "Jaina analyzes every connected ad account",
      "Optimizer acts inside guardrails, flags each move",
      "Bigger changes applied only after you approve",
      "Results written back after every cycle",
    ],
  },
  {
    name: "Creative Automation",
    description: "Catalog-scale production from one template.",
    monthly: null,
    cta: "Book a demo",
    features: [
      "Render templates built from your design system",
      "Variations that inherit from a base template",
      "Every format: 16:9, 1:1, and 9:16",
      "Approved delivery straight into the ad account",
    ],
  },
];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function PricingSection() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section id="pricing" className="scroll-mt-20 bg-transparent py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-balance font-display text-h2 font-bold text-foreground">
              Start with one line.
            </h2>
            <p className="mt-4 max-w-[46ch] text-lead text-muted-foreground">
              Run any plan yourself, or let our team run it. Performance+ includes Organic+.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleGroup
              aria-label="Billing period"
              variant="outline"
              value={billing}
              onValueChange={(v) => v && setBilling(v as Billing)}
            >
              <ToggleGroupItem value="monthly" className="px-4">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="annual" className="px-4">Annual</ToggleGroupItem>
            </ToggleGroup>
            <Badge variant="violet" className="text-[var(--cs-violet)]">Save 20%</Badge>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const perMonth = plan.monthly === null ? null : billing === "annual" ? plan.monthly * (1 - ANNUAL_DISCOUNT) : plan.monthly;
            return (
              <Card
                key={plan.name}
                className={cn(
                  "gap-6 py-7 [--card-pad:1.75rem]",
                  plan.featured ? "border-primary bg-card ring-1 ring-primary/40" : "bg-background",
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold leading-tight tracking-[-0.01em]">{plan.name}</h3>
                    {plan.featured && <Badge variant="violet" className="text-[var(--cs-violet)]">{plan.featured}</Badge>}
                  </div>
                  <CardDescription className="text-base lg:min-h-[3rem]">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6">
                  <div className="min-h-[4.5rem]">
                    {perMonth === null ? (
                      <p className="font-display text-5xl font-bold tracking-tight">Custom</p>
                    ) : (
                      <p className="flex items-baseline gap-1.5">
                        <span className="font-display text-5xl font-bold tabular-nums tracking-tight">{usd(perMonth)}</span>
                        <span className="text-muted-foreground">/ month</span>
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {perMonth === null
                        ? "Priced on render volume and templates."
                        : billing === "annual"
                          ? `Billed ${usd(perMonth * 12)} yearly.`
                          : "Billed monthly. Switch to annual to save 20%."}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a
                    href="#demo"
                    className={cn(
                      buttonVariants({ variant: plan.featured ? "cta" : "outline", size: "lg" }),
                      "h-11 w-full text-base",
                    )}
                  >
                    {plan.cta}
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
