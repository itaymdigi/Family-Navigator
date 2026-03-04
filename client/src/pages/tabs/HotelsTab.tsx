import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { Star, Trash2, Loader2, X, Upload, Link, FileText, FileCheck, Navigation, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAdmin, useWithCache } from "@/lib/trip-context";

export function HotelsView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const hotelsLive = useQuery(api.accommodations.list, { tripId: tripId as Id<"trips"> });
  const hotels = useWithCache(hotelsLive, `fnav-hotels-${tripId}`);
  const [showDocDialog, setShowDocDialog] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteAccommodation = useMutation(api.accommodations.remove);
  const updateAccommodation = useMutation(api.accommodations.update);
  const clearReservation = useMutation(api.accommodations.clearReservation);
  const generateUploadUrl = useMutation(api.accommodations.generateUploadUrl);

  const resetDialog = () => { setDocUrl(""); setDocName(""); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleUpdateReservation = async () => {
    if (!showDocDialog) return;
    setSaving(true);
    try {
      if (uploadMode === "file" && selectedFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", body: selectedFile, headers: { "Content-Type": selectedFile.type } });
        const { storageId } = await result.json();
        await updateAccommodation({ id: showDocDialog as Id<"accommodations">, reservationStorageId: storageId, reservationName: docName || selectedFile.name });
      } else if (docUrl) {
        await updateAccommodation({ id: showDocDialog as Id<"accommodations">, reservationUrl: docUrl, reservationName: docName || "מסמך הזמנה" });
      }
      setShowDocDialog(null); resetDialog();
    } finally { setSaving(false); }
  };

  const handleRemoveReservation = async () => {
    if (showDocDialog) {
      await clearReservation({ id: showDocDialog as Id<"accommodations"> });
      setShowDocDialog(null);
      resetDialog();
    }
  };

  if (hotels === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  const grouped = hotels.reduce((acc, h) => { const b = h.baseName || "אחר"; if (!acc[b]) acc[b] = []; acc[b].push(h); return acc; }, {} as Record<string, typeof hotels>);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">🏨 לינה</h2>
      {Object.entries(grouped).map(([baseName, groupedHotels]) => (
        <div key={baseName} className="space-y-3">
          <h3 className="text-sm font-bold text-foreground/80 px-1">{baseName}</h3>
          {groupedHotels.map((hotel) => (
            <Card key={hotel._id} className={`border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden group ${hotel.isSelected ? "ring-2 ring-success/50" : ""}`} data-testid={`hotel-card-${hotel._id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{hotel.name}</h4>
                      {hotel.isSelected && <span className="bg-success/20 text-success-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">✅ הוזמן</span>}
                    </div>
                    <div className="flex gap-0.5 mt-1">{Array.from({ length: hotel.stars ?? 0 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-accent text-accent" />)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {hotel.priceRange && <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{hotel.priceRange}</span>}
                    {isAdmin && <button onClick={() => deleteAccommodation({ id: hotel._id })} className="opacity-60 text-red-400 hover:text-red-600 p-1 transition-opacity" data-testid={`button-delete-hotel-${hotel._id}`}><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{hotel.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>{hotel.dates}</span></div>
                {hotel.reservationUrl && (
                  <a href={hotel.reservationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors" data-testid={`link-reservation-${hotel._id}`}>
                    <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-green-700 truncate">{hotel.reservationName || "מסמך הזמנה"}</p>
                      <p className="text-[9px] text-green-600/70">לחצו לפתיחת מסמך ההזמנה</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  </a>
                )}
                <div className="flex gap-2">
                  {hotel.mapsUrl && <a href={hotel.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-hotel-maps-${hotel._id}`}><Button size="sm" className="w-full rounded-lg bg-secondary hover:bg-secondary/90 text-white text-xs h-8 gap-1.5"><Navigation className="w-3 h-3" /> Maps</Button></a>}
                  {hotel.wazeUrl && <a href={hotel.wazeUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-hotel-waze-${hotel._id}`}><Button size="sm" variant="outline" className="w-full rounded-lg text-xs h-8 gap-1.5"><ExternalLink className="w-3 h-3" /> Waze</Button></a>}
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="rounded-lg text-xs h-8 gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => { setShowDocDialog(hotel._id); setDocUrl(hotel.reservationUrl || ""); setDocName(hotel.reservationName || ""); }}
                      data-testid={`button-add-reservation-${hotel._id}`}
                    >
                      <FileCheck className="w-3 h-3" />
                      {hotel.reservationUrl ? "עדכן הזמנה" : "צרף הזמנה"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <Dialog open={showDocDialog !== null} onOpenChange={(open) => { if (!open) { setShowDocDialog(null); resetDialog(); } }}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>צירוף מסמך הזמנה</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="שם המסמך (למשל: אישור הזמנה)" value={docName} onChange={(e) => setDocName(e.target.value)} data-testid="input-reservation-name" />
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
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="hidden" />
                {selectedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-primary flex-1 truncate">{selectedFile.name}</span>
                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload className="w-7 h-7 text-muted-foreground/40" />
                    <span className="text-sm text-muted-foreground font-medium">לחצו לבחור PDF או תמונה</span>
                  </button>
                )}
              </div>
            ) : (
              <Input placeholder="קישור למסמך (URL)" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} dir="ltr" data-testid="input-reservation-url" />
            )}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 h-10 text-sm rounded-xl bg-primary" onClick={handleUpdateReservation} disabled={saving || (uploadMode === "file" ? !selectedFile : !docUrl)} data-testid="button-save-reservation">
                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null} שמור
              </Button>
              {showDocDialog && hotels?.find(h => h._id === showDocDialog)?.reservationUrl && (
                <Button variant="outline" className="h-10 text-sm rounded-xl text-red-500 border-red-200 hover:bg-red-50" onClick={handleRemoveReservation} data-testid="button-remove-reservation">
                  <Trash2 className="w-3.5 h-3.5 ml-1" /> הסר
                </Button>
              )}
              <Button variant="outline" className="h-10 text-sm rounded-xl" onClick={() => { setShowDocDialog(null); resetDialog(); }}>ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
