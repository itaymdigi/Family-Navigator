import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, MapPin, Navigation, Trash2, Loader2, Pencil, Check, Camera, X, UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAdmin } from "@/lib/trip-context";

const cuisineOptions = [
  { value: "czech", label: "צ'כית", icon: "🇨🇿" },
  { value: "italian", label: "איטלקית", icon: "🇮🇹" },
  { value: "asian", label: "אסייתית", icon: "🍜" },
  { value: "burger", label: "המבורגרים", icon: "🍔" },
  { value: "pizza", label: "פיצה", icon: "🍕" },
  { value: "cafe", label: "בית קפה", icon: "☕" },
  { value: "bakery", label: "מאפייה", icon: "🥐" },
  { value: "local", label: "מקומי", icon: "🍽️" },
  { value: "other", label: "אחר", icon: "🍴" },
];

const getCuisineInfo = (cuisine: string | null | undefined) =>
  cuisineOptions.find(c => c.value === cuisine) || { value: "other", label: "מסעדה", icon: "🍴" };

export function RestaurantsView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const restaurants = useQuery(api.restaurants.list, { tripId: tripId as Id<"trips"> });
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", cuisine: "", priceRange: "", address: "", mapsUrl: "", wazeUrl: "", notes: "", isKosher: false, rating: 0, lat: "", lng: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const addRestaurant = useMutation(api.restaurants.create);
  const updateRestaurant = useMutation(api.restaurants.update);
  const deleteRestaurant = useMutation(api.restaurants.remove);
  const clearRestaurantImage = useMutation(api.restaurants.clearImage);
  const generateUploadUrl = useMutation(api.restaurants.generateUploadUrl);
  const [saving, setSaving] = useState(false);

  const displayRestaurants = restaurants ?? [];

  const resetForm = () => {
    setForm({ name: "", cuisine: "", priceRange: "", address: "", mapsUrl: "", wazeUrl: "", notes: "", isKosher: false, rating: 0, lat: "", lng: "" });
    setImageFile(null); setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  if (restaurants === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      let imageStorageId: string | undefined;
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", body: imageFile, headers: { "Content-Type": imageFile.type } });
        const { storageId } = await result.json();
        imageStorageId = storageId;
      }
      const payload = {
        tripId: tripId as Id<"trips">,
        name: form.name,
        cuisine: form.cuisine || undefined,
        priceRange: form.priceRange || undefined,
        address: form.address || undefined,
        mapsUrl: form.mapsUrl || undefined,
        wazeUrl: form.wazeUrl || undefined,
        notes: form.notes || undefined,
        isKosher: form.isKosher,
        rating: form.rating || undefined,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
        imageStorageId: imageStorageId as Id<"_storage"> | undefined,
      };
      if (editingId) {
        await updateRestaurant({ id: editingId as Id<"restaurants">, ...payload });
        setEditingId(null);
      } else {
        await addRestaurant(payload);
        setShowAdd(false);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">🍽️ מסעדות ואוכל</h2>
        {isAdmin && (
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9" onClick={() => { resetForm(); setShowAdd(true); }} data-testid="button-add-restaurant">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        )}
      </div>

      <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍺</span>
            <div>
              <h3 className="font-bold text-sm">המטבח הצ'כי</h3>
              <p className="text-xs text-muted-foreground">נסו סביצ'קובה, טרדלו, גולאש צ'כי ובירה מקומית!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {displayRestaurants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">אין מסעדות ברשימה</p>
          <p className="text-xs mt-1">הוסיפו מסעדות שרוצים לנסות בטיול</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayRestaurants.map((r) => {
            const ci = getCuisineInfo(r.cuisine);
            return (
              <Card key={r._id} className={`border-none shadow-sm rounded-xl group transition-all ${r.isVisited ? "bg-green-50/50" : "bg-white"}`} data-testid={`restaurant-${r._id}`}>
                <CardContent className="p-3">
                  {r.image && (
                    <div className="relative rounded-xl overflow-hidden h-32 mb-3">
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                      {isAdmin && (
                        <button
                          onClick={() => clearRestaurantImage({ id: r._id })}
                          className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500/80 transition-colors"
                          data-testid={`button-remove-image-${r._id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
                      {ci.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{r.name}</p>
                        {r.isKosher && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">כשר</span>}
                        {r.isVisited && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">ביקרנו ✓</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{ci.label}</span>
                        {r.priceRange && <span className="text-[10px] text-muted-foreground">{r.priceRange}</span>}
                        {r.rating && r.rating > 0 && (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          </span>
                        )}
                      </div>
                      {r.address && <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{r.address}</p>}
                      {r.notes && <p className="text-[11px] text-muted-foreground mt-1">{r.notes}</p>}
                      {(r.mapsUrl || r.wazeUrl || r.address) && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <a
                            href={r.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address || r.name)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
                            data-testid={`link-maps-${r._id}`}
                          >
                            <Navigation className="w-3 h-3" /> נווט ב-Google Maps
                          </a>
                          <a
                            href={r.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(r.address || r.name)}&navigate=yes`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors flex items-center gap-1"
                            data-testid={`link-waze-${r._id}`}
                          >
                            <Navigation className="w-3 h-3" /> נווט ב-Waze
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 justify-end">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => updateRestaurant({ id: r._id, isVisited: !r.isVisited })}
                          className={`p-1.5 rounded-lg transition-colors ${r.isVisited ? "bg-green-100 text-green-600" : "bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                          data-testid={`button-toggle-visited-${r._id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setForm({
                              name: r.name,
                              cuisine: r.cuisine || "",
                              priceRange: r.priceRange || "",
                              address: r.address || "",
                              mapsUrl: r.mapsUrl || "",
                              wazeUrl: r.wazeUrl || "",
                              notes: r.notes || "",
                              isKosher: r.isKosher || false,
                              rating: r.rating || 0,
                              lat: r.lat ? String(r.lat) : "",
                              lng: r.lng ? String(r.lng) : "",
                            });
                            setEditingId(r._id);
                          }}
                          className="opacity-60 text-muted-foreground hover:text-primary p-1.5 transition-all"
                          data-testid={`button-edit-restaurant-${r._id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteRestaurant({ id: r._id })} className="opacity-60 text-red-400 hover:text-red-600 p-1.5 transition-all" data-testid={`button-delete-restaurant-${r._id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd || editingId !== null} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditingId(null); resetForm(); } }}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? "עריכת מסעדה" : "הוספת מסעדה"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="שם המסעדה" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-restaurant-name" />
            <Select value={form.cuisine} onValueChange={(v) => setForm({ ...form, cuisine: v })}>
              <SelectTrigger><SelectValue placeholder="סוג מטבח" /></SelectTrigger>
              <SelectContent>
                {cuisineOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input placeholder="טווח מחירים (למשל €8–15)" value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} className="flex-1" data-testid="input-restaurant-price" />
              <Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: parseInt(v) })}>
                <SelectTrigger className="w-28"><SelectValue placeholder="דירוג" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">ללא דירוג</SelectItem>
                  <SelectItem value="1">★</SelectItem>
                  <SelectItem value="2">★★</SelectItem>
                  <SelectItem value="3">★★★</SelectItem>
                  <SelectItem value="4">★★★★</SelectItem>
                  <SelectItem value="5">★★★★★</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="כתובת" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="input-restaurant-address" />
            <div className="flex gap-2">
              <Input placeholder="קישור Google Maps" value={form.mapsUrl} onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })} className="flex-1" data-testid="input-restaurant-maps" />
              <Input placeholder="קישור Waze" value={form.wazeUrl} onChange={(e) => setForm({ ...form, wazeUrl: e.target.value })} className="flex-1" data-testid="input-restaurant-waze" />
            </div>
            <Textarea placeholder="הערות (כשרות, טיפים, המלצות...)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} data-testid="input-restaurant-notes" />
            <div className="flex gap-2">
              <Input placeholder="קו רוחב (lat)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="flex-1" data-testid="input-restaurant-lat" />
              <Input placeholder="קו אורך (lng)" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="flex-1" data-testid="input-restaurant-lng" />
            </div>
            <p className="text-[10px] text-muted-foreground">מצאו קואורדינטות ב-Google Maps (לחצו ימני → "מה יש כאן?")</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isKosher} onChange={(e) => setForm({ ...form, isKosher: e.target.checked })} className="rounded" data-testid="input-restaurant-kosher" />
              כשר
            </label>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">תמונת מסעדה (אופציונלי)</p>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setImageFile(f);
                if (f) { const reader = new FileReader(); reader.onload = () => setImagePreview(reader.result as string); reader.readAsDataURL(f); }
                else setImagePreview(null);
              }} className="hidden" data-testid="input-restaurant-image" />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden h-32">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = ""; }} className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => imageInputRef.current?.click()} className="w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-xl flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors" data-testid="button-select-restaurant-image">
                  <Camera className="w-5 h-5 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">לחצו להוסיף תמונה</span>
                </button>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 h-10 text-sm rounded-xl bg-primary"
                onClick={handleSave}
                disabled={!form.name || saving}
                data-testid="button-save-restaurant"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "עדכן" : "הוסף"}
              </Button>
              <Button variant="outline" className="h-10 text-sm rounded-xl" onClick={() => { setShowAdd(false); setEditingId(null); resetForm(); }}>ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
