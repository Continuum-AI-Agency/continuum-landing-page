import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useMotionValue } from "motion/react";
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
import { Area, AreaChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Message } from "@/components/ai-elements/message";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ProductWindow, Typed, wait } from "./shared";
import { cn } from "@/lib/utils";

type Format = "1:1" | "4:5" | "9:16";
type Platform = "instagram" | "tiktok" | "linkedin";
type Photo = { src: string; alt: string };
type Pos = { x: number; y: number };
type Msg = { id: number; role: "user" | "assistant"; text: string; typed?: boolean };

// ── Sample data ─────────────────────────────────────────────────────────────
const RATIO: Record<Format, number> = { "1:1": 1, "4:5": 4 / 5, "9:16": 9 / 16 };
const FRAME_WIDTH: Record<Format, string> = { "1:1": "w-[272px]", "4:5": "w-[248px]", "9:16": "w-[196px]" };
const SWATCHES = [
  { hex: "#16162a", name: "Ink" },
  { hex: "#5a48f9", name: "Violet" },
  { hex: "#d9482b", name: "Vermilion" },
  { hex: "#0b7a5c", name: "Pine" },
];
const CAPTION: Record<Platform, string> = {
  instagram: "Studio sound, all-day battery. The new line is live, link in bio.",
  tiktok: "wait for the bass #newdrop #studiosound",
  linkedin: "Our studio line is live: built for long sessions and short commutes.",
};
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
const METRICS = [
  { key: "reach", label: "Reach", format: (v: number) => `${v.toFixed(1)}k` },
  { key: "engagement", label: "Engagement rate", format: (v: number) => `${v.toFixed(1)}%` },
  { key: "saves", label: "Saves", format: (v: number) => `${Math.round(v)}` },
] as const;
type MetricKey = (typeof METRICS)[number]["key"];

const START = {
  headline: "Sound that moves with you",
  photo: 0,
  brand: SWATCHES[0].hex,
  format: "4:5" as Format,
  platform: "instagram" as Platform,
  pos: { x: 7, y: 62 },
};

const AGENT_ACTIONS = [
  "Rewrite the hook for TikTok",
  "Find the best time to post",
  "Apply our brand kit",
] as const;

// ── Creative (shared by editor and post preview) ───────────────────────────
function Creative({
  photo,
  headline,
  brand,
  format,
  pos,
  onMove,
  className,
}: {
  photo: Photo;
  headline: string;
  brand: string;
  format: Format;
  pos: Pos;
  onMove?: (pos: Pos) => void;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLParagraphElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const editable = Boolean(onMove);

  const clamp = (p: Pos): Pos => ({
    x: Math.min(Math.max(p.x, 0), 60),
    y: Math.min(Math.max(p.y, 0), 84),
  });

  const commitDrag = () => {
    const frame = frameRef.current?.getBoundingClientRect();
    const chip = chipRef.current?.getBoundingClientRect();
    if (!frame || !chip || !onMove) return;
    onMove(
      clamp({
        x: ((chip.left - frame.left) / frame.width) * 100,
        y: ((chip.top - frame.top) / frame.height) * 100,
      }),
    );
    x.set(0);
    y.set(0);
  };

  const nudge = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 8 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d || !onMove) return;
    e.preventDefault();
    onMove(clamp({ x: pos.x + d[0], y: pos.y + d[1] }));
  };

  return (
    <div
      ref={frameRef}
      className={cn("@container relative overflow-hidden bg-muted", className)}
      style={{ aspectRatio: RATIO[format] }}
    >
      <img
        src={photo.src}
        alt={photo.alt}
        width={640}
        height={640}
        draggable={false}
        className="absolute inset-0 size-full select-none object-cover"
      />
      <motion.p
        ref={chipRef}
        drag={editable}
        dragConstraints={frameRef}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={commitDrag}
        tabIndex={editable ? 0 : undefined}
        role={editable ? "button" : undefined}
        aria-label={editable ? `Headline layer: ${headline}. Use arrow keys to move.` : undefined}
        onKeyDown={editable ? nudge : undefined}
        style={{ x, y, left: `${pos.x}%`, top: `${pos.y}%`, background: brand }}
        className={cn(
          "absolute max-w-[78%] rounded-[0.6cqw] px-[3cqw] py-[2cqw] text-[7.5cqw] font-semibold leading-[1.05] text-white",
          editable &&
            "cursor-grab outline-2 outline-offset-2 outline-dashed outline-white/80 focus-visible:outline-solid active:cursor-grabbing",
        )}
      >
        {headline || "Your headline"}
      </motion.p>
    </div>
  );
}

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
      C
    </span>
  );
}

function PostFrame({
  platform,
  format,
  creative,
  scheduled,
}: {
  platform: Platform;
  format: Format;
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
      <div className="relative flex aspect-[9/16] w-[228px] items-center justify-center overflow-hidden rounded-xl bg-[#0b0b0e] text-white">
        <div className="w-full">{creative}</div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        <ul className="absolute bottom-16 right-2 flex flex-col items-center gap-3 text-2xs" aria-label="Engagement">
          <li className="flex flex-col items-center"><Heart className="size-5" aria-hidden="true" />24.1k</li>
          <li className="flex flex-col items-center"><MessageCircle className="size-5" aria-hidden="true" />612</li>
          <li className="flex flex-col items-center"><Bookmark className="size-5" aria-hidden="true" />1.9k</li>
          <li className="flex flex-col items-center"><Share2 className="size-5" aria-hidden="true" />388</li>
        </ul>
        <div className="absolute bottom-3 left-3 right-12 space-y-1 text-xs">
          <p className="font-semibold">@continuum.studio</p>
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
      <div className={cn("overflow-hidden rounded-lg border border-border bg-background text-foreground", FRAME_WIDTH[format])}>
        <div className="flex items-center gap-2 p-2.5">
          <Avatar square />
          <div className="min-w-0 text-xs leading-tight">
            <p className="font-semibold">Continuum</p>
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
    <div className={cn("overflow-hidden rounded-lg border border-border bg-background text-foreground", FRAME_WIDTH[format])}>
      <div className="flex items-center gap-2 p-2.5">
        <Avatar />
        <p className="text-xs font-semibold">continuum.studio</p>
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
          <span className="font-semibold">continuum.studio</span> {caption}
        </p>
        {badge}
      </div>
    </div>
  );
}

// ── Analytics tile: hover or focus expands it into a full chart ────────────
function MetricTile({
  label,
  series,
  format,
  expanded,
  onExpand,
}: {
  label: string;
  series: number[];
  format: (v: number) => string;
  expanded: boolean;
  onExpand: () => void;
}) {
  const data = series.map((value, i) => ({ day: DAYS[i], value }));
  const last7 = series.slice(7).reduce((a, b) => a + b, 0);
  const prev7 = series.slice(0, 7).reduce((a, b) => a + b, 0);
  const delta = Math.round(((last7 - prev7) / prev7) * 100);
  const config = { value: { label, color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`${label}: ${format(series.at(-1)!)}, up ${delta}% on last week`}
      onMouseEnter={onExpand}
      onFocus={onExpand}
      onClick={onExpand}
      className={cn(
        "flex min-w-0 cursor-pointer flex-col gap-1 rounded-lg border border-border bg-background p-3 outline-none transition-[flex-grow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
        expanded ? "grow-[2.4] border-primary/40" : "grow",
      )}
      style={{ flexBasis: 0 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-2xs font-medium text-success">+{delta}%</p>
      </div>
      <p className="text-xl font-semibold tabular-nums">{format(series.at(-1)!)}</p>
      <ChartContainer config={config} className="aspect-auto h-20 w-full">
        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
          {expanded && (
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={4} interval="preserveStartEnd" minTickGap={24} />
          )}
          {expanded && <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />}
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={1.75}
            fill="var(--color-value)"
            fillOpacity={0.12}
            isAnimationActive={false}
          />
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
  const [format, setFormat] = useState<Format>(START.format);
  const [platform, setPlatform] = useState<Platform>(START.platform);
  const [pos, setPos] = useState<Pos>(START.pos);
  const [scheduled, setScheduled] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<MetricKey>("reach");
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "assistant", text: "I drafted this post from your brand kit. Edit it on the canvas, or ask me to adapt it." },
  ]);
  const [used, setUsed] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);

  const say = (role: Msg["role"], text: string, typed = false) =>
    setMessages((m) => [...m, { id: m.length, role, text, typed }]);

  const runAction = async (action: string) => {
    setUsed((u) => [...u, action]);
    say("user", action);
    setThinking(true);
    await wait(700);
    setThinking(false);
    if (action === AGENT_ACTIONS[0]) {
      setHeadline("Hear the drop.");
      setFormat("9:16");
      setPlatform("tiktok");
      say("assistant", "Short hooks hold the first second on TikTok. I switched to 9:16 and cut the line to three words.", true);
    } else if (action === AGENT_ACTIONS[1]) {
      setScheduled("Thu 7:40 PM");
      say("assistant", "Your audience is most active Thursday at 7:40 PM, based on the last 90 days. I scheduled it there.", true);
    } else {
      setBrand("#5a48f9");
      setPos({ x: 7, y: 70 });
      say("assistant", "Applied your brand kit: violet headline block, anchored to the lower third.", true);
    }
  };

  const reset = () => {
    setHeadline(START.headline);
    setPhoto(START.photo);
    setBrand(START.brand);
    setFormat(START.format);
    setPlatform(START.platform);
    setPos(START.pos);
    setScheduled(null);
    setUsed([]);
    setMessages((m) => m.slice(0, 1));
  };

  const creativeProps = { photo: photos[photo], headline, brand, format, pos };
  const pending = AGENT_ACTIONS.filter((a) => !used.includes(a));

  return (
    <ProductWindow path={["Continuum", "Organic+", "Studio line launch"]}>
      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,0.85fr)] lg:divide-x lg:divide-border">
        {/* Editor */}
        <div className="flex flex-col">
          <div className="flex h-[340px] items-center justify-center bg-muted/60 p-6 md:h-[420px]">
            <Creative {...creativeProps} onMove={setPos} className="h-full max-w-full rounded-md shadow-sm" />
          </div>
          <p className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-2xs text-muted-foreground">
            <Move className="size-3" aria-hidden="true" /> Drag the headline, or focus it and use the arrow keys.
          </p>
          <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium">Headline</span>
              <Input value={headline} maxLength={40} onChange={(e) => setHeadline(e.target.value)} />
            </label>
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
                    <img src={p.src} alt="" width={36} height={36} className="size-full object-cover" />
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
                      brand === s.hex ? "border-foreground" : "border-transparent",
                    )}
                    style={{ background: s.hex }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium" id="organic-format">Format</span>
              <ToggleGroup
                aria-labelledby="organic-format"
                variant="outline"
                size="sm"
                value={format}
                onValueChange={(v) => v && setFormat(v as Format)}
              >
                {(Object.keys(RATIO) as Format[]).map((f) => (
                  <ToggleGroupItem key={f} value={f} className="px-3 tabular-nums">
                    {f}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Post preview */}
        <div className="flex flex-col border-t border-border lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium" id="organic-platform">Preview</span>
            <ToggleGroup
              aria-labelledby="organic-platform"
              variant="outline"
              size="sm"
              value={platform}
              onValueChange={(v) => v && setPlatform(v as Platform)}
            >
              <ToggleGroupItem value="instagram">Instagram</ToggleGroupItem>
              <ToggleGroupItem value="tiktok">TikTok</ToggleGroupItem>
              <ToggleGroupItem value="linkedin">LinkedIn</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex min-h-[520px] flex-1 items-center justify-center bg-card/50 p-5">
            <PostFrame
              platform={platform}
              format={format}
              scheduled={scheduled}
              creative={<Creative {...creativeProps} className="w-full" />}
            />
          </div>
        </div>

        {/* Organic agent */}
        <div className="flex min-h-[420px] flex-col border-t border-border lg:border-t-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium">Organic agent</span>
            {used.length > 0 && (
              <Button variant="ghost" size="xs" onClick={reset}>
                <RotateCcw aria-hidden="true" /> Reset
              </Button>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3" aria-live="polite">
            {messages.map((m) => (
              <Message key={m.id} role={m.role} avatar={m.role === "assistant" ? "O" : "Y"}>
                {m.typed ? <Typed text={m.text} /> : m.text}
              </Message>
            ))}
            {thinking && <Shimmer className="pl-10 text-sm">Reading your brand kit…</Shimmer>}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border p-3">
            {pending.length > 0 ? (
              pending.map((a) => (
                <Suggestion key={a} suggestion={a} onClick={runAction} disabled={thinking} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">That's the whole script. Reset to run it again.</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="border-t border-border p-4">
        <p className="mb-3 text-xs font-medium">
          Last 14 days on {platform === "tiktok" ? "TikTok" : platform === "linkedin" ? "LinkedIn" : "Instagram"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {METRICS.map((m) => (
            <MetricTile
              key={m.key}
              label={m.label}
              format={m.format}
              series={BASE[m.key].map((v) => v * SCALE[platform][m.key])}
              expanded={expanded === m.key}
              onExpand={() => setExpanded(m.key)}
            />
          ))}
        </div>
      </div>
    </ProductWindow>
  );
}
