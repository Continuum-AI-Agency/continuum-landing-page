import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  CalendarClock,
  Heart,
  MessageCircle,
  MessageSquare,
  Move,
  Music2,
  Repeat2,
  RotateCcw,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { Area, AreaChart, Line, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message } from "@/components/ai-elements/message";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Creative, ProductWindow, Typed, wait, type Format, type Photo, type Pos } from "./shared";
import { cn } from "@/lib/utils";

type Platform = "instagram" | "tiktok" | "linkedin";
type Msg = { id: number; role: "user" | "assistant"; text: string; typed?: boolean };

// ── Sample data (one brand across all three demos: Aurel Audio) ─────────────
const HANDLE = "aurel.audio";
const BRAND = "Aurel Audio";
const SWATCHES = [
  { hex: "#16162a", name: "Ink" },
  { hex: "#5a48f9", name: "Violet" },
  { hex: "#c2410c", name: "Vermilion" },
  { hex: "#0b7a5c", name: "Pine" },
];
const CAPTION: Record<Platform, string> = {
  instagram: "Studio sound, all-day battery. The new line is live, link in bio.",
  tiktok: "wait for the bass #newdrop #studiosound",
  linkedin: "Our studio line is live: built for long sessions and short commutes.",
};
// Each network gets the post in its own native shape, like the app's postPlatforms.
const PLATFORMS: { key: Platform; label: string; color: string; format: Format; width: string }[] = [
  { key: "instagram", label: "Instagram", color: "var(--chart-5)", format: "4:5", width: "w-[216px]" },
  { key: "tiktok", label: "TikTok", color: "var(--secondary)", format: "9:16", width: "w-[190px]" },
  { key: "linkedin", label: "LinkedIn", color: "var(--chart-1)", format: "1.91:1", width: "w-[300px]" },
];
const TIKTOK_SAFE_Y = 58; // keep the headline above TikTok's caption overlay
const DAYS = Array.from({ length: 14 }, (_, i) => `Sep ${8 + i}`);
const BASE = {
  reach: [4.1, 4.6, 4.3, 5.2, 5.9, 5.4, 6.8, 7.2, 6.9, 8.1, 8.8, 8.4, 9.6, 10.3],
  engagement: [3.1, 3.4, 3.2, 3.9, 4.1, 3.8, 4.6, 4.9, 4.7, 5.2, 5.6, 5.3, 5.9, 6.2],
  saves: [42, 51, 47, 63, 70, 66, 81, 88, 84, 97, 109, 104, 118, 127],
};
const SCALE: Record<Platform, { reach: number; engagement: number; saves: number }> = {
  instagram: { reach: 1, engagement: 1, saves: 1 },
  tiktok: { reach: 2.4, engagement: 1.35, saves: 0.7 },
  linkedin: { reach: 0.38, engagement: 0.8, saves: 0.3 },
};
// `mean` metrics are rates, so the all-platform line averages instead of summing.
const METRICS = [
  { key: "reach", label: "Reach", mean: false, format: (v: number) => `${v.toFixed(1)}k` },
  { key: "engagement", label: "Engagement rate", mean: true, format: (v: number) => `${v.toFixed(1)}%` },
  { key: "saves", label: "Saves", mean: false, format: (v: number) => `${Math.round(v)}` },
] as const;
type MetricKey = (typeof METRICS)[number]["key"];

const START = {
  headline: "Sound that moves with you",
  photo: 0,
  brand: SWATCHES[0].hex,
  pos: { x: 7, y: 62 },
};

const AGENT_ACTIONS = [
  "Rewrite the hook for TikTok",
  "Find the best time to post",
  "Apply our brand kit",
] as const;

// ── Platform post frames ────────────────────────────────────────────────────
function Avatar({ square }: { square?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center bg-foreground text-2xs font-semibold text-background",
        square ? "rounded-sm" : "rounded-full",
      )}
    >
      A
    </span>
  );
}

function PostFrame({
  platform,
  width,
  creative,
  scheduled,
}: {
  platform: Platform;
  width: string;
  creative: ReactNode;
  scheduled: string | null;
}) {
  const caption = CAPTION[platform];
  const badge = scheduled && (
    <p className="flex items-center gap-1 text-2xs font-medium text-primary">
      <CalendarClock className="size-3" aria-hidden="true" /> Scheduled {scheduled}
    </p>
  );

  if (platform === "tiktok") {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-[#0b0b0e] text-white", width)}>
        {creative}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 to-transparent" />
        <ul className="absolute bottom-16 right-2 flex flex-col items-center gap-3 text-2xs" aria-label="Engagement">
          <li className="flex flex-col items-center"><Heart className="size-5" aria-hidden="true" />24.1k</li>
          <li className="flex flex-col items-center"><MessageCircle className="size-5" aria-hidden="true" />612</li>
          <li className="flex flex-col items-center"><Bookmark className="size-5" aria-hidden="true" />1.9k</li>
          <li className="flex flex-col items-center"><Share2 className="size-5" aria-hidden="true" />388</li>
        </ul>
        <div className="absolute bottom-3 left-3 right-12 space-y-1 text-xs">
          <p className="font-semibold">@{HANDLE}</p>
          <p className="line-clamp-2 text-white/90">{caption}</p>
          <p className="flex items-center gap-1 text-2xs text-white/80">
            <Music2 className="size-3" aria-hidden="true" /> original sound
          </p>
          {scheduled && <p className="text-2xs font-medium text-white">Scheduled {scheduled}</p>}
        </div>
      </div>
    );
  }

  if (platform === "linkedin") {
    return (
      <div className={cn("overflow-hidden rounded-lg border border-border bg-background text-foreground", width)}>
        <div className="flex items-center gap-2 p-2.5">
          <Avatar square />
          <div className="min-w-0 text-xs leading-tight">
            <p className="font-semibold">{BRAND}</p>
            <p className="text-2xs text-muted-foreground">4,812 followers</p>
          </div>
        </div>
        <p className="px-2.5 pb-2 text-xs leading-snug">{caption}</p>
        {creative}
        <div className="space-y-1.5 p-2.5">
          <p className="text-2xs text-muted-foreground">318 reactions · 27 comments</p>
          <div className="flex justify-between text-2xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" aria-hidden="true" />Like</span>
            <span className="flex items-center gap-1"><MessageSquare className="size-3.5" aria-hidden="true" />Comment</span>
            <span className="flex items-center gap-1"><Repeat2 className="size-3.5" aria-hidden="true" />Repost</span>
          </div>
          {badge}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-background text-foreground", width)}>
      <div className="flex items-center gap-2 p-2.5">
        <Avatar />
        <p className="text-xs font-semibold">{HANDLE}</p>
      </div>
      {creative}
      <div className="space-y-1.5 p-2.5">
        <div className="flex items-center justify-between" aria-hidden="true">
          <span className="flex gap-3">
            <Heart className="size-4" />
            <MessageCircle className="size-4" />
            <Send className="size-4" />
          </span>
          <Bookmark className="size-4" />
        </div>
        <p className="text-xs font-semibold">1,284 likes</p>
        <p className="text-xs leading-snug">
          <span className="font-semibold">{HANDLE}</span> {caption}
        </p>
        {badge}
      </div>
    </div>
  );
}

// ── Analytics tile: hover or focus expands it into a per-platform chart ────
function MetricTile({
  metric,
  expanded,
  onExpand,
}: {
  metric: (typeof METRICS)[number];
  expanded: boolean;
  onExpand: () => void;
}) {
  const byPlatform = Object.fromEntries(
    PLATFORMS.map((p) => [p.key, BASE[metric.key].map((v) => v * SCALE[p.key][metric.key])]),
  ) as Record<Platform, number[]>;
  const total = DAYS.map((_, i) => {
    const sum = PLATFORMS.reduce((acc, p) => acc + byPlatform[p.key][i], 0);
    return metric.mean ? sum / PLATFORMS.length : sum;
  });
  const data = DAYS.map((day, i) => ({
    day,
    total: total[i],
    ...Object.fromEntries(PLATFORMS.map((p) => [p.key, +byPlatform[p.key][i].toFixed(2)])),
  }));
  const last7 = total.slice(7).reduce((a, b) => a + b, 0);
  const prev7 = total.slice(0, 7).reduce((a, b) => a + b, 0);
  const delta = Math.round(((last7 - prev7) / prev7) * 100);
  const config = {
    total: { label: metric.label, color: "var(--chart-1)" },
    ...Object.fromEntries(PLATFORMS.map((p) => [p.key, { label: p.label, color: p.color }])),
  } satisfies ChartConfig;

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`${metric.label} across Instagram, TikTok, and LinkedIn: ${metric.format(total.at(-1)!)}, up ${delta}% on last week`}
      onMouseEnter={onExpand}
      onFocus={onExpand}
      className={cn(
        "flex min-w-0 cursor-pointer flex-col gap-1 rounded-lg border border-border bg-background p-3 outline-none transition-[flex-grow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
        expanded ? "grow-[2.4] border-primary/40" : "grow",
      )}
      style={{ flexBasis: 0 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">{metric.label}</p>
        <p className="text-2xs font-medium text-emerald-700">+{delta}%</p>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xl font-semibold tabular-nums">{metric.format(total.at(-1)!)}</p>
        {expanded && (
          <ul className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 text-2xs text-muted-foreground" aria-hidden="true">
            {PLATFORMS.map((p) => (
              <li key={p.key} className="flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: p.color }} />
                {p.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ChartContainer config={config} className="aspect-auto h-20 w-full">
        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }} accessibilityLayer={false}>
          {expanded && (
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={4} interval="preserveStartEnd" minTickGap={24} />
          )}
          {expanded && <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />}
          {expanded ? (
            PLATFORMS.map((p) => (
              <Line key={p.key} dataKey={p.key} type="monotone" stroke={`var(--color-${p.key})`} strokeWidth={1.75} dot={false} isAnimationActive={false} />
            ))
          ) : (
            <Area
              dataKey="total"
              type="monotone"
              stroke="var(--color-total)"
              strokeWidth={1.75}
              fill="var(--color-total)"
              fillOpacity={0.12}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

// ── Demo ────────────────────────────────────────────────────────────────────
export function OrganicDemo({ photos }: { photos: Photo[] }) {
  const [headline, setHeadline] = useState(START.headline);
  const [photo, setPhoto] = useState(START.photo);
  const [brand, setBrand] = useState(START.brand);
  const [pos, setPos] = useState<Pos>(START.pos);
  // Per-network edits: the agent can rewrite one network's hook without touching the others.
  const [overrides, setOverrides] = useState<Partial<Record<Platform, string>>>({});
  const [highlight, setHighlight] = useState<Platform | null>(null);
  const [scheduled, setScheduled] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<MetricKey>("reach");
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "assistant", text: "I drafted this post from your brand kit and fitted it to each network. Edit it on the canvas, or ask me to adapt it." },
  ]);
  const [used, setUsed] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  // Suggestion and Reset buttons remove themselves on click; park focus on the log so it is never lost.
  const logRef = useRef<HTMLDivElement>(null);
  const keepFocus = () => logRef.current?.focus({ preventScroll: true });

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(null), 2400);
    return () => clearTimeout(t);
  }, [highlight]);

  const say = (role: Msg["role"], text: string, typed = false) =>
    setMessages((m) => [...m, { id: m.length, role, text, typed }]);

  const runAction = async (action: string) => {
    keepFocus();
    setUsed((u) => [...u, action]);
    say("user", action);
    setThinking(true);
    await wait(700);
    setThinking(false);
    if (action === AGENT_ACTIONS[0]) {
      setOverrides((o) => ({ ...o, tiktok: "Hear the drop." }));
      setHighlight("tiktok");
      say("assistant", "Short hooks hold the first second on TikTok, so only the TikTok post changed. Instagram and LinkedIn keep the long line.", true);
    } else if (action === AGENT_ACTIONS[1]) {
      setScheduled("Thu 7:40 PM");
      say("assistant", "Your audience is most active Thursday at 7:40 PM, based on the last 90 days. All three posts are scheduled there.", true);
    } else {
      setBrand("#5a48f9");
      setPos({ x: 7, y: 56 });
      say("assistant", "Applied your brand kit: violet headline block, anchored above every network’s caption area.", true);
    }
  };

  const reset = () => {
    keepFocus();
    setHeadline(START.headline);
    setPhoto(START.photo);
    setBrand(START.brand);
    setPos(START.pos);
    setOverrides({});
    setHighlight(null);
    setScheduled(null);
    setUsed([]);
    setMessages((m) => m.slice(0, 1));
  };

  const pending = AGENT_ACTIONS.filter((a) => !used.includes(a));

  return (
    <ProductWindow path={["Continuum", "Organic+", "Studio line launch"]}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] lg:divide-x lg:divide-border">
        {/* Editor: the master post */}
        <div className="flex flex-col">
          <div className="flex h-[320px] items-center justify-center bg-muted/60 p-5 md:h-[380px]">
            <Creative
              photo={photos[photo]}
              headline={headline}
              brand={brand}
              format="4:5"
              pos={pos}
              onMove={setPos}
              className="h-full max-w-full rounded-md shadow-sm"
            />
          </div>
          <p className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-2xs text-muted-foreground">
            <Move className="size-3" aria-hidden="true" /> Drag the headline, or focus it and use the arrow keys.
          </p>
          <div className="grid gap-4 border-t border-border p-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Headline</span>
              <Input value={headline} maxLength={40} autoComplete="off" onChange={(e) => setHeadline(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-x-6 gap-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" id="organic-photo">Image</span>
                <div className="flex gap-2" role="group" aria-labelledby="organic-photo">
                  {photos.map((p, i) => (
                    <button
                      key={p.src}
                      type="button"
                      aria-pressed={photo === i}
                      aria-label={p.alt}
                      onClick={() => setPhoto(i)}
                      className={cn(
                        "size-9 cursor-pointer overflow-hidden rounded-md border-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        photo === i ? "border-primary" : "border-transparent",
                      )}
                    >
                      <img src={p.src} alt="" width={36} height={36} loading="lazy" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" id="organic-color">Headline color</span>
                <div className="flex gap-2" role="group" aria-labelledby="organic-color">
                  {SWATCHES.map((s) => (
                    <button
                      key={s.hex}
                      type="button"
                      aria-pressed={brand === s.hex}
                      aria-label={s.name}
                      onClick={() => setBrand(s.hex)}
                      className={cn(
                        "size-9 cursor-pointer rounded-md border-2 outline-none ring-offset-2 focus-visible:ring-3 focus-visible:ring-ring/50",
                        brand === s.hex ? "outline-2 outline-offset-2 outline-foreground" : "",
                      )}
                      style={{ background: s.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Every network at once, each in its native shape */}
        <div className="flex flex-col border-t border-border bg-card/50 lg:border-t-0">
          <p className="border-b border-border px-4 py-2.5 text-xs font-medium">Fitted to every network</p>
          <div className="flex flex-1 snap-x snap-mandatory items-center gap-6 overflow-x-auto p-5 lg:justify-center">
            {PLATFORMS.map((p) => (
              <div key={p.key} className="flex shrink-0 snap-center flex-col items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {p.label} <span className="tabular-nums">{p.format}</span>
                </span>
                <div
                  className={cn(
                    "rounded-xl transition-shadow duration-300 motion-reduce:transition-none",
                    highlight === p.key && "ring-2 ring-primary ring-offset-4 ring-offset-card",
                  )}
                >
                  <PostFrame
                    platform={p.key}
                    width={p.width}
                    scheduled={scheduled}
                    creative={
                      <Creative
                        photo={photos[photo]}
                        headline={overrides[p.key] ?? headline}
                        brand={brand}
                        format={p.format}
                        pos={p.key === "tiktok" ? { ...pos, y: Math.min(pos.y, TIKTOK_SAFE_Y) } : pos}
                        className="w-full"
                      />
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organic agent */}
      <div className="grid grid-cols-1 border-t border-border md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:divide-x md:divide-border">
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium">Organic agent</span>
            {used.length > 0 && (
              <Button variant="ghost" size="xs" onClick={reset} disabled={thinking}>
                <RotateCcw aria-hidden="true" /> Reset
              </Button>
            )}
          </div>
          <div ref={logRef} tabIndex={-1} className="flex max-h-56 flex-col gap-3 overflow-y-auto p-3 outline-none" aria-live="polite">
            {messages.map((m) => (
              <Message key={m.id} role={m.role} avatar={m.role === "assistant" ? "O" : "Y"}>
                {m.typed ? <Typed text={m.text} /> : m.text}
              </Message>
            ))}
            {thinking && <Shimmer className="pl-10 text-sm">Reading your brand kit…</Shimmer>}
          </div>
        </div>
        <div className="flex flex-wrap content-start gap-2 border-t border-border p-4 md:border-t-0">
          <p className="w-full text-xs text-muted-foreground">Ask the agent</p>
          {pending.length > 0 ? (
            pending.map((a) => <Suggestion key={a} suggestion={a} onClick={runAction} disabled={thinking} />)
          ) : (
            <p className="text-xs text-muted-foreground">That’s the whole script. Reset to run it again.</p>
          )}
        </div>
      </div>

      {/* Analytics */}
      <div className="border-t border-border p-4">
        <p className="mb-3 text-xs font-medium">Last 14 days across Instagram, TikTok, and LinkedIn</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {METRICS.map((m) => (
            <MetricTile key={m.key} metric={m} expanded={expanded === m.key} onExpand={() => setExpanded(m.key)} />
          ))}
        </div>
      </div>
    </ProductWindow>
  );
}
