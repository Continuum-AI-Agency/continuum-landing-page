import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { drawSolid, SOLIDS, type SolidName } from "@/lib/polyhedra";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";
type Plan = {
  name: string;
  description: string;
  monthly: number | null; // null = custom pricing
  cta: string;
  featured?: boolean;
  solid: SolidName;
  includes: string;
  features: string[];
};

const ANNUAL_DISCOUNT = 0.2;

const PLANS: Plan[] = [
  {
    name: "Organic+",
    description: "Never let a feed go quiet.",
    monthly: 30,
    cta: "Book a demo",
    solid: "tetrahedron",
    includes: "What's included",
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
    featured: true,
    solid: "octahedron",
    includes: "Everything in Organic+, plus",
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
    solid: "icosahedron",
    includes: "What's included",
    features: [
      "Render templates built from your design system",
      "Variations that inherit from a base template",
      "Every format: 16:9, 1:1, and 9:16",
      "Approved delivery straight into the ad account",
    ],
  },
];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

// The plan's solid: a flat glyph at rest that grows into the shaded, turning solid while the card
// is hovered or focused. It animates only while something changes, then the loop stops.
const SOLID_BOX = 112; // canvas size in CSS px, room for the full solid and its shadow
const REST_R = 13;
const FULL_R = 38;
const TAU = Math.PI * 2;

type SolidControl = { set(active: boolean): void; aim(x: number, y: number): void };

function useSolid(name: SolidName) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const control = useRef<SolidControl>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = el.height = Math.round(SOLID_BOX * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const solid = SOLIDS[name];

    let t = 0, target = 0, spin = 0, ax = 0, ay = 0, aimX = 0, aimY = 0, raf = 0, last = 0;

    const draw = () => {
      const e = 1 - (1 - t) ** 3;
      ctx.clearRect(0, 0, SOLID_BOX, SOLID_BOX);
      drawSolid(ctx, solid, {
        t,
        pitch: e * (0.55 + ay),
        yaw: e * (0.5 + ax) + spin,
        cx: SOLID_BOX / 2,
        cy: SOLID_BOX / 2,
        r: REST_R + (FULL_R - REST_R) * e,
      });
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt * 7);
      t += (target - t) * k;
      ax += (aimX - ax) * k;
      ay += (aimY - ay) * k;
      // Turn while active; on release, ease to the nearest whole turn so it lands on the glyph.
      const home = Math.round(spin / TAU) * TAU;
      spin += target ? dt * 0.7 : (home - spin) * k;
      if (!target && t < 0.002 && Math.abs(home - spin) < 0.002 && Math.abs(ax) + Math.abs(ay) < 0.002) {
        t = spin = ax = ay = 0;
        raf = 0;
        draw();
        return;
      }
      draw();
      raf = requestAnimationFrame(frame);
    };

    control.current = {
      set(active) {
        target = active ? 1 : 0;
        if (!active) aimX = aimY = 0;
        if (reduced) {
          t = target; // no turning or tilting: the solid just appears at a fixed three-quarter view
          draw();
        } else if (!raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      },
      aim(x, y) {
        if (reduced) return;
        aimX = Math.max(-1, Math.min(1, x)) * 0.5;
        aimY = Math.max(-1, Math.min(1, y)) * 0.5;
      },
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [name]);

  const handlers = {
    onPointerEnter: () => control.current?.set(true),
    // A tap fires leave right after enter; keep the solid up on touch.
    onPointerLeave: (e: PointerEvent) => e.pointerType !== "touch" && control.current?.set(false),
    onPointerMove: (e: PointerEvent) => {
      const b = canvas.current?.getBoundingClientRect();
      if (b) control.current?.aim((e.clientX - b.left - b.width / 2) / 200, (e.clientY - b.top - b.height / 2) / 200);
    },
    onFocus: () => control.current?.set(true),
    onBlur: (e: FocusEvent) => !e.currentTarget.contains(e.relatedTarget) && control.current?.set(false),
  };

  return { canvas, handlers };
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const { canvas, handlers } = useSolid(plan.solid);
  const perMonth = plan.monthly === null ? null : billing === "annual" ? plan.monthly * (1 - ANNUAL_DISCOUNT) : plan.monthly;

  return (
    <Card
      {...handlers}
      className={cn(
        "relative gap-6 py-7 transition-colors duration-300 [--card-pad:1.75rem] hover:border-primary/40",
        plan.featured
          ? "border-primary/50 bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--primary)_10%,var(--card)),var(--card)_45%)]"
          : "bg-background",
      )}
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 -right-2"
        style={{ width: SOLID_BOX, height: SOLID_BOX }}
      />
      <CardHeader className="pr-24">
        <h3 className="text-xl font-bold leading-tight tracking-[-0.01em]">{plan.name}</h3>
        <CardDescription className="text-base lg:min-h-[3rem]">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="min-h-[4.5rem] border-b pb-6">
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
                : "Billed monthly. Switch to yearly to save 20%."}
          </p>
        </div>
        <a
          href="#demo"
          className={cn(buttonVariants({ variant: plan.featured ? "cta" : "outline", size: "lg" }), "h-11 w-full text-base")}
        >
          {plan.cta}
        </a>
        <div>
          <p className="text-sm text-muted-foreground">{plan.includes}:</p>
          <ul className="mt-4 flex flex-col gap-3">
            {plan.features.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function PricingSection() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const annual = billing === "annual";

  return (
    <section id="pricing" className="scroll-mt-20 bg-transparent py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-balance font-display text-h2 font-bold text-foreground">Start with one line.</h2>
            <p className="mt-4 max-w-[46ch] text-lead text-muted-foreground">
              Run any plan yourself, or let our team run it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <span className={annual ? "text-muted-foreground" : "text-foreground"}>Monthly</span>
              <Switch
                aria-label="Bill yearly"
                checked={annual}
                onCheckedChange={(on) => setBilling(on ? "annual" : "monthly")}
              />
              <span className={annual ? "text-foreground" : "text-muted-foreground"}>Yearly</span>
            </label>
            <Badge variant="violet" className="text-[var(--cs-violet)]">Save 20%</Badge>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} billing={billing} />
          ))}
        </div>
      </div>
    </section>
  );
}
