import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Pause, Settings, Wallet, Zap, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Creative, Pilot, ProductWindow, RunItCta, Tween, Typed, useAutoplay, wait, type Photo } from "./shared";
import { cn } from "@/lib/utils";

// ── Sample data (Aurel Audio on Meta) ───────────────────────────────────────
// Daily CPA, Sep 8 to Sep 21. The Optimizer projects one cycle ahead, never a week.
const CPA = [16.9, 17.1, 16.8, 17.2, 16.6, 16.9, 17.0, 17.4, 17.9, 18.2, 18.5, 18.9, 19.6, 18.7];
const NEXT = 17.9;
const TARGET = 16;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const RISE = Math.round((avg(CPA.slice(7)) / avg(CPA.slice(0, 7)) - 1) * 100);
const day = (i: number) => `Sep ${8 + i}`;
// Plot space: 0..100 both ways, the next cycle one slot past today.
const x = (i: number) => 2 + (i / CPA.length) * 96;
const y = (v: number) => ((20 - v) / (20 - 14)) * 100;
const TODAY = CPA.length - 1;

// The app's pin kinds (CpaHeroTimeline EVENT_STYLE): the pin and its tooltip share glyph and colour.
type Kind = "cycle" | "applied" | "status" | "config";
const KIND: Record<Kind, { Icon: LucideIcon; color: string; label: string }> = {
  cycle: { Icon: Zap, color: "var(--chart-4)", label: "Cycle" },
  applied: { Icon: Wallet, color: "var(--success)", label: "Applied" },
  status: { Icon: Pause, color: "var(--warning)", label: "Status" },
  config: { Icon: Settings, color: "var(--chart-3)", label: "Setting" },
};

// Both moves are over the 20% cap, so Autopilot holds them for a person.
const ROWS = [
  { name: "Lookalike · Buyers 2%", id: "120211…3907", from: 380, to: 290 },
  { name: "Retargeting · 30 days", id: "120211…4412", from: 260, to: 350 },
  { name: "Prospecting · Broad", id: "120211…2870", from: 420, to: 420 },
];
const MOVES = ROWS.slice(0, 2);
const usd = (v: number) => `$${Math.round(v)}`;
const change = (r: (typeof ROWS)[number]) => ((r.to - r.from) / r.from) * 100;
const signed = (p: number) => `${p > 0 ? "+" : "−"}${Math.abs(p).toFixed(1)}%`;
// What request_optimizer_budget_apply would actually be called with.
const INPUT: Record<string, unknown> = {
  portfolio_id: "4b1f…e07a",
  run_id: "9c2d…51b3",
  items: MOVES.map((r) => ({ adset_id: r.id, adset_name: r.name, current_budget: r.from, proposed_budget: r.to })),
  summary: "Move $90/day from Lookalike into Retargeting",
};

const Q1 = "Why did CPA rise this week?";
const Q2 = "What should we change?";
const A1 = `CPA is up ${RISE}%. Lookalike · Buyers 2% drives it: new ads aren't arriving as fast as old ones tire. The Optimizer's read flagged it this morning.`;
const A2 =
  "Move $90/day from Lookalike into Retargeting. Autopilot held it because both changes are over your 20% cap, so it needs a person. For the tired creative, three new Forge ads are waiting in Lookalike, paused. Lookalike runs lower until they're live.";

type Step = "idle" | "why" | "read" | "what" | "awaiting" | "applying" | "approved" | "declined";
type Item = { id: number; role: "user" | "jaina" | "think"; text: string; card?: "read" | "approval"; done?: boolean; tools?: number };

/** The app's Pill: a rounded-full badge with a status dot. */
const Pill = ({ variant, dot, children }: { variant: "success" | "secondary" | "muted"; dot: string; children: ReactNode }) => (
  <Badge variant={variant} className="gap-1.5 text-2xs">
    <span aria-hidden="true" className={cn("size-2 rounded-full", dot)} />
    {children}
  </Badge>
);

// SparkleSpinner's braille frames, one every 150 ms; static under reduced motion.
const FRAMES = ["⡡⠊⢔⠡", "⠊⡰⡡⡘", "⢔⢅⠈⢢", "⡁⢂⠆⡍", "⢔⠨⢑⢐", "⠨⡑⡠⠊"];

/** ThinkingWindow's header row: spinner, "Thinking…", the tool being pulled, then the tally. */
function Thinking({ item }: { item: Item }) {
  const reduce = useReducedMotion();
  const [f, setF] = useState(0);
  useEffect(() => {
    if (item.done || reduce) return;
    const id = setInterval(() => setF((i) => (i + 1) % FRAMES.length), 150);
    return () => clearInterval(id);
  }, [item.done, reduce]);
  return (
    <div className="flex items-center gap-2.5 px-1 text-sm text-muted-foreground">
      <span aria-hidden="true" className={cn("font-mono text-base leading-none text-foreground/60", item.done && "opacity-40")}>
        {FRAMES[f]}
      </span>
      {item.done ? (
        <>
          <span className="flex-1 font-medium">{item.text}</span>
          <Badge variant="secondary" className="px-1.5 text-2xs">
            {item.tools} tool{item.tools === 1 ? "" : "s"}
          </Badge>
        </>
      ) : (
        <>
          <Shimmer as="span" className="shrink-0 text-sm font-medium" duration={1.6}>
            Thinking…
          </Shimmer>
          <motion.span
            key={item.text}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-0 truncate rounded-full bg-muted px-2 py-0.5 text-2xs"
          >
            {item.text}
          </motion.span>
        </>
      )}
    </div>
  );
}

/** A cited Optimizer card (OptimizerCardBlock, size "card") with its two-rate chart. */
function ReadCard() {
  const line = (pts: number[]) => pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${100 - v * 18}`).join(" ");
  return (
    <figure className="mt-2.5 overflow-hidden rounded-lg border border-border/60 bg-background">
      <div className="grid items-center gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_112px]">
        <div className="min-w-0 space-y-0.5">
          <p className="font-mono text-2xs text-muted-foreground">creative_supply</p>
          <p className="text-sm font-semibold leading-snug">Creatives die faster than they arrive</p>
          <p className="text-xs text-muted-foreground">New creatives per week against the rate at which they fatigue</p>
        </div>
        <div className="space-y-1">
          <svg aria-hidden="true" className="h-10 w-full" preserveAspectRatio="none" viewBox="0 -4 100 108">
            <polyline points={line([3, 4, 4, 5])} fill="none" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.5" className="text-muted-foreground" vectorEffect="non-scaling-stroke" />
            <polyline points={line([3, 3, 2, 2])} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" vectorEffect="non-scaling-stroke" />
          </svg>
          <p className="flex justify-between text-2xs text-muted-foreground">
            <span><span className="inline-block h-0.5 w-3 bg-primary align-middle" /> new</span>
            <span><span className="inline-block h-0.5 w-3 bg-muted-foreground align-middle" /> fatiguing</span>
          </p>
        </div>
      </div>
      <figcaption className="border-t border-border/60 bg-muted/30 px-3 py-1.5 text-2xs text-muted-foreground">read of Sep 21</figcaption>
    </figure>
  );
}

/** JainaToolApprovalCard + ApprovalChangeTable, on the agentCardKit decision surface. */
function ApprovalCard({ step, onDecide }: { step: Step; onDecide: (ok: boolean) => void }) {
  const [label, tone, dot] =
    step === "applying"
      ? ["Approved", "text-amber-600", "bg-amber-500 animate-pulse motion-reduce:animate-none"]
      : step === "approved"
      ? ["Approved", "text-emerald-600", "bg-emerald-500"]
      : step === "declined"
        ? ["Declined — nothing ran", "text-muted-foreground", "bg-muted-foreground/40"]
        : ["Awaiting your approval", "text-amber-600", "bg-amber-500"];
  return (
    <div className="rounded-lg border border-border/50 bg-card/80 p-3 text-sm">
      <div className="flex items-center justify-between gap-3 text-xs font-medium">
        <span className="text-muted-foreground">Approval required</span>
        <span className={cn("flex items-center gap-1.5", tone)}>
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot)} />
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-base font-semibold leading-snug">Request budget apply</p>
      <div className="mt-2.5 rounded-md border border-border/50 bg-muted/20 px-1 py-1.5">
        <Table className="caption-top text-xs">
          <TableCaption className="mt-0 mb-1.5 px-2 text-left text-xs text-foreground/80">Daily budget on 2 ad sets</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["Field", "Before", "After"].map((h) => (
                <TableHead key={h} className="h-7 px-2 text-xs">{h}</TableHead>
              ))}
              <TableHead className="h-7 px-2 text-right text-xs">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOVES.map((r) => (
              <TableRow key={r.name} className="hover:bg-transparent">
                <TableCell className="whitespace-normal px-2 py-1.5 font-mono text-muted-foreground">{r.name}</TableCell>
                <TableCell className="px-2 py-1.5 tabular-nums text-muted-foreground">{usd(r.from)}</TableCell>
                <TableCell className="px-2 py-1.5 font-medium tabular-nums">{usd(r.to)}</TableCell>
                <TableCell className={cn("px-2 py-1.5 text-right tabular-nums", change(r) > 0 ? "text-emerald-600" : "text-rose-600")}>
                  {signed(change(r))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* The table summarises; this list IS the call, so it collapses but never leaves. */}
      <details className="mt-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2">
        <summary className="cursor-pointer rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Exact input
        </summary>
        <dl className="mt-2 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1.5 font-mono text-xs leading-5">
          {Object.entries(INPUT).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 break-words">{typeof v === "string" ? v : JSON.stringify(v)}</dd>
            </div>
          ))}
        </dl>
      </details>
      {step === "awaiting" && (
        <div className="mt-3 flex justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-h-9 px-3.5 text-sm text-muted-foreground" onClick={() => onDecide(false)}>
            Deny
          </Button>
          <Button size="sm" className="min-h-9 px-3.5 text-sm" onClick={() => onDecide(true)}>
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

/** CPA by hand, the way AccountChartView draws: actual line, one-cycle projection, the target band,
 *  and the cycles where the Optimizer acted pinned to the axis as real buttons. */
function CpaChart({ approved }: { approved: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const pins: { i: number; kind: Kind; text: string }[] = [
    { i: 4, kind: "applied", text: "Autopilot moved $40/day from Prospecting into Retargeting (+18%), inside your 20% cap." },
    approved
      ? { i: TODAY, kind: "applied", text: "You approved the 2 held moves: $90/day from Lookalike into Retargeting." }
      : { i: TODAY, kind: "cycle", text: "2 moves held for your approval." },
  ];
  const band = "color-mix(in oklch, var(--success) 55%, transparent)";
  return (
    <>
      <div className="relative mx-4 mt-2 h-24 sm:h-32">
        <svg aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <pattern id="pf-target" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" strokeWidth="1.25" style={{ stroke: "color-mix(in oklch, var(--success) 22%, transparent)" }} />
            </pattern>
          </defs>
          <rect x="0" y={`${y(TARGET)}%`} width="100%" height={`${100 - y(TARGET)}%`} fill="url(#pf-target)" strokeDasharray="4 3" style={{ stroke: band }} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" className="overflow-visible">
            {pins.map((p) => (
              <line key={p.i} x1={x(p.i)} x2={x(p.i)} y1={0} y2={100} stroke={KIND[p.kind].color} strokeDasharray="2 3" strokeOpacity={0.45} vectorEffect="non-scaling-stroke" />
            ))}
            <polyline points={CPA.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="var(--chart-2)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polyline points={`${x(TODAY)},${y(CPA[TODAY])} ${x(TODAY + 1)},${y(NEXT)}`} fill="none" stroke="var(--chart-4)" strokeWidth="2" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
          </svg>
        </svg>
        <span className="absolute top-0 left-0 text-2xs text-muted-foreground">$20</span>
        <span className="absolute left-1 text-2xs font-medium" style={{ top: `calc(${y(TARGET)}% + 2px)`, color: "var(--success)" }}>
          $16 target
        </span>
        {pins.map((p) => {
          const k = KIND[p.kind];
          return (
            <div key={p.i} className="absolute bottom-0 -translate-x-1/2 translate-y-1/2" style={{ left: `${x(p.i)}%` }}>
              <button
                type="button"
                aria-label={`${day(p.i)}, ${k.label}: ${p.text}`}
                onMouseEnter={() => setOpen(p.i)}
                onMouseLeave={() => setOpen(null)}
                onFocus={() => setOpen(p.i)}
                onBlur={() => setOpen(null)}
                onClick={() => setOpen(p.i)}
                onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
                className="grid size-5 cursor-pointer place-items-center rounded-full border-2 bg-card outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                style={{ borderColor: k.color, color: k.color }}
              >
                <k.Icon aria-hidden="true" className="size-2.5" />
              </button>
              {open === p.i && (
                <div
                  role="tooltip"
                  className={cn(
                    "absolute bottom-full z-10 mb-2 w-56 rounded-lg border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-md",
                    x(p.i) > 50 ? "-right-2" : "-left-2",
                  )}
                >
                  <p className="flex items-center justify-between font-medium" style={{ color: k.color }}>
                    <span className="flex items-center gap-1.5"><k.Icon aria-hidden="true" className="size-3" />{k.label}</span>
                    <span className="font-normal text-muted-foreground">{day(p.i)}</span>
                  </p>
                  <p className="mt-1 leading-snug text-muted-foreground">{p.text}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mx-4 mt-3 flex justify-between text-2xs text-muted-foreground">
        <span>{day(0)}</span>
        <span>Next cycle</span>
      </p>
      <div className="mx-4 mt-1.5 hidden flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground sm:flex">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full bg-chart-2" />CPA actual</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-chart-4" />Projected</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] border border-dashed" style={{ borderColor: band, background: "color-mix(in oklch, var(--success) 18%, transparent)" }} />
          On target
        </span>
        {Object.values(KIND).map((k) => (
          <span key={k.label} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full border" style={{ borderColor: k.color }} />
            {k.label}
          </span>
        ))}
      </div>
    </>
  );
}

export function PerformanceDemo({ photos = [] }: { photos?: Photo[] }) {
  const [step, setStep] = useState<Step>("idle");
  const [items, setItems] = useState<Item[]>([
    { id: 0, role: "jaina", text: "I'm reading Aurel Audio's Meta account. Ask what changed, or what to change.", done: true },
  ]);
  const nextId = useRef(1);
  const typing = useRef<Record<number, () => void>>({});
  // Suggestions and the approval buttons remove themselves on click; park focus on the log.
  const logRef = useRef<HTMLDivElement>(null);
  const keepFocus = () => logRef.current?.focus({ preventScroll: true });

  const push = (m: Omit<Item, "id">) => {
    const id = nextId.current++;
    setItems((all) => [...all, { ...m, id }]);
    return id;
  };
  const patch = (id: number, m: Partial<Item>) => setItems((all) => all.map((it) => (it.id === id ? { ...it, ...m } : it)));
  // Resolves once Jaina's reply has finished typing.
  const say = (text: string, card?: Item["card"]) =>
    new Promise<void>((done) => {
      typing.current[push({ role: "jaina", text, card })] = done;
    });
  const think = async (stages: string[], secs: number) => {
    const id = push({ role: "think", text: stages[0] });
    for (const s of stages.slice(1)) {
      await wait(600);
      patch(id, { text: s });
    }
    await wait(600);
    patch(id, { text: `Thought for ${secs}s`, done: true, tools: stages.length });
  };

  // `auto` is the autoplay asking for the visitor: it never moves their focus.
  const ask = async (q: string, auto = false) => {
    if (!auto) keepFocus();
    push({ role: "user", text: q });
    if (q === Q1) {
      setStep("why");
      await think(["Pulling get key metrics", "Pulling get campaign daily trends", "Pulling get optimizer account read"], 2);
      await say(A1, "read");
      setStep("read");
    } else {
      setStep("what");
      await think(["Pulling preview optimizer cycle"], 1);
      await say(A2, "approval");
      setStep("awaiting");
    }
  };

  const decide = async (ok: boolean) => {
    keepFocus();
    if (!ok) {
      setStep("declined");
      await say("Nothing ran; the account is unchanged.");
      return;
    }
    // As in the app: the approval only records the sign-off, then a second tool makes the Meta write.
    setStep("applying");
    await think(["Running apply approved optimizer budgets"], 1);
    setStep("approved");
    await say("Applied. Lookalike is $290/day, Retargeting $350/day. Total spend unchanged. It's logged and you can revert it.");
  };

  // In view, Jaina answers both questions and stops at the approval card: the sign-off stays with the visitor.
  const windowRef = useRef<HTMLDivElement>(null);
  useAutoplay(windowRef, async (alive) => {
    await wait(800);
    if (!alive()) return;
    await ask(Q1, true);
    await wait(2400);
    if (!alive()) return;
    await ask(Q2, true);
  });

  const approved = step === "approved";
  const settled = items.at(-1)?.done;
  const suggestion = step === "idle" ? Q1 : step === "read" ? Q2 : null;
  const photo = photos.find((p) => p.key === "headphones") ?? photos[0];

  return (
    <ProductWindow ref={windowRef} path={["Continuum", "Performance+", "Jaina"]}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:divide-x lg:divide-border">
        {/* Jaina */}
        <div className="flex h-[400px] flex-col lg:h-[560px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs">
            <span className="font-medium">Jaina</span>
            <span className="text-muted-foreground">Aurel Audio · Meta</span>
          </div>
          <Conversation className="flex-1">
            <ConversationContent ref={logRef} tabIndex={-1} className="gap-3 p-3 outline-none md:px-3 lg:px-3" aria-live="polite">
              {items.map((m) =>
                m.role === "think" ? (
                  <Thinking key={m.id} item={m} />
                ) : (
                  <div key={m.id} className="flex flex-col gap-3">
                    <Message role={m.role === "user" ? "user" : "assistant"}>
                      {m.role === "jaina" && !m.done ? (
                        <Typed
                          text={m.text}
                          onDone={() => {
                            patch(m.id, { done: true });
                            typing.current[m.id]?.();
                          }}
                        />
                      ) : (
                        m.text
                      )}
                      {m.card === "read" && m.done && <ReadCard />}
                    </Message>
                    {m.card === "approval" && m.done && <ApprovalCard step={step} onDecide={decide} />}
                  </div>
                ),
              )}
            </ConversationContent>
          </Conversation>
          <div className="flex min-h-13 flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
            {suggestion ? (
              <Suggestion suggestion={suggestion} onClick={(q) => void ask(q)} />
            ) : (approved || step === "declined") && settled ? (
              <RunItCta />
            ) : step === "awaiting" ? (
              <RunItCta pending />
            ) : (
              <p className="text-xs text-muted-foreground">Jaina is working…</p>
            )}
          </div>
        </div>

        {/* Optimizer */}
        <div className="flex flex-col border-t border-border lg:h-[560px] lg:border-t-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="mr-1 text-xs font-medium">Optimizer</span>
            <Pill variant="success" dot="bg-success">Autopilot</Pill>
            <span className="text-2xs text-muted-foreground">budget moves only</span>
            <Pilot />
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 pt-2.5 text-xs text-muted-foreground">
            <span className="hidden text-2xs sm:inline">Max change 20% per cycle · Total daily budget cap $1,200</span>
            <span>
              Projected CPA next cycle:{" "}
              <span className="font-medium tabular-nums text-foreground">
                ${CPA[TODAY].toFixed(2)} → ${NEXT.toFixed(2)}
              </span>
            </span>
          </div>
          <CpaChart approved={approved} />
          {/* On a phone the table carries the move; the caption returns from sm up. */}
          <div className="mx-4 mt-3 hidden rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 sm:block">
            <p className="text-xs font-semibold tracking-tight">
              {approved ? "Moved" : "Moving"} <span className="tabular-nums">$90/day</span> from Lookalike · Buyers 2% into Retargeting · 30 days
            </p>
            <p className="mt-0.5 text-2xs text-muted-foreground">Total daily spend unchanged.</p>
          </div>
          <div className="mt-auto border-t border-border pt-1 lg:mt-3">
            <Table className="table-fixed text-xs">
              <colgroup>
                <col />
                <col className="w-24" />
                <col className="hidden w-16 sm:table-column" />
                <col className="w-36" />
              </colgroup>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 pl-4">Ad set</TableHead>
                  <TableHead className="h-8">Daily budget</TableHead>
                  <TableHead className="hidden h-8 text-right sm:table-cell">Change</TableHead>
                  <TableHead className="h-8 pr-4">State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((r) => {
                  const moves = r.from !== r.to;
                  return (
                    <TableRow key={r.name} className={cn("h-8 sm:h-9", approved && moves && "pf-row-flash")}>
                      <TableCell className="truncate pl-4 font-medium">{r.name}</TableCell>
                      <TableCell className="tabular-nums">
                        <Tween value={approved ? r.to : r.from} format={usd} />
                        {moves && !approved && <span className="text-muted-foreground"> → {usd(r.to)}</span>}
                      </TableCell>
                      <TableCell className={cn("hidden text-right tabular-nums sm:table-cell", !moves ? "text-muted-foreground" : change(r) > 0 ? "text-emerald-600" : "text-rose-600")}>
                        {moves ? signed(change(r)) : "–"}
                      </TableCell>
                      <TableCell className="pr-4">
                        {!moves ? (
                          <Pill variant="muted" dot="bg-muted-foreground/40">No change</Pill>
                        ) : approved ? (
                          <Pill variant="success" dot="bg-success">Applied</Pill>
                        ) : (
                          <Pill variant="secondary" dot="bg-warning">Held for approval</Pill>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-3 border-t border-border px-4 py-2">
            {photo && (
              <Creative photo={photo} headline="Hear the drop." brand="#5a48f9" format="1:1" pos={{ x: 7, y: 56 }} className="w-11 shrink-0 rounded" />
            )}
            <p className="min-w-0 flex-1 text-xs">
              <span className="font-medium">Forge</span> · 3 new ads in Lookalike · Buyers 2%
            </p>
            <Pill variant="muted" dot="bg-warning">Paused</Pill>
            <Pilot />
          </div>
        </div>
      </div>
    </ProductWindow>
  );
}
