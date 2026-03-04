import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, Navigation, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAdmin } from "@/lib/trip-context";

export function MapView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const locations = useQuery(api.mapLocations.list, { tripId: tripId as Id<"trips"> });
  const hotels = useQuery(api.accommodations.list, { tripId: tripId as Id<"trips"> });
  const restaurantsList = useQuery(api.restaurants.list, { tripId: tripId as Id<"trips"> });
  const [showAdd, setShowAdd] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: "", description: "", lat: "", lng: "", type: "attraction", icon: "" });
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const addLocation = useMutation(api.mapLocations.create);
  const deleteLocation = useMutation(api.mapLocations.remove);
  const [saving, setSaving] = useState(false);

  const displayLocations = locations ?? [];
  const displayHotels = hotels ?? [];
  const displayRestaurants = restaurantsList ?? [];

  useEffect(() => {
    if (mapRef.current || !document.getElementById("trip-map")) return;
    import("leaflet").then((L) => {
      if (mapRef.current) return;
      const map = L.default.map("trip-map").setView([50.65, 15.5], 8);
      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapRef.current = { map, L: L.default };
      setMapReady(true);
    });
    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const { map, L } = mapRef.current;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const hotelIcon = L.divIcon({ className: "custom-marker", html: '<div style="background:#4ECDC4;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">🏨</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
    const restaurantIcon = L.divIcon({ className: "custom-marker", html: '<div style="background:#F59E0B;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">🍽️</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
    const customIcon = L.divIcon({ className: "custom-marker", html: '<div style="background:#6C5CE7;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">📍</div>', iconSize: [28, 28], iconAnchor: [14, 14] });

    displayHotels.forEach((hotel) => {
      if (hotel.lat && hotel.lng) {
        L.marker([hotel.lat, hotel.lng], { icon: hotelIcon })
          .addTo(map)
          .bindPopup(`<div dir="rtl" style="text-align:right"><b>${hotel.name}</b><br/><small>${hotel.dates}</small></div>`);
      }
    });

    displayLocations.forEach((loc) => {
      const icon = loc.icon ? L.divIcon({ className: "custom-marker", html: `<div style="background:#6C5CE7;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${loc.icon}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }) : customIcon;
      L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .bindPopup(`<div dir="rtl" style="text-align:right"><b>${loc.name}</b><br/>${loc.description || ""}</div>`);
    });

    displayRestaurants.forEach((rest) => {
      if (rest.lat && rest.lng) {
        const navUrl = rest.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest.address || rest.name)}`;
        L.marker([rest.lat, rest.lng], { icon: restaurantIcon })
          .addTo(map)
          .bindPopup(`<div dir="rtl" style="text-align:right"><b>🍽️ ${rest.name}</b>${rest.cuisine ? `<br/><small>${rest.cuisine}</small>` : ""}${rest.priceRange ? `<br/><small>${rest.priceRange}</small>` : ""}${rest.notes ? `<br/><small>${rest.notes}</small>` : ""}<br/><a href="${navUrl}" target="_blank" style="color:#2563eb;font-size:12px;">נווט למסעדה →</a></div>`);
      }
    });
  }, [mapReady, displayHotels, displayLocations, displayRestaurants]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">🗺️ מפת הטיול</h2>
        {isAdmin && (
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9" onClick={() => setShowAdd(true)} data-testid="button-add-location">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        )}
      </div>

      <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden">
        <div id="trip-map" className="w-full h-[350px] rounded-2xl" style={{ zIndex: 1 }} data-testid="map-container" />
      </Card>

      <div className="flex gap-2 flex-wrap px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><span className="w-3 h-3 rounded-full bg-[#4ECDC4] inline-block"></span> לינה</span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block"></span> מסעדות</span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><span className="w-3 h-3 rounded-full bg-[#6C5CE7] inline-block"></span> מותאם אישית</span>
      </div>

      {displayLocations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground/80 px-1">נקודות שנוספו ידנית</h3>
          {displayLocations.map((loc) => (
            <Card key={loc._id} className="border-none shadow-sm rounded-xl bg-white group" data-testid={`location-${loc._id}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-lg">{loc.icon || "📍"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{loc.name}</p>
                  {loc.description && <p className="text-xs text-muted-foreground truncate">{loc.description}</p>}
                </div>
                <a
                  href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                  data-testid={`button-location-nav-${loc._id}`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                </a>
                {isAdmin && (
                  <button onClick={() => deleteLocation({ id: loc._id })} className="opacity-60 text-red-400 hover:text-red-600 p-1 transition-opacity" data-testid={`button-delete-location-${loc._id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
          <DialogHeader><DialogTitle>הוספת מיקום חדש</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="שם המקום" value={newLoc.name} onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })} data-testid="input-location-name" />
            <Input placeholder="תיאור (אופציונלי)" value={newLoc.description} onChange={(e) => setNewLoc({ ...newLoc, description: e.target.value })} data-testid="input-location-desc" />
            <div className="flex gap-2">
              <Input placeholder="קו רוחב (lat)" type="number" step="any" value={newLoc.lat} onChange={(e) => setNewLoc({ ...newLoc, lat: e.target.value })} className="flex-1" dir="ltr" data-testid="input-location-lat" />
              <Input placeholder="קו אורך (lng)" type="number" step="any" value={newLoc.lng} onChange={(e) => setNewLoc({ ...newLoc, lng: e.target.value })} className="flex-1" dir="ltr" data-testid="input-location-lng" />
            </div>
            <div className="flex gap-2">
              <Select value={newLoc.type} onValueChange={(v) => setNewLoc({ ...newLoc, type: v })}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attraction">אטרקציה</SelectItem>
                  <SelectItem value="restaurant">מסעדה</SelectItem>
                  <SelectItem value="viewpoint">תצפית</SelectItem>
                  <SelectItem value="shopping">קניות</SelectItem>
                  <SelectItem value="grocery">סופר / מכולת</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="אימוג'י" value={newLoc.icon} onChange={(e) => setNewLoc({ ...newLoc, icon: e.target.value })} className="w-16 text-center text-lg" data-testid="input-location-icon" />
            </div>
            <Button
              className="w-full rounded-xl bg-primary h-11"
              onClick={async () => {
                if (!newLoc.name || !newLoc.lat || !newLoc.lng) return;
                setSaving(true);
                try {
                  await addLocation({ tripId: tripId as Id<"trips">, name: newLoc.name, description: newLoc.description || undefined, lat: parseFloat(newLoc.lat), lng: parseFloat(newLoc.lng), type: newLoc.type, icon: newLoc.icon || undefined });
                  setShowAdd(false); setNewLoc({ name: "", description: "", lat: "", lng: "", type: "attraction", icon: "" });
                } finally { setSaving(false); }
              }}
              disabled={!newLoc.name || !newLoc.lat || !newLoc.lng || saving}
              data-testid="button-save-location"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />} הוסף מיקום
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
