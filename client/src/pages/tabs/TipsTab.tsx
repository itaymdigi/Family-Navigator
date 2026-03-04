import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAdmin } from "@/lib/trip-context";

function AddTipForm({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState("💡");
  const [text, setText] = useState("");
  const addTip = useMutation(api.tips.create);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text) return;
    setSaving(true);
    try {
      await addTip({ tripId: tripId as Id<"trips">, icon, text, sortOrder: 99 });
      setOpen(false); setIcon("💡"); setText("");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 py-1 px-1" data-testid="button-add-tip">
      <Plus className="w-3 h-3" /> הוסף טיפ
    </button>
  );
  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white">
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input placeholder="🔔" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-14 h-9 text-center text-lg" data-testid="input-tip-icon" />
          <Input placeholder="טקסט הטיפ..." value={text} onChange={(e) => setText(e.target.value)} className="flex-1 h-9 text-sm" data-testid="input-tip-text" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-8 text-xs rounded-lg bg-primary" onClick={handleSave} disabled={!text || saving} data-testid="button-save-tip">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "שמור"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs rounded-lg" onClick={() => setOpen(false)}>ביטול</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TipsView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const tipsList = useQuery(api.tips.list, { tripId: tripId as Id<"trips"> });
  const deleteTip = useMutation(api.tips.remove);
  const displayTips = tipsList ?? [];

  if (tipsList === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">📌 טיפים חשובים</h2>
      <div className="space-y-3">
        {displayTips.map((tip) => (
          <Card key={tip._id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white group" data-testid={`tip-${tip._id}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
              <p className="text-sm text-foreground/90 leading-relaxed flex-1">{tip.text}</p>
              {isAdmin && <button onClick={() => deleteTip({ id: tip._id })} className="opacity-60 text-red-400 hover:text-red-600 p-1 transition-opacity flex-shrink-0" data-testid={`button-delete-tip-${tip._id}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>}
            </CardContent>
          </Card>
        ))}
      </div>
      {isAdmin && <AddTipForm tripId={tripId} />}
      <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-5">
          <h3 className="font-bold text-sm mb-3">💰 הערכת תקציב</h3>
          <div className="space-y-2 text-xs">
            {[["🏨 לינה ליד שדה (2 לילות)", "€160–240"], ["🏨 לינה בצפון צ'כיה (9 לילות)", "€550–900"], ["🚗 רכב שכור (10 ימים)", "€300–420"], ["⛽ דלק", "€100–150"], ["🎟 כניסה לאטרקציות", "€150–250"], ["🍽 אוכל", "€600–900"], ["🛍 שונות", "€100–150"]].map(([item, cost]) => (
              <div key={item} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"><span className="text-foreground/80">{item}</span><span className="font-bold text-foreground">{cost}</span></div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold text-sm text-primary"><span>📊 סה"כ הערכה</span><span>€1,960–3,010</span></div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">צ'כיה זולה מאוד ביחס למערב אירופה. ארוחת צהריים במסעדה ~€8–15 לאדם.</p>
        </CardContent>
      </Card>
    </div>
  );
}
