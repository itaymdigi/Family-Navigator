import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, FileText, ExternalLink, Trash2, Loader2, Upload, Link, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAdmin } from "@/lib/trip-context";

const docTypeInfo: Record<string, { icon: string; label: string; color: string }> = {
  flight: { icon: "✈️", label: "טיסה", color: "bg-blue-50 text-blue-700" },
  hotel: { icon: "🏨", label: "לינה", color: "bg-teal-50 text-teal-700" },
  car: { icon: "🚗", label: "רכב", color: "bg-orange-50 text-orange-700" },
  insurance: { icon: "🛡️", label: "ביטוח", color: "bg-purple-50 text-purple-700" },
  passport: { icon: "🛂", label: "דרכון", color: "bg-red-50 text-red-700" },
  visa: { icon: "📋", label: "ויזה", color: "bg-amber-50 text-amber-700" },
  ticket: { icon: "🎫", label: "כרטיס", color: "bg-pink-50 text-pink-700" },
  other: { icon: "📄", label: "אחר", color: "bg-gray-50 text-gray-700" },
};

export function DocsView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const docs = useQuery(api.travelDocuments.list, { tripId: tripId as Id<"trips"> });
  const [showAdd, setShowAdd] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", type: "other", url: "", notes: "" });
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDoc = useMutation(api.travelDocuments.create);
  const deleteDoc = useMutation(api.travelDocuments.remove);
  const generateUploadUrl = useMutation(api.travelDocuments.generateUploadUrl);
  const [saving, setSaving] = useState(false);

  const displayDocs = docs ?? [];

  const resetForm = () => {
    setNewDoc({ name: "", type: "other", url: "", notes: "" });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!newDoc.name) return;
    setSaving(true);
    try {
      if (uploadMode === "file" && selectedFile) {
        setUploading(true);
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", body: selectedFile, headers: { "Content-Type": selectedFile.type } });
        const { storageId } = await result.json();
        await addDoc({ tripId: tripId as Id<"trips">, name: newDoc.name, type: newDoc.type, storageId, notes: newDoc.notes || undefined, sortOrder: displayDocs.length });
      } else {
        await addDoc({ tripId: tripId as Id<"trips">, name: newDoc.name, type: newDoc.type, url: newDoc.url || undefined, notes: newDoc.notes || undefined, sortOrder: displayDocs.length });
      }
      setShowAdd(false);
      resetForm();
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (docs === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const canSave = !!newDoc.name && (uploadMode === "url" ? !!newDoc.url : !!selectedFile);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">📂 מסמכי נסיעה</h2>
        {isAdmin && (
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9" onClick={() => setShowAdd(true)} data-testid="button-add-doc">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        )}
      </div>

      {displayDocs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">אין מסמכים מקושרים</p>
          <p className="text-xs mt-1">הוסיפו PDF או קישור</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground/80 px-1">מסמכים ({displayDocs.length})</h3>
          {displayDocs.map((doc) => {
            const info = docTypeInfo[doc.type] || docTypeInfo.other;
            return (
              <Card key={doc._id} className="border-none shadow-sm rounded-xl bg-white group" data-testid={`doc-${doc._id}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${info.color}`}>
                    {doc.storageId ? "📎" : info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{doc.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
                      {doc.storageId && <span className="text-[10px] text-muted-foreground">קובץ מועלה</span>}
                      {doc.notes && <p className="text-[11px] text-muted-foreground truncate">{doc.notes}</p>}
                    </div>
                  </div>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" data-testid={`button-open-doc-${doc._id}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteDoc({ id: doc._id })} className="opacity-60 text-red-400 hover:text-red-600 p-1 transition-opacity" data-testid={`button-delete-doc-${doc._id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
          <DialogHeader><DialogTitle>הוספת מסמך</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="שם המסמך (למשל: כרטיס טיסה)" value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} data-testid="input-doc-name" />
            <Select value={newDoc.type} onValueChange={(v) => setNewDoc({ ...newDoc, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flight">✈️ טיסה</SelectItem>
                <SelectItem value="hotel">🏨 לינה</SelectItem>
                <SelectItem value="car">🚗 רכב</SelectItem>
                <SelectItem value="insurance">🛡️ ביטוח</SelectItem>
                <SelectItem value="passport">🛂 דרכון</SelectItem>
                <SelectItem value="ticket">🎫 כרטיס</SelectItem>
                <SelectItem value="other">📄 אחר</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <button onClick={() => setUploadMode("file")} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${uploadMode === "file" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <Upload className="w-3.5 h-3.5" /> העלאת קובץ
              </button>
              <button onClick={() => setUploadMode("url")} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${uploadMode === "url" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <Link className="w-3.5 h-3.5" /> קישור URL
              </button>
            </div>

            {uploadMode === "file" ? (
              <div>
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="hidden" data-testid="input-doc-file" />
                {selectedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-primary flex-1 truncate">{selectedFile.name}</span>
                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors" data-testid="button-select-doc-file">
                    <Upload className="w-7 h-7 text-muted-foreground/40" />
                    <span className="text-sm text-muted-foreground font-medium">לחצו לבחור PDF או תמונה</span>
                  </button>
                )}
              </div>
            ) : (
              <Input placeholder="קישור (URL)" value={newDoc.url} onChange={(e) => setNewDoc({ ...newDoc, url: e.target.value })} dir="ltr" data-testid="input-doc-url" />
            )}

            <Textarea placeholder="הערות..." value={newDoc.notes} onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })} className="min-h-[60px]" data-testid="input-doc-notes" />
            <Button
              className="w-full rounded-xl bg-primary h-11"
              onClick={handleSave}
              disabled={!canSave || saving}
              data-testid="button-save-doc"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
              {uploading ? "מעלה קובץ..." : "שמור מסמך"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
