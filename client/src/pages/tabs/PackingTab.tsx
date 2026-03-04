import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, Trash2, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAdmin } from "@/lib/trip-context";

export const PACKING_CATEGORIES: { id: string; label: string; icon: string; color: string; bg: string }[] = [
  { id: "clothing",    label: "ביגוד",       icon: "👕", color: "text-blue-700",   bg: "bg-blue-50" },
  { id: "documents",  label: "מסמכים",      icon: "📄", color: "text-purple-700", bg: "bg-purple-50" },
  { id: "toiletries", label: "טואלטיקה",    icon: "🧴", color: "text-pink-700",   bg: "bg-pink-50" },
  { id: "electronics",label: "אלקטרוניקה",  icon: "🔌", color: "text-orange-700", bg: "bg-orange-50" },
  { id: "kids",       label: "ילדים",       icon: "🧸", color: "text-green-700",  bg: "bg-green-50" },
  { id: "other",      label: "שונות",       icon: "📦", color: "text-gray-700",   bg: "bg-gray-50" },
];

function AddPackingItemForm({ tripId, onDone, members }: { tripId: string; onDone: () => void; members: Array<{ _id: Id<"familyMembers">; name: string; avatar?: string; color: string }> }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("clothing");
  const [assignedTo, setAssignedTo] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);
  const addItem = useMutation(api.packingItems.create);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addItem({
        tripId: tripId as Id<"trips">,
        name: name.trim(),
        category,
        assignedTo: assignedTo || undefined,
        quantity: Number(quantity) > 1 ? Number(quantity) : undefined,
      });
      setName(""); setAssignedTo(""); setQuantity("1");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">פריט חדש</p>
        <div className="flex gap-2">
          <Input
            placeholder="שם הפריט..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="flex-1 h-9 text-sm"
            autoFocus
          />
          <Input
            placeholder="כמות"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-16 h-9 text-sm text-center"
          />
        </div>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PACKING_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {members.length > 0 ? (
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="עבור מי?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">כולם</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m._id} value={m.name}>{m.avatar ?? ""} {m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="עבור מי?"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-8 text-xs rounded-lg bg-primary" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "הוסף"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs rounded-lg" onClick={onDone}>ביטול</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PackingView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const items = useQuery(api.packingItems.list, { tripId: tripId as Id<"trips"> });
  const members = useQuery(api.familyMembers.list, { tripId: tripId as Id<"trips"> });
  const togglePacked = useMutation(api.packingItems.togglePacked);
  const assignItem = useMutation(api.packingItems.assign);
  const removeItem = useMutation(api.packingItems.remove);
  const [showAdd, setShowAdd] = useState(false);
  const [filterMember, setFilterMember] = useState<string | null>(null);

  if (items === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const filteredItems = filterMember ? items.filter((i) => i.assignedTo === filterMember) : items;
  const total = filteredItems.length;
  const packed = filteredItems.filter((i) => i.isPacked).length;
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100);

  const memberColorObj: Record<string, string> = {};
  for (const m of members ?? []) memberColorObj[m.name] = m.color;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">🎒 רשימת ציוד</h2>
        <span className="text-sm font-medium text-muted-foreground tabular-nums">{packed}/{total} ארוזו</span>
      </div>

      {members && members.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterMember(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterMember === null ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            הכל
          </button>
          {members.map((m) => (
            <button
              key={m._id}
              onClick={() => setFilterMember(filterMember === m.name ? null : m.name)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterMember === m.name ? "shadow-sm ring-2 ring-offset-1" : "opacity-70 hover:opacity-100"}`}
              style={{ backgroundColor: m.color + (filterMember === m.name ? "33" : "20"), color: m.color, outline: filterMember === m.name ? `2px solid ${m.color}` : "none", outlineOffset: "1px" }}
            >
              {m.avatar && <span>{m.avatar}</span>}
              {m.name}
            </button>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="space-y-1.5">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : "linear-gradient(90deg,#6366f1,#8b5cf6)" }}
            />
          </div>
          {pct === 100 && <p className="text-xs text-green-600 font-medium text-center">✅ הכל ארוז! אפשר לטוס 🎉</p>}
        </div>
      )}

      {PACKING_CATEGORIES.map((cat) => {
        const catItems = filteredItems.filter((i) => i.category === cat.id);
        if (catItems.length === 0) return null;
        const catPacked = catItems.filter((i) => i.isPacked).length;
        return (
          <Card key={cat.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
                    {cat.icon} {cat.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{catPacked}/{catItems.length}</span>
              </div>
              <div className="space-y-1">
                {catItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-2.5 py-1 group">
                    <button
                      onClick={() => togglePacked({ id: item._id, isPacked: !item.isPacked })}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.isPacked
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-primary"
                      }`}
                    >
                      {item.isPacked && <Check className="w-3 h-3" />}
                    </button>
                    <span className={`text-sm flex-1 transition-all ${item.isPacked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.name}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-xs text-muted-foreground mr-1">×{item.quantity}</span>
                      )}
                    </span>
                    {item.assignedTo && (() => {
                      const color = memberColorObj[item.assignedTo];
                      return (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={color ? { backgroundColor: color + "25", color } : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
                        >
                          {item.assignedTo}
                        </span>
                      );
                    })()}
                    {isAdmin && members && members.length > 0 && (
                      <select
                        value={item.assignedTo ?? ""}
                        onChange={(e) => assignItem({ id: item._id, assignedTo: e.target.value || undefined })}
                        className="text-[10px] bg-transparent border-none outline-none text-muted-foreground cursor-pointer opacity-0 group-hover:opacity-100 w-5 transition-opacity"
                        aria-label="שייך פריט לחבר משפחה"
                        title="שייך לחבר משפחה"
                      >
                        <option value="">—</option>
                        {members.map((m) => (
                          <option key={m._id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => removeItem({ id: item._id })}
                        className="opacity-0 group-hover:opacity-60 text-red-400 hover:text-red-600 transition-opacity p-0.5 flex-shrink-0"
                        aria-label="מחק פריט"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {filteredItems.length === 0 && !showAdd && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {filterMember ? `אין פריטים משויכים ל${filterMember}` : "עדיין אין פריטים ברשימה"}
        </div>
      )}

      {isAdmin && !filterMember && (
        showAdd
          ? <AddPackingItemForm tripId={tripId} onDone={() => setShowAdd(false)} members={members ?? []} />
          : <button onClick={() => setShowAdd(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 py-1 px-1">
              <Plus className="w-3 h-3" /> הוסף פריט
            </button>
      )}
    </div>
  );
}

function AddChecklistItemForm({ tripId, sortOrder, onDone }: { tripId: string; sortOrder: number; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const addItem = useMutation(api.checklistItems.create);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addItem({
        tripId: tripId as Id<"trips">,
        title: title.trim(),
        dueDate: dueDate || undefined,
        note: note.trim() || undefined,
        sortOrder,
      });
      setTitle(""); setDueDate(""); setNote("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">משימה חדשה</p>
        <Input
          placeholder="שם המשימה..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="h-9 text-sm"
          autoFocus
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground mb-1 block">תאריך יעד (אופציונלי)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground mb-1 block">הערה (אופציונלי)</Label>
            <Input
              placeholder="הערה..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-8 text-xs rounded-lg bg-primary" onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "הוסף"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs rounded-lg" onClick={onDone}>ביטול</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChecklistView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const items = useQuery(api.checklistItems.list, { tripId: tripId as Id<"trips"> });
  const toggleDone = useMutation(api.checklistItems.toggleDone);
  const removeItem = useMutation(api.checklistItems.remove);
  const [showAdd, setShowAdd] = useState(false);

  if (items === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const total = items.length;
  const done = items.filter((i) => i.isDone).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const today = new Date().toISOString().split("T")[0];
  const pending = items.filter((i) => !i.isDone);
  const completed = items.filter((i) => i.isDone);

  const formatDue = (d: string) => {
    const date = new Date(d + "T00:00:00");
    const diff = Math.ceil((date.getTime() - new Date(today + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `באיחור ${Math.abs(diff)} ימים`, cls: "text-red-500 bg-red-50" };
    if (diff === 0) return { label: "היום!", cls: "text-orange-500 bg-orange-50" };
    if (diff === 1) return { label: "מחר", cls: "text-yellow-600 bg-yellow-50" };
    return { label: `עוד ${diff} ימים`, cls: "text-muted-foreground bg-muted" };
  };

  const ItemRow = ({ item }: { item: (typeof items)[0] }) => (
    <div className="flex items-start gap-2.5 py-2 group border-b border-border/40 last:border-0">
      <button
        onClick={() => toggleDone({ id: item._id, isDone: !item.isDone })}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          item.isDone ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-primary"
        }`}
      >
        {item.isDone && <Check className="w-3 h-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${item.isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {item.title}
        </p>
        {item.note && <p className="text-[11px] text-muted-foreground mt-0.5">{item.note}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {item.dueDate && !item.isDone && (() => {
          const { label, cls } = formatDue(item.dueDate);
          return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
        })()}
        {isAdmin && (
          <button
            onClick={() => removeItem({ id: item._id })}
            className="opacity-0 group-hover:opacity-60 text-red-400 hover:text-red-600 transition-opacity p-0.5"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">✅ משימות לפני הטיול</h2>
        <span className="text-sm font-medium text-muted-foreground">{done}/{total} הושלמו</span>
      </div>

      {total > 0 && (
        <div className="space-y-1.5">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : "linear-gradient(90deg,#f59e0b,#10b981)" }}
            />
          </div>
          {pct === 100 && <p className="text-xs text-green-600 font-medium text-center">🎉 כל המשימות הושלמו! הטיול מוכן!</p>}
        </div>
      )}

      {pending.length > 0 && (
        <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">ממתינות לביצוע</p>
            {pending.map((item) => <ItemRow key={item._id} item={item} />)}
          </CardContent>
        </Card>
      )}

      {completed.length > 0 && (
        <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">הושלמו ✓</p>
            {completed.map((item) => <ItemRow key={item._id} item={item} />)}
          </CardContent>
        </Card>
      )}

      {total === 0 && !showAdd && (
        <div className="text-center py-12 text-muted-foreground text-sm">עדיין אין משימות לפני הטיול</div>
      )}

      {isAdmin && (
        showAdd
          ? <AddChecklistItemForm tripId={tripId} sortOrder={total + 1} onDone={() => setShowAdd(false)} />
          : <button onClick={() => setShowAdd(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 py-1 px-1">
              <Plus className="w-3 h-3" /> הוסף משימה
            </button>
      )}
    </div>
  );
}
