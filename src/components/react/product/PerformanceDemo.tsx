import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message } from "@/components/ai-elements/message";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import { ProductWindow, Typed, wait } from "./shared";
import { cn } from "@/lib/utils";

// ── Sample data ─────────────────────────────────────────────────────────────
const ACTUAL = [14.2, 14.0, 14.5, 13.8, 14.1, 14.4, 14.0, 15.1, 16.2, 17.0, 17.8, 18.3, 18.9, 19.1];
const BASELINE = [19.4, 19.8, 20.1, 20.5, 20.7, 21.0, 21.2];
const OPTIMIZED = [18.2, 17.1, 16.3, 15.6, 15.2, 14.9, 14.7];
const day = (i: number) => `Sep ${8 + i}`;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const CPA_RISE = Math.round((avg(ACTUAL.slice(7)) / avg(ACTUAL.slice(0, 7)) - 1) * 100);
const CPA_DROP = Math.round((1 - OPTIMIZED.at(-1)! / ACTUAL.at(-1)!) * 100);

type AdSet = { name: string; status: "Active" | "Paused" | "Learning"; budget: number; cpa: number | null; roas: number | null };
const AD_SETS: AdSet[] = [
  { name: "Prospecting · Broad", status: "Active", budget: 420, cpa: 18.4, roas: 3.1 },
  { name: "Retargeting · 30 days", status: "Active", budget: 260, cpa: 11.2, roas: 4.6 },
  { name: "Lookalike · Buyers 2%", status: "Active", budget: 380, cpa: 31.9, roas: 1.4 },
  { name: "Creative #3 · Static carousel", status: "Active", budget: 0, cpa: 36.5, roas: 1.1 },
];
const AD_SETS_AFTER: AdSet[] = [
  AD_SETS[0],
  { ...AD_SETS[1], budget: 336 },
  { ...AD_SETS[2], budget: 304 },
  { ...AD_SETS[3], status: "Paused" },
  { name: "Variant A · Hook “Hear the drop”", status: "Learning", budget: 0, cpa: null, roas: null },
  { name: "Variant B · Hook “Studio, anywhere”", status: "Learning", budget: 0, cpa: null, roas: null },
];
const BY_AD_SET = AD_SETS.slice(0, 3).map((a) => ({ name: a.name.split(" · ")[0], cpa: a.cpa }));

const lineConfig = {
  cpa: { label: "CPA", color: "var(--chart-1)" },
  projected: { label: "Projected", color: "var(--chart-1)" },
} satisfies ChartConfig;
const barConfig = { cpa: { label: "CPA", color: "var(--chart-1)" } } satisfies ChartConfig;

type Step = "idle" | "analyzing" | "analyzed" | "recommending" | "awaiting" | "applied" | "rejected";
type Msg = { id: number; role: "user" | "assistant"; text: string; typed?: boolean; chart?: boolean; confirm?: boolean };

export function PerformanceDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("idle");
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "assistant", text: "I’m watching Summer Sale on Meta. Ask me what changed, or what to do next." },
  ]);
  const [thinking, setThinking] = useState(false);
  // Suggestion, Reset, and Confirmation buttons remove themselves on click; park focus on the log.
  const logRef = useRef<HTMLDivElement>(null);
  const keepFocus = () => logRef.current?.focus({ preventScroll: true });

  const say = (m: Omit<Msg, "id">) => setMessages((all) => [...all, { ...m, id: all.length }]);

  const ask = async (q: string) => {
    keepFocus();
    say({ role: "user", text: q });
    if (step === "idle") {
      setStep("analyzing");
      await wait(1400);
      setStep("analyzed");
      say({
        role: "assistant",
        typed: true,
        chart: true,
        text: `CPA is up ${CPA_RISE}% week over week. Most of it comes from Lookalike · Buyers 2%: creative #3 is fatigued at a frequency of 4.8, and the ad set converts at 2.3× the account CPA.`,
      });
    } else {
      setStep("recommending");
      setThinking(true);
      await wait(800);
      setThinking(false);
      say({
        role: "assistant",
        typed: true,
        confirm: true,
        text: `Three changes: move 20% of Lookalike’s budget to Retargeting, pause creative #3, and launch two variants of the winning hook. Projected CPA drops ${CPA_DROP}% within 7 days.`,
      });
      await wait(reduce ? 0 : 1200);
      setStep("awaiting");
    }
  };

  const respond = (approved: boolean) => {
    keepFocus();
    setStep(approved ? "applied" : "rejected");
    say({
      role: "assistant",
      typed: true,
      text: approved
        ? "Done. Budget moved, creative #3 paused, two variants launched in learning. I’ll write results back to the account on Sep 28."
        : "Understood. Nothing changed in the account. I’ll keep watching and flag it again if CPA keeps climbing.",
    });
  };

  const reset = () => {
    keepFocus();
    setStep("idle");
    setThinking(false);
    setMessages((m) => m.slice(0, 1));
  };

  const applied = step === "applied";
  const rows = applied ? AD_SETS_AFTER : AD_SETS;
  const projection = applied ? OPTIMIZED : BASELINE;
  const chartData = [
    ...ACTUAL.map((cpa, i) => ({ day: day(i), cpa, projected: i === ACTUAL.length - 1 ? cpa : undefined })),
    ...projection.map((projected, i) => ({ day: day(ACTUAL.length + i), cpa: undefined, projected })),
  ];
  const suggestion =
    step === "idle" ? "Why did CPA rise this week?" : step === "analyzed" ? "What should we change?" : null;
  const toolState = step === "analyzing" ? "running" : "output-available";

  return (
    <ProductWindow path={["Continuum", "Performance+", "Summer Sale · Meta"]}>
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:divide-x lg:divide-border">
        {/* Jaina */}
        <div className="flex h-[560px] flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium">Jaina</span>
            {step !== "idle" && (
              <Button variant="ghost" size="xs" onClick={reset} disabled={step === "analyzing" || step === "recommending"}>
                <RotateCcw aria-hidden="true" /> Reset
              </Button>
            )}
          </div>
          <Conversation className="flex-1">
            <ConversationContent ref={logRef} tabIndex={-1} className="gap-3 p-3 outline-none md:px-3 lg:px-3" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className="flex flex-col gap-3">
                  {m.role === "assistant" && m.chart && (
                    <Tool type="analyze_campaigns" state={toolState} defaultOpen>
                      <ToolHeader title="analyze_campaigns" />
                      <ToolContent>
                        <ToolInput value={{ campaign: "Summer Sale", window: "Sep 15 to Sep 21", compare: "previous 7 days" }} />
                        <ToolOutput value={{ cpa_change: `+${CPA_RISE}%`, driver: "Lookalike · Buyers 2%", frequency: "4.8 on creative #3" }} />
                      </ToolContent>
                    </Tool>
                  )}
                  <Message role={m.role} avatar={m.role === "assistant" ? "J" : "Y"}>
                    {m.typed ? <Typed text={m.text} /> : m.text}
                    {m.chart && (
                      <ChartContainer config={barConfig} className="mt-2 aspect-auto h-24 w-full">
                        <BarChart data={BY_AD_SET} layout="vertical" margin={{ left: 0, right: 8 }} accessibilityLayer={false}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={82} tickLine={false} axisLine={false} />
                          <Bar dataKey="cpa" fill="var(--color-cpa)" radius={3} isAnimationActive={!reduce} />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </Message>
                  {m.confirm && (step === "awaiting" || step === "applied" || step === "rejected") && (
                    <Confirmation
                      approval={step === "awaiting" ? { id: "apply" } : { id: "apply", approved: applied }}
                      state={step === "awaiting" ? "approval-requested" : "approval-responded"}
                      className="bg-background"
                    >
                      <ConfirmationTitle>
                        <ConfirmationRequest>Apply 3 changes to Summer Sale on Meta?</ConfirmationRequest>
                        <ConfirmationAccepted>Approved. 3 changes applied to Summer Sale.</ConfirmationAccepted>
                        <ConfirmationRejected>Rejected. The account was not changed.</ConfirmationRejected>
                      </ConfirmationTitle>
                      <ConfirmationActions>
                        <ConfirmationAction variant="outline" onClick={() => respond(false)}>
                          Reject
                        </ConfirmationAction>
                        <ConfirmationAction variant="cta" onClick={() => respond(true)}>
                          Apply changes
                        </ConfirmationAction>
                      </ConfirmationActions>
                    </Confirmation>
                  )}
                </div>
              ))}
              {step === "analyzing" && (
                <Tool type="analyze_campaigns" state="running" defaultOpen>
                  <ToolHeader title="analyze_campaigns" />
                  <ToolContent>
                    <ToolInput value={{ campaign: "Summer Sale", window: "Sep 15 to Sep 21", compare: "previous 7 days" }} />
                  </ToolContent>
                </Tool>
              )}
              {thinking && <Shimmer className="pl-10 text-sm">Checking budget pacing…</Shimmer>}
            </ConversationContent>
          </Conversation>
          <div className="flex min-h-14 flex-wrap items-center gap-2 border-t border-border p-3">
            {suggestion ? (
              <Suggestion suggestion={suggestion} onClick={ask} disabled={thinking} />
            ) : (
              <p className="text-xs text-muted-foreground">
                {step === "awaiting" ? "Waiting for your approval." : step === "applied" || step === "rejected" ? "Reset to run it again." : "Jaina is working…"}
              </p>
            )}
          </div>
        </div>

        {/* Optimizer */}
        <div className="flex flex-col border-t border-border lg:border-t-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium">Optimizer</span>
            <Badge variant={applied ? "success" : "muted"}>{applied ? "3 changes applied" : "Watching"}</Badge>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-border border-b border-border">
            {[
              { label: "CPA today", value: `$${ACTUAL.at(-1)!.toFixed(2)}`, note: applied ? `$${OPTIMIZED.at(-1)!.toFixed(2)} in 7d` : `$${BASELINE.at(-1)!.toFixed(2)} in 7d`, good: applied },
              { label: "ROAS", value: "2.4", note: applied ? "3.1 projected" : "2.1 projected", good: applied },
              { label: "Daily spend", value: "$1,060", note: "unchanged", good: null },
            ].map((k) => (
              <div key={k.label} className="px-4 py-3">
                <dt className="text-xs text-muted-foreground">{k.label}</dt>
                <dd className="text-lg font-semibold tabular-nums">{k.value}</dd>
                <dd
                  className={cn(
                    "text-2xs font-medium tabular-nums",
                    k.good === true ? "text-emerald-700" : k.good === false ? "text-red-700" : "text-muted-foreground",
                  )}
                >
                  {k.note}
                </dd>
              </div>
            ))}
          </dl>
          <div className="px-2 pt-3">
            <p className="px-2 text-xs font-medium">CPA, with 7-day projection</p>
            <ChartContainer config={lineConfig} className="aspect-auto h-44 w-full">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} accessibilityLayer={false}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} minTickGap={32} />
                <YAxis width={36} tickLine={false} axisLine={false} domain={[10, 22]} tickFormatter={(v) => `$${v}`} />
                <ReferenceLine x={day(ACTUAL.length - 1)} stroke="var(--border)" strokeDasharray="3 3" />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line dataKey="cpa" type="monotone" stroke="var(--color-cpa)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line
                  dataKey="projected"
                  type="monotone"
                  stroke={applied ? "var(--success)" : "var(--color-projected)"}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={!reduce}
                  animationDuration={900}
                />
              </LineChart>
            </ChartContainer>
          </div>
          <div className="mt-auto overflow-x-auto border-t border-border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Ad set</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Daily budget</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => {
                  const before = AD_SETS[i];
                  const changed = applied && (!before || before.budget !== r.budget || before.status !== r.status);
                  return (
                    <TableRow key={r.name} className={cn(changed && "bg-primary/6")}>
                      <TableCell className="max-w-[200px] truncate font-medium">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "Active" ? "success" : r.status === "Paused" ? "muted" : "violet"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.budget ? `$${r.budget}` : "Shared"}
                        {changed && before && before.budget !== r.budget && (
                          <span className="ml-1 text-2xs text-muted-foreground line-through">${before.budget}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.cpa ? `$${r.cpa.toFixed(2)}` : "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.roas ?? "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </ProductWindow>
  );
}
