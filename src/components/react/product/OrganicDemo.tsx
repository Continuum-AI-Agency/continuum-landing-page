import { Fragment, useEffect, useRef, useState } from "react";
import { Bookmark, Check, Heart, Lightbulb, MessageCircle, MessageSquare, Repeat2 } from "lucide-react";
import { Search, SearchCheck, Send, Share2, Sparkles, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Creative, EASE, ProductWindow, RunItCta, Tween, Typed, useAutoplay, wait, type Format, type Photo } from "./shared";
import { cn } from "@/lib/utils";

type Platform = "instagram" | "facebook" | "linkedin" | "tiktok" | "youtube";
type Status = "streaming" | "draft" | "scheduled";
type Phase = "idle" | "proposing" | "proposed" | "writing" | "drafted";
type Draft = { id: string; day: number; platforms: Platform[]; time: string; title: string; caption: string; photo: number; score: number };
type Msg = { id: number; role: "user" | "assistant"; text: string; card?: "trends" | "aeo" };

// ── Sample week (one brand across all three demos: Aurel Audio) ─────────────
const BRAND = "Aurel Audio";

// lib/organic/postPlatforms.ts. Key order is the preview switch's order.
const PLATFORMS: Record<Platform, { label: string; abbr: string; color: string; frame: "phone" | "feed" | "desktop" | "vertical"; format: Format }> = {
  instagram: { label: "Instagram", abbr: "IG", color: "#E1306C", frame: "phone", format: "1:1" },
  facebook: { label: "Facebook", abbr: "FB", color: "#1877F2", frame: "feed", format: "1:1" },
  linkedin: { label: "LinkedIn", abbr: "LI", color: "#0A66C2", frame: "desktop", format: "1.91:1" },
  tiktok: { label: "TikTok", abbr: "TT", color: "#69C9D0", frame: "vertical", format: "9:16" },
  youtube: { label: "YouTube", abbr: "YT", color: "#FF0000", frame: "vertical", format: "9:16" },
};
const ALL = Object.keys(PLATFORMS) as Platform[];
// The planner's own row order (DISPLAY_PLATFORM_ORDER in planner-platforms.tsx).
const ROWS: Platform[] = ["instagram", "linkedin", "facebook", "youtube", "tiktok"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY = 1;
const THU = 3;

const POSTED = [
  { day: 0, platform: "instagram", time: "9 AM", title: "Studio session, unplugged" },
  { day: 1, platform: "linkedin", time: "8 AM", title: "Why we built for long sessions" },
] as const;

const DRAFTS: Draft[] = [
  { id: "tue", day: 1, platforms: ["instagram"], time: "6 PM", title: "30 hours, one charge", caption: "Charged Monday. Still playing Wednesday.", photo: 1, score: 71 },
  { id: "wed", day: 2, platforms: ["linkedin"], time: "9 AM", title: "How we tuned the low end", caption: "Three engineers, forty prototypes, one bass curve.", photo: 0, score: 52 },
  { id: "thu", day: THU, platforms: ALL, time: "7 PM", title: "Hear the drop.", caption: "Studio sound, all-day battery. The new line is live.", photo: 0, score: 78 },
  { id: "fri", day: 4, platforms: ["tiktok"], time: "8 AM", title: "Commute test: zero to drop", caption: "Train noise in, bass out. Watch the meter.", photo: 2, score: 64 },
  { id: "sat", day: 5, platforms: ["youtube"], time: "11 AM", title: "Unboxed in 60 seconds", caption: "Everything in the box, nothing you don't need.", photo: 0, score: 61 },
  { id: "sun", day: 6, platforms: ["facebook"], time: "5 PM", title: "Swap your weekend playlist", caption: "Drop the one song you test new headphones with.", photo: 1, score: 47 },
];
const PIECES = DRAFTS.reduce((n, d) => n + d.platforms.length, 0);
const COVERED_DAYS = new Set(DRAFTS.map((d) => d.day)).size;

// ORGANIC_PHASE_PRESENTATION (contracts/streaming/organic.ts), rendered as draft-card-styles.ts does.
const STATUS = {
  streaming: { pill: "Generating", label: "Generating", badge: "warning" },
  draft: { pill: "Draft", label: "Draft ready", badge: "muted" },
  scheduled: { pill: "Scheduled", label: "Scheduled", badge: "teal" },
} as const;

// contracts/virality/score.ts bands, ViralityScoreBadge colours.
const grade = (s: number) => (s >= 85 ? "viral" : s >= 60 ? "strong" : s >= 35 ? "okay" : "weak");
const GRADE = {
  weak: "bg-muted text-muted-foreground",
  okay: "bg-amber-500/15 text-amber-600",
  strong: "bg-orange-500/15 text-orange-600",
  viral: "bg-rose-500/15 text-rose-600",
};

const STAGES = ["Plan", "Generate", "Review", "Schedule"];

// OrganicAgentPanel.tsx STARTER_PROMPTS.
const PROMPTS = ["Plan this week's posts", "Run an AEO snapshot", "Show me trending topics", "Draft an Instagram reel"];
const SIGNALS = [
  ["Commute noise-cancelling comparisons", "Trend · tiktok · 82% · 7d"],
  ["Holiday gift guides open early", "Event · instagram · 71% · 30d"],
  ["Are studio headphones good for travel?", "Question · youtube · 66% · 30d"],
];

// ── Planner draft card (CalendarDraftCard.tsx, trimmed) ─────────────────────
type CardProps = { draft: Draft; platform: Platform; status: Status; selected: boolean; index: number; onSelect: () => void };
function DraftCard({ draft, platform, status, selected, index, onSelect }: CardProps) {
  const streaming = status === "streaming";
  const pulse = streaming && "animate-pulse motion-reduce:animate-none";
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE, delay: index * 0.18 }}
      className={cn(
        "relative isolate w-full cursor-pointer overflow-hidden rounded-lg border px-1.5 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "z-10 border-primary bg-primary/10 ring-2 ring-primary ring-offset-1 ring-offset-background"
          : "border-border bg-card/70 hover:bg-card",
        streaming && "ring-1 ring-warning/50",
      )}
    >
      {/* Top-edge status strip, the same hue as the pill. */}
      {(streaming || status === "scheduled") && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-0.5",
            streaming
              ? "bg-gradient-to-r from-transparent via-warning to-transparent animate-shimmer motion-reduce:animate-none"
              : "bg-secondary",
          )}
        />
      )}
      {streaming && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer motion-reduce:animate-none"
        />
      )}
      {/* Platform accent rail */}
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-[3px]", pulse)} style={{ background: PLATFORMS[platform].color }} />
      <span className="relative z-10 block pl-1">
        <span className="mb-1.5 flex items-center justify-between gap-1">
          <span className="shrink-0 text-2xs font-bold uppercase text-muted-foreground/70">{draft.time}</span>
          <Badge variant={STATUS[status].badge} className={cn("min-w-0 px-1 py-0 text-[0.625rem] font-bold uppercase", pulse)}>
            {STATUS[status].pill}
          </Badge>
        </span>
        <span className={cn("block truncate text-sm font-semibold leading-tight tracking-tight", streaming && "opacity-70", pulse)}>
          {draft.title}
        </span>
        {streaming && <span className="mt-0.5 block truncate text-2xs font-medium text-primary/80">Generating · Writing copy</span>}
        <span className="mt-1 block truncate text-xs font-medium text-muted-foreground">{draft.caption}</span>
      </span>
    </motion.button>
  );
}

// ── Post preview (SocialPostFrame.tsx, trimmed) ─────────────────────────────
// Engagement icons are muted chrome, as in the app: a preview has no counts.
function PostFrame({ platform, draft, photo }: { platform: Platform; draft: Draft; photo: Photo }) {
  const { frame, format } = PLATFORMS[platform];
  const media = (
    <Creative photo={photo} headline={draft.title} brand="#16162a" format={format} pos={{ x: 6, y: frame === "vertical" ? 50 : 64 }} className="w-full" />
  );
  const head = (
    <div className="flex items-center gap-2 border-b border-border/70 p-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 items-center justify-center border border-primary/30 bg-primary/15 text-2xs font-bold text-primary",
          frame === "desktop" ? "rounded" : "rounded-full",
        )}
      >
        AA
      </span>
      <span>
        <span className="block text-sm font-semibold leading-none">{BRAND}</span>
        <span className="mt-1 block text-2xs text-muted-foreground">Post preview</span>
      </span>
    </div>
  );
  // ponytail: a CSS bezel stands in for the app's ui/iphone mockup; port that if the frame ever needs the real device.
  const bezel = "mx-auto overflow-hidden rounded-[1.75rem] border-[6px] border-foreground shadow-sm";

  if (frame === "vertical") {
    return (
      <div className={cn(bezel, "w-[200px] bg-slate-950")}>
        <div className="relative">
          {media}
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-2xs font-semibold text-white">
            {platform === "youtube" ? "YouTube Shorts preview" : "TikTok preview"}
          </span>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10 text-white">
            <p className="mr-8 text-sm font-semibold">{BRAND}</p>
            <p className="mr-8 line-clamp-2 text-xs leading-relaxed">{draft.caption}</p>
          </div>
          <div className="absolute bottom-3 right-2 flex flex-col gap-3 text-white" aria-hidden="true">
            <Heart className="size-5" />
            <MessageCircle className="size-5" />
            <Share2 className="size-5" />
          </div>
        </div>
      </div>
    );
  }

  if (frame === "phone") {
    return (
      <div className={cn(bezel, "w-[248px] bg-card")}>
        {head}
        {media}
        <div className="flex items-center justify-between px-3 py-2 text-muted-foreground/40" aria-hidden="true">
          <span className="flex gap-3">
            <Heart className="size-4" />
            <MessageCircle className="size-4" />
            <Send className="size-4" />
          </span>
          <Bookmark className="size-4" />
        </div>
        <p className="px-3 pb-3 text-xs leading-relaxed">
          <span className="font-bold">{BRAND}</span> {draft.caption}
        </p>
      </div>
    );
  }

  const actions = frame === "feed"
    ? ([[ThumbsUp, "Like"], [MessageSquare, "Comment"], [Share2, "Share"]] as const)
    : ([[ThumbsUp, "Like"], [MessageSquare, "Comment"], [Repeat2, "Repost"], [Send, "Send"]] as const);
  return (
    <div className="mx-auto w-[316px] max-w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg">
      {head}
      <p className="px-4 py-3 text-sm leading-snug">{draft.caption}</p>
      {media}
      <div className="flex gap-3 border-t border-border/40 px-4 py-2 text-xs font-medium text-muted-foreground/40" aria-hidden="true">
        {actions.map(([Icon, label]) => (
          <span key={label} className="flex items-center gap-1">
            <Icon className="size-4" /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Demo ────────────────────────────────────────────────────────────────────
export function OrganicDemo({ photos }: { photos: Photo[] }) {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<"planner" | "agent">("planner");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [frame, setFrame] = useState<Platform>("instagram");
  const [scheduled, setScheduled] = useState<string[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // `flow` cancels the app's own timed work (proposing, writing); `run` cancels a scripted replay.
  const flow = useRef(0);
  const run = useRef(0);

  const shown = phase === "writing" || phase === "drafted" ? DRAFTS : [];
  const statusOf = (d: Draft): Status => (phase === "writing" ? "streaming" : scheduled.includes(d.id) ? "scheduled" : "draft");
  const sel = shown.find((d) => d.id === selected);
  const selStatus = sel && statusOf(sel);
  const stage = phase === "writing" ? 1 : phase !== "drafted" ? 0 : scheduled.length ? 3 : 2;
  // derivePlannerInsight (plannerIntelligence.ts), trimmed to the states this week reaches.
  const insight = !shown.length
    ? "Start with 3–5 posts across at least two days to shape a useful week."
    : !scheduled.length
      ? `${shown.length} drafts need a schedule before this week is ready.`
      : `Plan check: ${shown.length} posts across ${COVERED_DAYS} days; review timing before publishing.`;

  const propose = async () => {
    const id = ++flow.current;
    setPhase("proposing");
    await wait(1200);
    if (flow.current === id) setPhase("proposed");
  };

  const generate = async () => {
    const id = ++flow.current;
    setPhase("writing");
    // On a phone the grid shows two days; bring Thursday's five-platform post into view.
    const grid = gridRef.current;
    const thu = grid?.querySelector<HTMLElement>(`[data-day="${THU}"]`);
    if (grid && thu && thu.offsetLeft + thu.offsetWidth > grid.scrollLeft + grid.clientWidth) {
      grid.scrollTo({ left: thu.offsetLeft - 96 });
    }
    for (let p = 0; p <= 100; p += 4) {
      if (flow.current !== id) return;
      setProgress(p);
      await wait(110);
    }
    if (flow.current === id) setPhase("drafted");
  };

  const select = (id: string, platform: Platform) => {
    setSelected(id);
    setFrame(platform);
  };

  // The script: propose, approve the plan, watch it write, then check one post on three networks.
  // It stops on the preview and leaves Approve for the visitor.
  const play = async (alive: () => boolean) => {
    flow.current++;
    setTab("planner");
    setPhase("idle");
    setSelected(null);
    setScheduled([]);
    await wait(600);
    if (!alive()) return;
    await propose();
    await wait(1800);
    if (!alive()) return;
    await generate();
    await wait(1000);
    if (!alive()) return;
    select("thu", "instagram");
    for (const p of ["tiktok", "linkedin", "instagram"] as const) {
      await wait(1900);
      if (!alive()) return;
      setFrame(p);
    }
  };
  useAutoplay(windowRef, play);
  // Without motion nothing autoplays, so open on the finished week instead of an empty one. After
  // hydration, not in the initial state: the server can't know the visitor's motion setting.
  useEffect(() => {
    if (!reduce) return;
    setPhase((p) => (p === "idle" ? "drafted" : p));
    setSelected((s) => s ?? "thu");
  }, [reduce]);
  // Without motion a replay stops at the plan card, so the visitor runs each step by click.
  const replay = () => {
    if (reduce) return void propose();
    const id = ++run.current;
    void play(() => run.current === id);
  };

  const ask = async (q: string) => {
    if (q === PROMPTS[0] || q === PROMPTS[3]) return replay();
    const trends = q === PROMPTS[2];
    setMsgs((m) => [...m, { id: m.length, role: "user", text: q }]);
    setThinking(trends ? "Trend signals" : "Thinking…");
    await wait(1100);
    setThinking(null);
    setMsgs((m) => [
      ...m,
      trends
        ? { id: m.length, role: "assistant", card: "trends", text: "Twelve signals moved in your market. Commute noise-cancelling comparisons lead on TikTok, so Thursday's drop leans on them." }
        : { id: m.length, role: "assistant", card: "aeo", text: "Answer engines name Aurel Audio in under half of the prompts that fit you, and none of them mention battery life." },
    ]);
  };

  const busy = phase === "proposing" || phase === "writing";
  const tabs = (
    <div role="tablist" aria-label="Organic+ views" className="flex items-center gap-0.5 rounded-md border border-border/60 bg-background p-0.5">
      {(["planner", "agent"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={tab === t}
          onClick={() => setTab(t)}
          className={cn(
            "h-6 cursor-pointer rounded px-2.5 text-xs font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
            tab === t ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
  const prompts = PROMPTS.map((p) => (
    <Suggestion key={p} suggestion={p} onClick={ask} disabled={!!thinking} className="h-auto px-3 py-1 text-sm font-normal text-muted-foreground" />
  ));

  return (
    <ProductWindow ref={windowRef} path={["Continuum", "Organic+"]} actions={tabs}>
      {/* Any visitor press stops a replay the same way useAutoplay stops the first run. */}
      <div
        role="tabpanel"
        aria-label={tab}
        onPointerDownCapture={() => run.current++}
        onKeyDownCapture={() => run.current++}
        className="flex h-[690px] flex-col bg-background lg:h-[620px]"
      >
        {tab === "agent" ? (
          msgs.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
              <p className="max-w-[220px] text-pretty text-center text-sm text-muted-foreground">
                Your AI marketing strategist. Start by describing what you need.
              </p>
              <div className="flex max-w-md flex-wrap justify-center gap-1.5">{prompts}</div>
            </div>
          ) : (
            <>
              <Conversation className="flex-1">
                <ConversationContent className="gap-4 p-4 md:px-6 lg:px-8" aria-live="polite">
                  {msgs.map((m) => (
                    <Message key={m.id} role={m.role}>
                      {m.card === "trends" && (
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                          <Check className="size-3 text-success" aria-hidden="true" /> Trend signals
                        </span>
                      )}
                      <p>{m.role === "assistant" ? <Typed text={m.text} /> : m.text}</p>
                      {m.card === "trends" && (
                        // TrendChartCard.tsx, shown expanded.
                        <div className="mt-2 overflow-hidden rounded-lg border border-border/60 bg-background/60">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-xs text-muted-foreground">
                            <SearchCheck className="size-3.5 text-foreground/45" aria-hidden="true" />
                            <span className="text-sm font-medium text-foreground/85">Trend scan</span>
                            <span>· 7d / 30d · 12 signals</span>
                            <span className="ml-auto flex gap-1.5">
                              {["Trends 7", "Events 2", "Questions 3"].map((c) => (
                                <span key={c} className="rounded-md bg-muted px-1.5 py-0.5 text-2xs font-medium tabular-nums">{c}</span>
                              ))}
                            </span>
                          </div>
                          <ul className="space-y-2 border-t border-border/30 px-3 py-2.5">
                            {SIGNALS.map(([title, meta]) => (
                              <li key={title} className="grid gap-0.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-3">
                                <span className="truncate text-sm">{title}</span>
                                <span className="text-2xs text-muted-foreground">{meta}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.card === "aeo" && (
                        // AeoSnapshotCard.tsx, trimmed to the scores and the gaps.
                        <div className="mt-2 rounded-lg border border-border/60 bg-background/60 p-3">
                          <p className="flex justify-between text-xs text-muted-foreground">
                            <span className="font-medium">AEO snapshot</span>
                            <span className="text-emerald-600">12 prompts</span>
                          </p>
                          <p className="mt-1.5 font-semibold leading-snug">How AI is representing {BRAND}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Simulated answer-engine run using brand, competitor, document, trend, and audience-question context.
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {([["Visibility", "46/100", "text-amber-600"], ["Share of voice", "18%", "text-destructive"]] as const).map(([label, value, tone]) => (
                              <div key={label} className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
                                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                                <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone)}>{value}</p>
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Search className="size-3.5" aria-hidden="true" /> Missing topics
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {["battery life tests", "studio vs. consumer tuning", "repairability"].map((t) => (
                              <Badge key={t} variant="outline" className="rounded-md">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Message>
                  ))}
                  {thinking && (
                    <Shimmer as="span" className="pl-10 text-sm">{thinking}</Shimmer>
                  )}
                </ConversationContent>
              </Conversation>
              <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-border p-3">{prompts}</div>
            </>
          )
        ) : (
          <>
            {/* Workflow rail (PlannerWorkflowRail.tsx) */}
            <nav aria-label="Content workflow" className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2">
              <ol className="flex flex-1 items-center lg:max-w-md">
                {STAGES.map((s, i) => (
                  <li key={s} className="flex min-w-0 flex-1 items-center last:flex-none">
                    <span
                      aria-current={i === stage ? "step" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium sm:gap-1.5",
                        i === stage ? "text-foreground" : i < stage ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-5 items-center justify-center rounded-full border font-mono text-2xs",
                          i === stage && "border-primary bg-primary/10 text-primary",
                          i < stage && "border-primary bg-primary text-primary-foreground",
                          i > stage && "border-border bg-background",
                        )}
                      >
                        {i < stage ? <Check className="size-3" aria-hidden="true" /> : i + 1}
                      </span>
                      {s}
                    </span>
                    {i < STAGES.length - 1 && <span className="mx-1 h-px min-w-2 flex-1 bg-border sm:mx-2" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
              <p role="note" className="hidden min-w-0 items-center gap-1.5 border-l border-border pl-3 text-xs text-muted-foreground lg:flex">
                <Lightbulb className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{insight}</span>
              </p>
            </nav>

            {/* Toolbar (CalendarToolbar.tsx) */}
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              <span className="text-sm font-semibold">Oct 12–18</span>
              <Badge variant="outline" className="hidden text-2xs sm:inline-flex">Trends selected: 2 of 5</Badge>
              <Badge variant="outline" className="hidden text-2xs uppercase tracking-wide sm:inline-flex">This week · 2 posted</Badge>
              <Button type="button" size="sm" variant="outline" className="ml-auto" disabled={busy} onClick={replay}>
                <Sparkles className={cn(phase === "proposing" && "animate-pulse motion-reduce:animate-none")} aria-hidden="true" />
                {phase === "proposing" ? "Proposing…" : "Generate"}
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="relative h-[256px] shrink-0 lg:h-auto lg:min-w-0 lg:flex-1">
                {/* Planner grid (PlannerMatrix.tsx): sticky platform rail and day row, scrolls both ways */}
                <div ref={gridRef} className="relative isolate size-full overflow-auto scroll-smooth motion-reduce:scroll-auto">
                  <div className="grid min-w-[65.5rem] grid-cols-[6rem_repeat(7,minmax(8.5rem,1fr))]">
                    <div className="sticky left-0 top-0 z-40 flex items-center justify-center border-b-2 border-r-2 border-border bg-muted px-2 text-2xs font-semibold uppercase tracking-wide">
                      Platform
                    </div>
                    {DAYS.map((d, i) => (
                      <div key={d} data-day={i} className="sticky top-0 z-30 border-b-2 border-r border-border bg-muted px-1.5 py-1.5 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d}</p>
                        <p
                          className={cn(
                            "mx-auto mt-0.5 flex size-7 items-center justify-center text-base font-semibold",
                            i === TODAY && "rounded-full border border-primary/30 bg-primary/15 text-sm text-primary",
                          )}
                        >
                          {12 + i}
                        </p>
                      </div>
                    ))}
                    {ROWS.map((p) => (
                      <Fragment key={p}>
                        <div className="sticky left-0 z-20 flex flex-col items-center justify-center gap-1.5 border-b border-r-2 border-border bg-muted px-1.5">
                          <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: PLATFORMS[p].color }} />
                          <span className="text-xs font-semibold uppercase tracking-wide">{PLATFORMS[p].label}</span>
                        </div>
                        {DAYS.map((d, i) => (
                          <div key={d} className={cn("flex min-h-24 flex-col gap-1.5 border-b border-r border-border/50 p-1", i === TODAY && "bg-primary/[0.03]")}>
                            {POSTED.filter((x) => x.day === i && x.platform === p).map((x) => (
                              // PostedContentQuickLook.tsx, compact; the app's popover is left out.
                              <div key={x.title} title={x.title} className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/45 px-1.5 py-1 text-2xs text-muted-foreground">
                                <Badge variant="success" className="px-1.5 py-0 text-[0.625rem]">Posted</Badge>
                                <span className="shrink-0 font-mono text-[0.625rem]">{x.time}</span>
                                <span className="truncate text-foreground">{x.title}</span>
                              </div>
                            ))}
                            {shown.filter((x) => x.day === i && x.platforms.includes(p)).map((x) => (
                              <DraftCard
                                key={x.id}
                                draft={x}
                                platform={p}
                                status={statusOf(x)}
                                selected={x.id === selected}
                                index={DRAFTS.indexOf(x)}
                                onSelect={() => select(x.id, p)}
                              />
                            ))}
                          </div>
                        ))}
                      </Fragment>
                    ))}
                  </div>
                </div>

                {/* Bulk plan proposal (agent/BulkPlanCard.tsx) */}
                <AnimatePresence>
                  {phase === "proposed" && (
                    <motion.section
                      aria-label="Bulk plan"
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="absolute right-3 top-3 z-40 w-[min(22rem,calc(100%-1.5rem))] rounded-lg border border-border bg-card p-4 shadow-lg"
                    >
                      <p className="flex justify-between gap-3 text-xs text-muted-foreground">
                        <span className="font-medium">Bulk plan</span>
                        <span className="tabular-nums">{PIECES} pieces · 1 wk</span>
                      </p>
                      <p className="mt-2 font-semibold leading-snug">Launch week: the studio line</p>
                      <p className="mt-1 text-sm text-muted-foreground">Open on the drop, then prove it: sound, battery, the build.</p>
                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        {/* The plan is built on the selected trends (buildCalendarPlanRequest). */}
                        <p>From 2 trends: commute noise-cancelling comparisons · holiday gift guides</p>
                        <p><span className="font-medium text-foreground/80">Studio sound</span> · All-day battery · Behind the build</p>
                        <p><span className="font-medium text-foreground/80">Post 50%</span> · Reel 30% · Carousel 20%</p>
                        <p className="flex flex-wrap items-center gap-1.5">
                          ~1/day/platform
                          {ALL.map((k) => (
                            <span key={k} className="rounded-md bg-muted px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-foreground/80">
                              {PLATFORMS[k].abbr}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setPhase("idle")}>Dismiss</Button>
                        <Button type="button" size="sm" variant="cta" onClick={generate}>Approve &amp; generate</Button>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {phase === "writing" && (
                  <div role="status" className="absolute inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 py-2 backdrop-blur">
                    <p className="flex justify-between text-2xs font-bold uppercase text-muted-foreground">
                      <span className="text-primary">Writing copy</span>
                      <span className="tabular-nums">{progress}%</span>
                    </p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-[width] duration-100 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Draft preview (OrganicDraftPreview.tsx, trimmed) */}
              <aside aria-label="Post preview" className="flex min-h-0 flex-1 flex-col border-t border-border lg:w-[340px] lg:flex-none lg:border-l lg:border-t-0">
                {sel && selStatus ? (
                  <>
                    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-xs font-medium">
                      <span className="flex" aria-hidden="true">
                        {sel.platforms.map((k) => (
                          <span key={k} className="-ml-0.5 size-1.5 rounded-full first:ml-0" style={{ background: PLATFORMS[k].color }} />
                        ))}
                      </span>
                      {sel.platforms.length > 1 ? `${sel.platforms.length} platforms` : PLATFORMS[sel.platforms[0]].label}
                      <span className="text-muted-foreground/50">|</span> Post
                      <span className="text-muted-foreground/50">|</span> {DAYS[sel.day]} {sel.time}
                      <span className="ml-auto font-semibold">{STATUS[selStatus].label}</span>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/10 p-2 lg:p-3">
                      <div className="flex flex-col gap-2 lg:gap-3">
                        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2">
                          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hook</span>
                          <p className="min-w-0 flex-1 truncate text-sm">{sel.title}</p>
                          {selStatus !== "streaming" && (
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", GRADE[grade(sel.score)])}>
                              <span className="font-semibold">
                                <Tween key={sel.id} value={sel.score} from={0} format={(n) => String(Math.round(n))} />
                              </span>
                              <span className="text-2xs uppercase tracking-wide">{grade(sel.score)}</span>
                            </span>
                          )}
                        </div>
                        {sel.platforms.length > 1 && (
                          <fieldset className="flex items-center gap-1.5">
                            <legend className="float-left mr-1.5 text-2xs uppercase tracking-wide text-muted-foreground">See it on</legend>
                            {sel.platforms.map((k) => (
                              <button
                                key={k}
                                type="button"
                                aria-pressed={k === frame}
                                aria-label={PLATFORMS[k].label}
                                onClick={() => setFrame(k)}
                                className={cn(
                                  "cursor-pointer rounded-md border px-2 py-0.5 text-2xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                                  k === frame ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {PLATFORMS[k].abbr}
                              </button>
                            ))}
                          </fieldset>
                        )}
                        {/* The app shows its phone frames at 0.72 scale; on a phone the landing goes to 0.56 so the whole post fits. */}
                        <div className="max-sm:[zoom:0.56] sm:max-lg:[zoom:0.72]">
                          <PostFrame platform={sel.platforms.includes(frame) ? frame : sel.platforms[0]} draft={sel} photo={photos[sel.photo] ?? photos[0]} />
                        </div>
                      </div>
                    </div>
                    <div className="flex h-14 shrink-0 items-center border-t border-border px-3 lg:h-16">
                      {selStatus === "scheduled" ? (
                        <RunItCta />
                      ) : (
                        <button
                          type="button"
                          disabled={selStatus === "streaming"}
                          onClick={() => setScheduled((s) => [...s, sel.id])}
                          className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                        >
                          {sel.platforms.length > 1 ? `Approve for ${sel.platforms.length} platforms` : "Approve & Schedule"}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="m-auto max-w-[220px] text-pretty text-center text-sm text-muted-foreground">
                    {shown.length ? "Select a draft to see it on each platform." : "Generate a plan to fill the week."}
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </ProductWindow>
  );
}
