import { useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CheckCircle2, Circle, CircleDot, FileUp, FileVideo, Loader2, Package, PauseCircle, Play, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EASE, Pilot, ProductWindow, RATIO, RunItCta, useAutoplay, wait, type Format, type Photo } from "./shared";
import { cn } from "@/lib/utils";

type FieldKey = "headline" | "keyColor" | "product" | "price";
type Values = Partial<Record<FieldKey, string>>;
type Row = { id: string; parentId: string | null; label: string; values: Values };
type Tab = "templates" | "render" | "renders";
type Step = "review" | "deliver" | "confirm" | "running";
type Decision = "pending" | "publishing" | "published" | "previewed" | "rejected";

// ── Forge's shapes, as the app names them ───────────────────────────────────
const TABS: [Tab, string][] = [["templates", "Templates"], ["render", "Render"], ["renders", "Render ledger"]];
const STEPS: [Step, string][] = [["review", "Review"], ["deliver", "Deliver"], ["confirm", "Confirm"], ["running", "Running"]];
// ForgeProjectDrop's accept list, After Effects only.
const ACCEPT = [".aep", ".aepx", ".aet", ".zip", ".ttf", ".otf"];
const FORMATS: Format[] = ["1:1", "4:5", "9:16"];
const SET = "Studio launch promo";
const FILES = 3 * FORMATS.length;
const QUESTIONS = [
  { label: "Headline", reason: "Text layer in every composition", options: ["Headline", "Price", "Keep as designed"] },
  { label: "Hero image", reason: "Footage layer, one per format", options: ["Product image", "Keep as designed"] },
];
const FIELDS: { key: FieldKey; label: string; width: string }[] = [
  { key: "headline", label: "Headline", width: "min-w-[128px] sm:min-w-[164px]" },
  { key: "keyColor", label: "Key color", width: "min-w-[124px]" },
  { key: "product", label: "Product image", width: "min-w-[156px]" },
  { key: "price", label: "Price", width: "min-w-[84px]" },
];
const ROWS: Row[] = [
  { id: "base", parentId: null, label: "Base", values: { headline: "Hear the drop.", keyColor: "#5a48f9", product: "headphones", price: "$149" } },
  { id: "b", parentId: "base", label: "Base · B", values: { keyColor: "#c2410c", price: "$139" } },
  { id: "c", parentId: "base", label: "Base · C", values: { headline: "30 hours, one charge", keyColor: "#0b7a5c" } },
];
// The farm's ticks: [row, pct]. A row is queued at 0, rendering below 100, finished at 100.
const RUN = [[0, 42], [1, 42], [0, 100], [2, 42], [1, 100], [2, 100]] as const;
const JOB: Record<"queued" | "rendering" | "finished", "muted" | "warning" | "success"> = { queued: "muted", rendering: "warning", finished: "success" };
// PendingApprovals' words and tones.
const DECISION: Record<Decision, { label: string; tone: string }> = {
  pending: { label: "Waiting on you", tone: "bg-warning/10 text-warning border-warning/20" },
  publishing: { label: "Publishing…", tone: "bg-primary/10 text-foreground border-primary/20" },
  published: { label: "Published, paused", tone: "bg-success/10 text-success border-success/20" },
  previewed: { label: "Approved — Meta writes are off", tone: "bg-primary/10 text-foreground border-primary/20" },
  rejected: { label: "Rejected", tone: "bg-muted text-muted-foreground" },
};
const OUTCOME: Partial<Record<Decision, string>> = {
  publishing: "Approved. Publishing now — the outcome appears here in a moment.",
  published: "Three new ads on Lookalike · Buyers 2%, all paused. The files stay in the Library.",
  previewed: "Approved — Meta writes are switched off for this brand, so nothing was published.",
  rejected: "Rejected. Nothing was published. The files stay in the Library.",
};

// Same semantics as Forge's renderRequestRows: walk root → row, each row's own values win.
function effectiveValues(rows: Row[], id: string): Values {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const chain: Row[] = [];
  for (let r = byId.get(id); r; r = r.parentId ? byId.get(r.parentId) : undefined) chain.unshift(r);
  return Object.assign({}, ...chain.map((r) => r.values));
}

const RatioGlyph = ({ format }: { format: Format }) => (
  <span
    aria-hidden="true"
    className={cn("inline-block shrink-0 rounded-[1px] border border-current", RATIO[format] >= 1 ? "w-3" : "h-3")}
    style={{ aspectRatio: RATIO[format] }}
  />
);

const Formats = () => (
  <span className="flex items-center gap-1.5 text-muted-foreground">
    {FORMATS.map((f) => <RatioGlyph key={f} format={f} />)}
    <span className="sr-only">{FORMATS.join(", ")}</span>
  </span>
);

/** DeliveryChain: the Library always, then a new paused ad on the Meta ad set. */
const Chain = ({ short }: { short?: boolean }) => (
  <span>
    Library <Check className="inline size-3 -translate-y-px text-success" aria-label="saved" />
    <span className="text-muted-foreground">
      {" · "}Meta ›<span className={cn(short && "hidden sm:inline")}> Aurel Audio › Studio launch › Lookalike · Buyers 2% ›</span>
    </span>{" "}
    new paused ad
  </span>
);

// ── The rendered creative (one MP4 per format; the loop stands in for its motion) ──
function PromoCreative({ v, photo, format, loop }: { v: Values; photo?: Photo; format: Format; loop?: boolean }) {
  const key = v.keyColor || "#16162a";
  const still = "motion-reduce:animate-none";
  return (
    <div className="@container flex w-full flex-col overflow-hidden bg-white text-[#16162a] shadow-sm" style={{ aspectRatio: RATIO[format] }}>
      <div className="flex h-[12%] shrink-0 items-center justify-center text-[5cqw] font-semibold tracking-tight text-white" style={{ background: key }}>
        Aurel Audio
      </div>
      <div className="relative min-h-0 flex-1 px-[5cqw] pt-[5cqw]">
        {photo && <img src={photo.src} alt="" width={640} height={640} loading="lazy" className="size-full rounded-[1cqw] object-cover" />}
        {v.price && (
          <span
            className={cn("absolute right-[2cqw] top-[2cqw] flex size-[22cqw] items-center justify-center rounded-full text-[6.5cqw] font-bold tabular-nums text-white", loop && `forge-loop-pop ${still}`)}
            style={{ background: key }}
          >
            {v.price}
          </span>
        )}
      </div>
      <p className={cn("px-[5cqw] py-[4cqw] text-center text-[8cqw] font-bold uppercase leading-none", loop && `forge-loop-rise ${still}`)}>
        {v.headline || " "}
      </p>
    </div>
  );
}

// ── Demo ────────────────────────────────────────────────────────────────────
export function AutomationDemo({ photos }: { photos: Photo[] }) {
  const [tab, setTab] = useState<Tab>("templates");
  const [tpl, setTpl] = useState<"empty" | "reading" | "mapping" | "published">("empty");
  const [font, setFont] = useState("");
  const [rows, setRows] = useState(ROWS);
  const [selected, setSelected] = useState("b");
  const [format, setFormat] = useState<Format>("4:5");
  const [step, setStep] = useState<Step | null>(null);
  const [final, setFinal] = useState(false);
  const [writes, setWrites] = useState(true);
  const [progress, setProgress] = useState([0, 0, 0]);
  const [decision, setDecision] = useState<Decision>("pending");

  const photoByKey = new Map(photos.map((p) => [p.key, p]));
  const running = step === "running";
  const finished = running && progress.every((p) => p === 100);
  const waiting = finished && decision === "pending" ? rows.length : 0;
  const stepIndex = STEPS.findIndex(([id]) => id === step);

  // Every beat is the handler a click runs; the script below only calls them in order.
  const drop = async () => {
    setTpl("reading");
    await wait(1400);
    setTpl("mapping");
  };
  const apply = () => setTpl("published");
  const openTray = () => setStep("review");
  const next = async () => {
    if (step !== "confirm") return setStep(step === "review" ? "deliver" : "confirm");
    setStep("running");
    for (const [i, pct] of RUN) {
      await wait(450);
      setProgress((p) => p.map((v, j) => (j === i ? pct : v)));
    }
  };
  // A click that unmounts its own button hands focus on, so a keyboard visitor is never dropped to <body>.
  const focus = (id: string) => document.getElementById(id)?.focus({ preventScroll: true });
  const go = (t: Tab) => {
    setTab(t);
    focus(`forge-tab-${t}`);
  };
  const decide = async (approve: boolean) => {
    focus("forge-outcome");
    if (!approve) return setDecision("rejected");
    setDecision("publishing");
    await wait(900);
    setDecision(writes ? "published" : "previewed");
  };
  const setValue = (row: Row, key: FieldKey, value: string) =>
    setRows((all) =>
      all.map((r) => {
        if (r.id !== row.id) return r;
        const values = { ...r.values, [key]: value };
        // A variation that types its base's value back stops overriding it.
        if (r.parentId && effectiveValues(all, r.parentId)[key] === value) delete values[key];
        return { ...r, values };
      }),
    );

  // In view: read the project, answer it, render three rows and stop at the approval.
  const windowRef = useRef<HTMLDivElement>(null);
  const act = useRef({ drop, apply, openTray, next });
  act.current = { drop, apply, openTray, next };
  useAutoplay(windowRef, async (alive) => {
    const beats: [number, () => unknown][] = [
      [700, () => act.current.drop()],
      [2000, () => setFont("geist")],
      [900, () => act.current.apply()],
      [900, () => setTab("render")], // setTab, not go(): the script never moves the visitor's focus.
      [1100, () => act.current.openTray()],
      [1000, () => act.current.next()],
      [2400, () => act.current.next()],
      [700, () => setFinal(true)],
      [900, () => act.current.next()],
      [3800, () => setTab("renders")],
    ];
    for (const [ms, beat] of beats) {
      await wait(ms);
      if (!alive()) return;
      beat();
    }
  });

  const current = rows.find((r) => r.id === selected) ?? rows[0];
  const currentValues = effectiveValues(rows, current.id);
  const tabLabel = TABS.find(([id]) => id === tab)![1];
  const done = progress.filter((p) => p === 100).length;
  const announce =
    tab === "renders" && decision !== "pending"
      ? DECISION[decision].label
      : running
        ? `${done} of ${rows.length} renders finished`
        : tpl === "reading"
          ? "Reading layers"
          : tpl === "mapping"
            ? "Needs your answer"
            : "";

  const select = "h-7 rounded-md border border-input bg-background px-1.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
  const ring = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  // ── Templates: drop the project, answer what it asks, publish ──────────────
  const templates = (
    <div className="grid flex-1 content-start gap-4 p-3 text-xs sm:p-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={drop}
          disabled={tpl !== "empty"}
          focusableWhenDisabled
          className="h-auto w-full flex-col gap-2 whitespace-normal rounded-lg border-dashed py-5 text-center aria-disabled:opacity-50"
        >
          <span className="flex items-center gap-2 text-sm">
            <FileUp aria-hidden="true" /> New template
          </span>
          <span className="max-w-64 text-xs font-normal text-muted-foreground">
            Drop an After Effects project, its collected folder or a ZIP, or click to choose files.
          </span>
          <span className="flex flex-wrap justify-center gap-1 font-mono text-2xs font-normal text-muted-foreground">
            {ACCEPT.map((x) => (
              <span key={x} className="rounded-sm bg-muted px-1">{x}</span>
            ))}
          </span>
        </Button>
        {tpl !== "empty" && (
          <motion.div
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-2xs">
                <FileVideo className="size-3.5 text-muted-foreground" aria-hidden="true" /> aurel_launch.aep
              </span>
              {tpl === "reading" ? (
                <Badge variant="muted"><Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Reading layers…</Badge>
              ) : tpl === "mapping" ? (
                <Badge variant="warning"><PauseCircle aria-hidden="true" /> Needs your answer</Badge>
              ) : (
                <Badge variant="success"><CheckCircle2 aria-hidden="true" /> Published</Badge>
              )}
            </div>
            {tpl === "reading" ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/20" role="progressbar" aria-label="Reading layers" aria-valuetext="Working out how much there is to do">
                <div className="h-full w-1/3 animate-[forge-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-60" />
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">3 formats · 14 layers</p>
                <div className="flex items-end gap-3">
                  {FORMATS.map((f) => (
                    <figure key={f} className="flex w-[calc(var(--r)*5rem)] flex-col items-center gap-1 sm:w-[calc(var(--r)*7rem)]" style={{ "--r": RATIO[f] } as CSSProperties}>
                      <PromoCreative v={rows[0].values} photo={photoByKey.get(rows[0].values.product ?? "")} format={f} />
                      <figcaption className="flex items-center gap-1 text-2xs text-muted-foreground">
                        <RatioGlyph format={f} /> {f}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {tpl === "empty" || tpl === "reading" ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-muted-foreground md:self-start">
          Forge reads every layer. A layer it can't map, or a font it doesn't hold, stops and asks here.
        </p>
      ) : (
        <motion.section
          aria-label="Questions"
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <ul className="flex flex-col gap-2" aria-label="Mapping questions">
            {QUESTIONS.map((q) => (
              <li key={q.label} className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span>{q.label}</span>
                  <span className="text-muted-foreground"> · 3 formats</span>
                  <span className="block truncate text-2xs text-muted-foreground">{q.reason}</span>
                </span>
                <select aria-label={`Field for ${q.label}`} defaultValue={q.options[0]} disabled={tpl === "published"} className={cn(select, "w-32 sm:w-44")}>
                  {q.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 rounded-md border border-warning/40 bg-warning/5 p-2">
            <p className="text-muted-foreground">One font is missing. Pick a face you already hold, or add the real file.</p>
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">Aurel Grotesk Bold</span>
              <select aria-label="Face to use for Aurel Grotesk Bold" value={font} onChange={(e) => setFont(e.target.value)} disabled={tpl === "published"} className={cn(select, "w-48 sm:w-52")}>
                <option value="">Leave unresolved</option>
                <option value="geist">Geist Bold · closest width</option>
                <option value="satoshi">Satoshi Bold · same weight</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tpl === "published" ? (
              <Button size="sm" variant="cta" onClick={() => go("render")}>
                Open in Render <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button size="xs" onClick={apply} disabled={!font}>
                Apply answers
              </Button>
            )}
            <span className="text-muted-foreground">
              {tpl === "published" ? "Published. Its rows open in Render." : font ? "The build carries on from here." : "Pick a face to carry on."}
            </span>
          </div>
        </motion.section>
      )}
    </div>
  );

  // ── Render: the rows, then the tray docked under them ──────────────────────
  const trayBody =
    step === "review" ? (
      <>
        <p className="font-medium">{rows.length} of {rows.length} rows ready to render</p>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-1.5">
              <span className="w-20 shrink-0 truncate">{r.label}</span>
              <Formats />
              <span className="text-muted-foreground">{FORMATS.length} files · MP4</span>
              <Badge variant="success" className="ml-auto">Ready</Badge>
            </li>
          ))}
        </ul>
      </>
    ) : step === "deliver" ? (
      <>
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Each row goes to</p>
        <p className="leading-6">
          <Chain /> <Badge variant="muted">held for approval</Badge> <Pilot />
        </p>
        <p className="text-muted-foreground">
          Approval happens in the Render ledger. Meta gets the ad, paused, only after a person approves.
        </p>
        <div className="mt-auto hidden items-center justify-between gap-3 rounded-md border border-border p-2 sm:flex">
          <span>
            <span className="block font-medium">Allow real Meta writes</span>
            <span className="text-muted-foreground">
              {writes ? "Approved renders publish to this brand’s ad account." : "Approved renders are previewed only — nothing reaches Ads Manager."}
            </span>
          </span>
          <Switch checked={writes} onCheckedChange={(v) => setWrites(v)} aria-label="Allow real Meta writes for this brand" />
        </div>
      </>
    ) : step === "confirm" ? (
      <>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">Render as</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {([[false, "Proof", "For review. Recorded as a proof."], [true, "Final", "Ready to go. Recorded as final."]] as const).map(([value, label, hint]) => (
              <label key={label} className="flex cursor-pointer flex-col gap-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <input type="radio" name="forge-render-as" checked={final === value} onChange={() => setFinal(value)} className="size-3.5 accent-[var(--primary)]" />
                  {label}
                </span>
                <span className="pl-5.5 text-muted-foreground">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <ul aria-label="Output per row" className="divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-1.5">
              <span className="w-20 shrink-0 truncate font-medium">{r.label}</span>
              <Formats />
              <span className="text-muted-foreground">MP4 · H.264</span>
            </li>
          ))}
        </ul>
      </>
    ) : (
      <ul aria-label="Renders" className="divide-y divide-border">
        {rows.map((r, i) => {
          const pct = progress[i];
          const status = pct === 100 ? "finished" : pct ? "rendering" : "queued";
          return (
            <li key={r.id} className="flex items-center gap-3 py-2">
              <span className="w-20 shrink-0 truncate font-medium">{r.label}</span>
              <span className="flex flex-1 gap-0.5" role="progressbar" aria-label={`${r.label} render`} aria-valuenow={pct}>
                {Array.from({ length: 10 }, (_, t) => (
                  <span key={t} className={cn("h-2 flex-1 rounded-[1px] transition-colors duration-300 motion-reduce:transition-none", t < pct / 10 ? "bg-primary" : "bg-muted")} />
                ))}
              </span>
              <Badge variant={JOB[status]} className="w-28">
                {status === "rendering" && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {status}
                {status === "rendering" ? ` ${pct}%` : ""}
              </Badge>
            </li>
          );
        })}
      </ul>
    );

  const trayAction =
    step === "running" ? (
      <Button size="sm" variant={finished ? "cta" : "outline"} onClick={() => go("renders")} disabled={!finished} focusableWhenDisabled className="aria-disabled:opacity-50">
        Open Render ledger <ArrowRight aria-hidden="true" />
      </Button>
    ) : step === "confirm" ? (
      <Button size="sm" variant="cta" onClick={next}>
        <Play aria-hidden="true" /> Render {FILES} files
      </Button>
    ) : (
      <Button size="sm" onClick={next}>
        Next: {step === "review" ? "deliver" : "confirm"}
      </Button>
    );

  const render = (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:divide-x lg:divide-border">
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium">{SET}</span>
            {/* Where the run came from: Jaina queued it when Lookalike's creative tired (Pilot, forgeRenderTools). */}
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">Queued by Jaina · Lookalike creative tiring</span>
          </span>
          <Button variant="cta" size="sm" onClick={openTray} disabled={step !== null} focusableWhenDisabled className="aria-disabled:opacity-50">
            <Play aria-hidden="true" /> Render {rows.length} rows
          </Button>
        </div>
        <Table className="text-xs" containerClassName="scroll-pl-[104px]">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-[104px] bg-background">Name</TableHead>
              {FIELDS.map((f) => (
                <TableHead key={f.key} className={cn(f.width, f.key !== "headline" && "hidden sm:table-cell")}>{f.label}</TableHead>
              ))}
              <TableHead>Formats</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const values = effectiveValues(rows, row.id);
              const isSelected = row.id === selected;
              const changed = Object.keys(row.values).length;
              return (
                <TableRow key={row.id} data-state={isSelected ? "selected" : undefined} className={cn(isSelected ? "bg-primary/10" : "hover:bg-muted/50")}>
                  <TableCell className={cn("sticky left-0 z-10 bg-background", isSelected && "bg-[color-mix(in_oklch,var(--primary)_10%,var(--background))] shadow-[inset_3px_0_0_var(--primary)]")}>
                    <button
                      type="button"
                      onClick={() => setSelected(row.id)}
                      aria-pressed={isSelected}
                      className={cn("flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-md text-left", ring, row.parentId && "border-l border-border pl-2.5")}
                    >
                      <span className="font-medium">{row.label}</span>
                      {row.parentId && (
                        <span className="rounded-sm bg-muted px-1.5 font-mono text-2xs text-muted-foreground">inherits · {changed} changed</span>
                      )}
                    </button>
                  </TableCell>
                  {FIELDS.map((f) => {
                    const value = values[f.key] ?? "";
                    const label = `${row.label} ${f.label}`;
                    return (
                      <TableCell
                        key={f.key}
                        className={cn(f.key !== "headline" && "hidden sm:table-cell", row.parentId && f.key in row.values && (isSelected ? "bg-primary/15" : "bg-primary/5"))}
                      >
                        {f.key === "keyColor" ? (
                          <span className="flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-1.5 focus-within:ring-3 focus-within:ring-ring/50">
                            <input type="color" aria-label={label} value={value} disabled={running} onChange={(e) => setValue(row, f.key, e.target.value)} className="size-5 cursor-pointer rounded border-0 bg-transparent p-0" />
                            <span className="font-mono text-2xs">{value}</span>
                          </span>
                        ) : f.key === "product" ? (
                          <span className="flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background pl-1 focus-within:ring-3 focus-within:ring-ring/50">
                            {photoByKey.get(value) && <img src={photoByKey.get(value)!.src} alt="" width={24} height={24} loading="lazy" className="size-6 rounded object-cover" />}
                            <select aria-label={label} value={value} disabled={running} onChange={(e) => setValue(row, f.key, e.target.value)} className="h-full flex-1 cursor-pointer bg-transparent pr-1 text-xs outline-none">
                              {photos.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                          </span>
                        ) : (
                          <Input aria-label={label} value={value} disabled={running} autoComplete="off" onChange={(e) => setValue(row, f.key, e.target.value)} />
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell><Formats /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {step ? (
          <motion.section
            aria-label="Review and render"
            className="flex flex-1 flex-col border-t border-border bg-background text-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <header className="flex h-10 shrink-0 items-center gap-3 border-b border-border px-3">
              <h4 className="shrink-0 font-mono text-2xs font-medium uppercase tracking-wide">
                {running ? `${rows.length} renders queued` : `Render ${rows.length} rows`}
              </h4>
              <p className="min-w-0 flex-1 truncate text-muted-foreground">{running ? SET : `${SET} · ${FILES} files`}</p>
              <p className="shrink-0 font-medium sm:hidden">
                <span className="tabular-nums text-muted-foreground">{stepIndex + 1}/4</span> {STEPS[stepIndex][1]}
              </p>
              <ol aria-label="Pre-flight steps" className="hidden shrink-0 items-center gap-1.5 sm:flex">
                {STEPS.map(([id, label], i) => (
                  <li key={id} aria-current={id === step ? "step" : undefined} className={cn("flex items-center gap-1", i > stepIndex ? "text-muted-foreground" : "text-foreground", id === step && "font-medium")}>
                    {i > 0 && <span aria-hidden="true" className="mr-0.5 h-px w-3 bg-border" />}
                    {i < stepIndex || finished ? (
                      <Check className="size-3 text-success" aria-hidden="true" />
                    ) : id === step ? (
                      <CircleDot className="size-3 text-primary" aria-hidden="true" />
                    ) : (
                      <Circle className="size-3" aria-hidden="true" />
                    )}
                    {label}
                  </li>
                ))}
              </ol>
            </header>
            <div className="flex min-h-[208px] flex-1 flex-col gap-2 px-3 py-2 sm:min-h-[168px]">{trayBody}</div>
            <footer className="flex items-center justify-end gap-3 border-t border-border px-3 py-2">
              {finished && <span className="mr-auto truncate text-muted-foreground">{FILES} files in the Library · {rows.length} ads held for approval</span>}
              {trayAction}
            </footer>
          </motion.section>
        ) : (
          <p className="px-3 py-3 text-xs text-muted-foreground">Rows inherit from Base. Edit a cell on a variation to override it.</p>
        )}
      </div>

      {/* Preview */}
      <div className="flex min-w-0 flex-col border-t border-border lg:border-t-0">
        <div className="hidden items-center justify-between gap-2 border-b border-border px-3 py-1.5 lg:flex">
          <span className="truncate text-xs font-medium">{current.label}</span>
          <ToggleGroup variant="outline" size="sm" value={format} onValueChange={(v) => v && setFormat(v as Format)} aria-label="Preview format">
            {FORMATS.map((f) => (
              <ToggleGroupItem key={f} value={f} className="gap-1.5 px-2 tabular-nums">
                <RatioGlyph format={f} /> {f}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="hidden h-[272px] items-center justify-center bg-card/60 p-4 lg:flex">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id + format}
              role="img"
              aria-label={`${current.label} at ${format}: ${currentValues.headline ?? ""} ${currentValues.price ?? ""}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}
              className={format === "1:1" ? "w-[216px]" : format === "4:5" ? "w-[192px]" : "w-[136px]"}
            >
              <PromoCreative v={currentValues} photo={photoByKey.get(currentValues.product ?? "")} format={format} loop />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 lg:border-t lg:border-border">
          {rows.map((row, i) => {
            // Still on the farm: dim and soft, then it develops as its render lands.
            const pending = running && progress[i] < 100;
            const v = effectiveValues(rows, row.id);
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelected(row.id)}
                aria-label={`Preview ${row.label}`}
                aria-pressed={row.id === selected}
                className={cn("w-14 shrink-0 cursor-pointer rounded-md p-0.5 lg:w-16", ring, row.id === selected ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/50")}
              >
                <div className={cn("pointer-events-none transition-[opacity,filter] duration-700 ease-out motion-reduce:transition-none", pending && "opacity-40 blur-[1.5px] grayscale")}>
                  <PromoCreative v={v} photo={photoByKey.get(v.product ?? "")} format="1:1" />
                </div>
              </button>
            );
          })}
          <p className="ml-1 min-w-0 truncate font-mono text-2xs text-muted-foreground lg:hidden">
            {running ? `${done}/${rows.length} rendered` : `${FILES} files · MP4`}
          </p>
        </div>
        <p className="hidden truncate border-t border-border px-3 py-2 font-mono text-2xs text-muted-foreground lg:block">
          studio_launch_{current.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_{format.replace(":", "x")}.mp4
        </p>
      </div>
    </div>
  );

  // ── Render ledger: what waits on a person before it becomes an ad ──────────
  const ledger = (
    <div className="flex flex-1 flex-col gap-3 p-3 text-xs sm:p-4">
      {!finished ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-muted-foreground">
          Nothing waiting on you yet. Finished renders land here, held until a person approves.
        </p>
      ) : (
        <motion.section aria-label="Pending approvals" className="flex flex-col gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
          <h4 className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-warning" aria-hidden="true" />
            <span className="text-sm font-medium">Pending approvals{waiting ? ` (${waiting})` : ""}</span>
            <span className="hidden truncate text-muted-foreground sm:inline">Rendered creatives waiting for a person before they become ads.</span>
          </h4>
          <section aria-label="Approval package, 3 variations" className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-2">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Package className="size-3.5 text-muted-foreground" aria-hidden="true" /> {SET} · {rows.length} variations
              </span>
              <span className="text-muted-foreground">{waiting ? `${waiting} waiting` : "All decided"}</span>
              {decision === "pending" && (
                <span className="flex gap-2 sm:ml-auto">
                  <Button size="sm" onClick={() => decide(true)}>
                    <CheckCircle2 aria-hidden="true" /> Approve all {waiting}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(false)}>
                    <XCircle aria-hidden="true" /> Reject all
                  </Button>
                </span>
              )}
            </header>
            <ul className="flex flex-col gap-2">
              {rows.map((row, i) => {
                const v = effectiveValues(rows, row.id);
                return (
                  <li key={row.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                    <div className="w-12 shrink-0 overflow-hidden rounded-md">
                      <PromoCreative v={v} photo={photoByKey.get(v.product ?? "")} format="1:1" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{row.label}</span>
                        <motion.span key={decision} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE, delay: i * 0.07 }}>
                          <Badge variant="outline" className={DECISION[decision].tone}>{DECISION[decision].label}</Badge>
                        </motion.span>
                      </span>
                      <span className="text-muted-foreground">
                        <Chain short />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
          <p id="forge-outcome" tabIndex={-1} className="text-muted-foreground outline-none">{OUTCOME[decision]}</p>
          {decision !== "publishing" && <RunItCta pending={decision === "pending"} />}
        </motion.section>
      )}
    </div>
  );

  return (
    <ProductWindow ref={windowRef} path={["Continuum", "Forge", tabLabel]} badge={<Pilot />}>
      <div role="tablist" aria-label="Forge" className="flex h-10 items-center gap-1 border-b border-border px-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`forge-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="forge-panel"
            onClick={() => setTab(id)}
            className={cn("inline-flex h-7 cursor-pointer items-center rounded-md px-2.5 text-xs font-medium", ring, tab === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {label}
            {id === "renders" && waiting > 0 && (
              <Badge variant="warning" className="ml-1.5 tabular-nums">
                {waiting}
                <span className="sr-only"> waiting for approval</span>
              </Badge>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="forge-panel" aria-labelledby={`forge-tab-${tab}`} className="flex min-h-[604px] flex-col lg:min-h-[488px]">
        {tab === "templates" ? templates : tab === "render" ? render : ledger}
      </div>
      <p role="status" className="sr-only">{announce}</p>
    </ProductWindow>
  );
}
