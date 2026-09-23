import { useState } from "react";
import { GitFork, Image as ImageIcon, Palette, Play, RotateCcw, Type, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import { ProductWindow, wait } from "./shared";
import { cn } from "@/lib/utils";

type Photo = { key: string; src: string; alt: string; label: string };
type FieldKey = "headline" | "keyColor" | "product" | "price" | "was" | "discount";
type Values = Partial<Record<FieldKey, string>>;
type Row = { id: string; parentId: string | null; label: string; values: Values; cleared: FieldKey[] };
type Ratio = "16:9" | "1:1" | "9:16";
type Phase = "editing" | "rendering" | "rendered" | "delivered" | "held";

// ── Template + sample rows (modeled on Forge's Render tab) ─────────────────
const FIELDS: { key: FieldKey; label: string; kind: "text" | "color" | "image"; width: string }[] = [
  { key: "headline", label: "Headline", kind: "text", width: "min-w-[168px]" },
  { key: "keyColor", label: "Key color", kind: "color", width: "min-w-[140px]" },
  { key: "product", label: "Product image", kind: "image", width: "min-w-[184px]" },
  { key: "price", label: "Price", kind: "text", width: "min-w-[108px]" },
  { key: "was", label: "Was", kind: "text", width: "min-w-[108px]" },
  { key: "discount", label: "Discount", kind: "text", width: "min-w-[108px]" },
];
const KIND_ICON = { text: Type, color: Palette, image: ImageIcon };
const RATIOS: Ratio[] = ["16:9", "1:1", "9:16"];
const START_ROWS: Row[] = [
  {
    id: "base",
    parentId: null,
    label: "Base",
    values: { headline: "Studio sound", keyColor: "#5a48f9", product: "headphones", price: "$149", was: "$199", discount: "-25%" },
    cleared: [],
  },
  { id: "b", parentId: "base", label: "Base · B", values: { keyColor: "#d9482b", price: "$139", discount: "-30%" }, cleared: [] },
  { id: "c", parentId: "base", label: "Base · C", values: { headline: "Time, well kept", keyColor: "#0b7a5c", product: "watch" }, cleared: [] },
];

// Same semantics as Forge's renderRequestRows: walk root → row, drop cleared keys, apply own values.
function effectiveValues(rows: Row[], id: string): Values {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const chain: Row[] = [];
  for (let r = byId.get(id); r; r = r.parentId ? byId.get(r.parentId) : undefined) chain.unshift(r);
  const out: Values = {};
  for (const r of chain) {
    for (const k of r.cleared) delete out[k];
    Object.assign(out, r.values);
  }
  return out;
}
const ownChangeCount = (r: Row) => new Set([...Object.keys(r.values), ...r.cleared]).size;
function forkLabel(rows: Row[], parentId: string) {
  const base = rows.find((r) => r.id === parentId)?.label ?? "Base";
  const taken = new Set(rows.filter((r) => r.parentId === parentId).map((r) => r.label));
  for (const letter of "BCDEFGHIJKLMNOPQRSTUVWXYZ") if (!taken.has(`${base} · ${letter}`)) return `${base} · ${letter}`;
  return `${base} · ${rows.length}`;
}

function RatioGlyph({ ratio }: { ratio: Ratio }) {
  const [w, h] = ratio.split(":").map(Number);
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 rounded-[1px] border border-current", w >= h ? "w-3" : "h-3")}
      style={{ aspectRatio: `${w} / ${h}` }}
    />
  );
}

// ── Rendered creative (what the render farm would output) ──────────────────
function PromoCreative({ v, photo, ratio }: { v: Values; photo?: Photo; ratio: Ratio }) {
  const key = v.keyColor || "#16162a";
  const wide = ratio === "16:9";
  return (
    <div
      className="@container flex w-full flex-col overflow-hidden bg-white text-[#16162a] shadow-sm"
      style={{ aspectRatio: ratio.replace(":", " / ") }}
    >
      <div className="flex h-[13%] shrink-0 items-center justify-center text-[4cqw] font-semibold tracking-tight text-white" style={{ background: key }}>
        Aurel Audio
      </div>
      <div className={cn("relative flex min-h-0 flex-1 items-center gap-[4cqw] p-[5cqw]", !wide && "flex-col justify-center")}>
        <div className={cn("relative min-h-0", wide ? "h-full basis-1/2" : "w-full flex-1")}>
          {photo ? (
            <img src={photo.src} alt={photo.alt} className="size-full rounded-[1cqw] object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center rounded-[1cqw] bg-[#eeecfc] text-[3cqw] text-[#5c5b7a]">
              No image
            </div>
          )}
          {v.discount && (
            <span
              className="absolute -left-[2cqw] -top-[2cqw] flex size-[13cqw] items-center justify-center rounded-full text-[3.6cqw] font-bold text-white"
              style={{ background: key }}
            >
              {v.discount}
            </span>
          )}
        </div>
        <div className={cn("flex flex-col", wide ? "basis-1/2 items-start" : "items-center text-center")}>
          <p className="text-[5.5cqw] font-bold uppercase leading-none">{v.headline || " "}</p>
          <p className="mt-[2cqw] text-[8cqw] font-bold leading-none tabular-nums">{v.price}</p>
          {v.was && <p className="mt-[1cqw] text-[3.4cqw] text-[#5c5b7a] line-through">Before {v.was}</p>}
        </div>
      </div>
      <div className="flex h-[10%] shrink-0 items-center justify-center text-[3.2cqw] font-semibold text-white" style={{ background: key }}>
        Free shipping this week
      </div>
    </div>
  );
}

// ── Demo ────────────────────────────────────────────────────────────────────
export function AutomationDemo({ photos }: { photos: Photo[] }) {
  const [rows, setRows] = useState<Row[]>(START_ROWS);
  const [selected, setSelected] = useState("b");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [phase, setPhase] = useState<Phase>("editing");
  const [rendered, setRendered] = useState(0);

  const photoByKey = new Map(photos.map((p) => [p.key, p]));
  const files = rows.length * RATIOS.length;
  const busy = phase === "rendering";

  const edit = (fn: (rows: Row[]) => Row[]) => {
    setRows(fn);
    setPhase("editing");
    setRendered(0);
  };

  const setValue = (row: Row, key: FieldKey, value: string) =>
    edit((all) =>
      all.map((r) => {
        if (r.id !== row.id) return r;
        const values = { ...r.values, [key]: value };
        const inherited = r.parentId ? effectiveValues(all, r.parentId)[key] : undefined;
        if (r.parentId && value === inherited) delete values[key];
        return { ...r, values, cleared: r.cleared.filter((k) => k !== key) };
      }),
    );

  const resetValue = (row: Row, key: FieldKey) =>
    edit((all) =>
      all.map((r) => {
        if (r.id !== row.id) return r;
        const { [key]: _, ...values } = r.values;
        return { ...r, values, cleared: r.cleared.filter((k) => k !== key) };
      }),
    );

  const clearValue = (row: Row, key: FieldKey) =>
    edit((all) => all.map((r) => (r.id === row.id ? { ...r, cleared: [...r.cleared, key] } : r)));

  const addVariation = () => {
    const parentId = rows.find((r) => r.id === selected)?.parentId ?? selected;
    const id = `row-${rows.length}-${Date.now()}`;
    edit((all) => [...all, { id, parentId, label: forkLabel(all, parentId), values: {}, cleared: [] }]);
    setSelected(id);
  };

  const render = async () => {
    setPhase("rendering");
    for (let i = 1; i <= rows.length; i++) {
      await wait(450);
      setRendered(i);
    }
    setPhase("rendered");
  };

  const reset = () => {
    setRows(START_ROWS);
    setSelected("b");
    setPhase("editing");
    setRendered(0);
  };

  const status = (i: number) => {
    if (phase === "delivered") return <Badge variant="success">Delivered</Badge>;
    if (phase === "rendering" && i >= rendered) return <Badge variant="warning">Queued</Badge>;
    if (phase !== "editing") return <Badge variant="violet">Rendered</Badge>;
    return <Badge variant="muted">Ready</Badge>;
  };

  const depth = (r: Row) => (r.parentId ? 1 : 0);
  const current = rows.find((r) => r.id === selected) ?? rows[0];
  const currentValues = effectiveValues(rows, current.id);

  return (
    <ProductWindow path={["Continuum", "Template Forge", "Render"]}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium">Summer Promo</span>
          <Button variant="outline" size="sm" onClick={addVariation} disabled={busy}>
            <GitFork aria-hidden="true" /> Add variation
          </Button>
          {(phase !== "editing" || rows !== START_ROWS) && (
            <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
              <RotateCcw aria-hidden="true" /> Reset
            </Button>
          )}
        </div>
        <Button variant="cta" size="sm" onClick={render} disabled={busy || phase === "delivered"}>
          <Play aria-hidden="true" />
          {busy ? `Rendering ${rendered}/${rows.length}` : `Render ${rows.length} rows · ${files} files`}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] lg:divide-x lg:divide-border">
        {/* Data table */}
        <div className="min-w-0">
          <p className="border-b border-border px-3 py-1.5 text-2xs text-muted-foreground">
            {rows.length} requests · {rows.filter((r) => r.parentId).length} variations · edits on a variation override the base
          </p>
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-[150px] bg-background">Name</TableHead>
                  {FIELDS.map((f) => {
                    const Icon = KIND_ICON[f.kind];
                    return (
                      <TableHead key={f.key} className={f.width}>
                        <span className="flex items-center gap-1.5">
                          <Icon className="size-3 text-muted-foreground" aria-hidden="true" />
                          {f.label}
                        </span>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => {
                  const values = effectiveValues(rows, row.id);
                  const isSelected = row.id === selected;
                  return (
                    <TableRow key={row.id} data-state={isSelected ? "selected" : undefined} className={cn(isSelected && "bg-primary/6")}>
                      <TableCell className={cn("sticky left-0 z-10 bg-background align-top", isSelected && "bg-[color-mix(in_oklch,var(--primary)_6%,var(--background))]")}>
                        <button
                          type="button"
                          onClick={() => setSelected(row.id)}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex w-full cursor-pointer flex-col items-start gap-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            depth(row) && "border-l border-border pl-3",
                          )}
                        >
                          {row.parentId && (
                            <span className="rounded-sm bg-muted px-1.5 font-mono text-2xs text-muted-foreground">
                              inherits · {ownChangeCount(row)} changed
                            </span>
                          )}
                          <span className="font-medium">{row.label}</span>
                        </button>
                        <div className="mt-1.5">{status(i)}</div>
                      </TableCell>
                      {FIELDS.map((f) => {
                        const own = f.key in row.values;
                        const cleared = row.cleared.includes(f.key);
                        const value = values[f.key] ?? "";
                        const label = `${row.label} ${f.label}`;
                        return (
                          <TableCell key={f.key} className="align-top">
                            <div className="flex items-center gap-1">
                              {f.kind === "color" ? (
                                <span className="flex h-8 flex-1 items-center gap-1.5 rounded-lg border border-input bg-background px-1.5">
                                  <input
                                    type="color"
                                    aria-label={label}
                                    value={value || "#ffffff"}
                                    disabled={busy}
                                    onChange={(e) => setValue(row, f.key, e.target.value)}
                                    className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                                  />
                                  <span className="font-mono text-2xs">{value || "Cleared"}</span>
                                </span>
                              ) : f.kind === "image" ? (
                                <span className="flex h-8 flex-1 items-center gap-1.5 rounded-lg border border-input bg-background pl-1">
                                  {photoByKey.get(value) && (
                                    <img src={photoByKey.get(value)!.src} alt="" className="size-6 rounded object-cover" />
                                  )}
                                  <select
                                    aria-label={label}
                                    value={value}
                                    disabled={busy}
                                    onChange={(e) => setValue(row, f.key, e.target.value)}
                                    className="h-full flex-1 cursor-pointer bg-transparent pr-1 text-xs outline-none"
                                  >
                                    {!value && <option value="">Cleared</option>}
                                    {photos.map((p) => (
                                      <option key={p.key} value={p.key}>{p.label}</option>
                                    ))}
                                  </select>
                                </span>
                              ) : (
                                <Input
                                  aria-label={label}
                                  value={value}
                                  placeholder={cleared ? "Cleared" : ""}
                                  disabled={busy}
                                  onChange={(e) => setValue(row, f.key, e.target.value)}
                                  className="flex-1"
                                />
                              )}
                              {row.parentId &&
                                (own || cleared ? (
                                  <Button variant="ghost" size="icon-xs" aria-label={`Reset ${label} to inherited`} onClick={() => resetValue(row, f.key)} disabled={busy}>
                                    <RotateCcw />
                                  </Button>
                                ) : value ? (
                                  <Button variant="ghost" size="icon-xs" aria-label={`Clear inherited ${label}`} onClick={() => clearValue(row, f.key)} disabled={busy}>
                                    <X />
                                  </Button>
                                ) : null)}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {(phase === "rendered" || phase === "delivered" || phase === "held") && (
            <div className="border-t border-border p-3">
              <Confirmation
                approval={phase === "rendered" ? { id: "deliver" } : { id: "deliver", approved: phase === "delivered" }}
                state={phase === "rendered" ? "approval-requested" : "approval-responded"}
                className="bg-background"
              >
                <ConfirmationTitle>
                  <ConfirmationRequest>
                    Deliver {rows.length} variants ({files} files) to the Meta Ads account “Aurel Audio · Summer”?
                  </ConfirmationRequest>
                  <ConfirmationAccepted>Delivered. {files} files are live in the ad account as new ads, paused for review.</ConfirmationAccepted>
                  <ConfirmationRejected>Held. The renders stay in the ledger and nothing reached the ad account.</ConfirmationRejected>
                </ConfirmationTitle>
                <ConfirmationActions>
                  <ConfirmationAction variant="outline" onClick={() => setPhase("held")}>Hold</ConfirmationAction>
                  <ConfirmationAction variant="cta" onClick={() => setPhase("delivered")}>Approve and deliver</ConfirmationAction>
                </ConfirmationActions>
              </Confirmation>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex min-w-0 flex-col border-t border-border lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
            <span className="truncate text-xs font-medium">{current.label}</span>
            <ToggleGroup variant="outline" size="sm" value={ratio} onValueChange={(v) => v && setRatio(v as Ratio)} aria-label="Preview format">
              {RATIOS.map((r) => (
                <ToggleGroupItem key={r} value={r} className="gap-1.5 px-2 tabular-nums">
                  <RatioGlyph ratio={r} /> {r}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex min-h-[260px] flex-1 items-center justify-center bg-card/60 p-5">
            <div className={cn(ratio === "16:9" ? "w-full" : ratio === "1:1" ? "w-[260px]" : "w-[176px]")}>
              <PromoCreative v={currentValues} photo={photoByKey.get(currentValues.product ?? "")} ratio={ratio} />
            </div>
          </div>
          <p className="truncate border-t border-border px-3 py-2 font-mono text-2xs text-muted-foreground">
            summer_promo_{current.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_{ratio.replace(":", "x")}.jpg
          </p>
        </div>
      </div>
    </ProductWindow>
  );
}
