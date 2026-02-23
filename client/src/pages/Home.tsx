import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CalendarDays, Hotel, Calculator, Image as ImageIcon,
  MapPin, ExternalLink, Navigation, Clock, Star,
  ChevronDown, ChevronUp, Lightbulb, Camera, Trash2, Loader2,
  ArrowRightLeft, Map
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TripDay, DayEvent, Attraction, Accommodation, Photo, CurrencyRate, Tip } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("itinerary");

  return (
    <div className="min-h-screen bg-muted/50 flex justify-center selection:bg-primary/20" dir="rtl">
      <div className="w-full max-w-md bg-background shadow-2xl min-h-screen relative flex flex-col pb-20 overflow-hidden sm:border-x sm:border-border">
        <header className="pt-10 pb-6 px-6 bg-gradient-to-br from-primary via-primary to-[hsl(var(--primary)/0.85)] text-primary-foreground rounded-b-[2rem] shadow-lg z-10 relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🇨🇿</span>
                <h1 className="text-xl font-bold tracking-tight" data-testid="text-trip-title">טיול צפון צ'כיה</h1>
              </div>
              <p className="text-primary-foreground/90 text-sm font-medium">25.3 – 4.4.2026 · 11 ימים · 👨‍👩‍👦‍👦 4 נוסעים</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {["🏔 שוויץ הבוהמית", "🪨 אדרשפאך", "🌲 גן עדן בוהמי", "🏰 טירות"].map((tag) => (
              <span key={tag} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 z-0">
          {activeTab === "itinerary" && <ItineraryView />}
          {activeTab === "hotels" && <HotelsView />}
          {activeTab === "currency" && <CurrencyView />}
          {activeTab === "photos" && <PhotosView />}
          {activeTab === "tips" && <TipsView />}
        </main>

        <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-border px-2 py-3 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
          <NavItem icon={<CalendarDays className="w-5 h-5" />} label="מסלול" isActive={activeTab === "itinerary"} onClick={() => setActiveTab("itinerary")} />
          <NavItem icon={<Hotel className="w-5 h-5" />} label="לינה" isActive={activeTab === "hotels"} onClick={() => setActiveTab("hotels")} />
          <NavItem icon={<Calculator className="w-5 h-5" />} label="מט״ח" isActive={activeTab === "currency"} onClick={() => setActiveTab("currency")} />
          <NavItem icon={<ImageIcon className="w-5 h-5" />} label="תמונות" isActive={activeTab === "photos"} onClick={() => setActiveTab("photos")} />
          <NavItem icon={<Lightbulb className="w-5 h-5" />} label="טיפים" isActive={activeTab === "tips"} onClick={() => setActiveTab("tips")} />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`nav-${label}`}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ease-out flex-1 ${isActive ? 'text-primary scale-105' : 'text-muted-foreground hover:text-foreground'}`}
    >
      <div className={`${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'} p-2 rounded-2xl transition-colors duration-300`}>
        {icon}
      </div>
      <span className={`text-[10px] font-semibold ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

function DayCard({ day }: { day: TripDay }) {
  const [expanded, setExpanded] = useState(false);
  const { data: events = [] } = useQuery<DayEvent[]>({
    queryKey: ["/api/trip-days", String(day.id), "events"],
    enabled: expanded,
  });
  const { data: dayAttractions = [] } = useQuery<Attraction[]>({
    queryKey: ["/api/trip-days", String(day.id), "attractions"],
    enabled: expanded,
  });

  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden" data-testid={`day-card-${day.dayNumber}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right"
        data-testid={`button-expand-day-${day.dayNumber}`}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold ${day.dayNumber === 0 || day.dayNumber === 10 ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
            <span className="text-[10px] leading-none font-semibold">יום</span>
            <span className="text-lg leading-none">{day.dayNumber}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium">{day.subtitle}</p>
            <h3 className="font-bold text-sm text-foreground truncate">{day.title}</h3>
            {day.rating && <RatingStars rating={day.rating} />}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {day.mapsUrl && (
              <a
                href={day.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                data-testid={`button-day-maps-${day.dayNumber}`}
              >
                <Map className="w-4 h-4" />
              </a>
            )}
            {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </CardContent>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {day.notes && (day.notes as string[]).length > 0 && (
            <div className="space-y-2">
              {(day.notes as string[]).map((note, i) => (
                <div key={i} className="bg-accent/20 text-accent-foreground rounded-xl px-3 py-2 text-xs font-medium flex items-start gap-2">
                  <span className="text-sm mt-0.5">💡</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}

          {events.length > 0 && (
            <div className="relative">
              <div className="absolute right-[19px] top-2 bottom-2 w-0.5 bg-border"></div>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3 items-start relative" data-testid={`event-${event.id}`}>
                    <div className="w-10 text-left flex-shrink-0">
                      <span className="text-[11px] font-bold text-primary">{event.time}</span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm mt-1 flex-shrink-0 z-10"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dayAttractions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">אטרקציות</h4>
              {dayAttractions.map((attr) => (
                <AttractionCard key={attr.id} attraction={attr} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AttractionCard({ attraction }: { attraction: Attraction }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 space-y-2.5" data-testid={`attraction-${attraction.id}`}>
      {attraction.image && (
        <div className="h-28 rounded-lg overflow-hidden">
          <img src={attraction.image} alt={attraction.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <h5 className="font-bold text-sm">{attraction.name}</h5>
        <p className="text-xs text-muted-foreground mt-0.5">{attraction.description}</p>
      </div>
      {attraction.badges && (attraction.badges as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(attraction.badges as string[]).map((badge, i) => (
            <span key={i} className="bg-white px-2 py-0.5 rounded-md text-[10px] font-semibold text-foreground/80 shadow-sm">{badge}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {attraction.mapsUrl && (
          <a href={attraction.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-maps-${attraction.id}`}>
            <Button size="sm" className="w-full rounded-lg bg-secondary hover:bg-secondary/90 text-white text-xs h-8 gap-1.5">
              <Navigation className="w-3 h-3" /> Google Maps
            </Button>
          </a>
        )}
        {attraction.wazeUrl && (
          <a href={attraction.wazeUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-waze-${attraction.id}`}>
            <Button size="sm" variant="outline" className="w-full rounded-lg text-xs h-8 gap-1.5">
              <ExternalLink className="w-3 h-3" /> Waze
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function ItineraryView() {
  const { data: days = [], isLoading } = useQuery<TripDay[]>({ queryKey: ["/api/trip-days"] });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">📅 מסלול יום-יומי</h2>
      {days.map((day) => (
        <DayCard key={day.id} day={day} />
      ))}
    </div>
  );
}

function HotelsView() {
  const { data: hotels = [], isLoading } = useQuery<Accommodation[]>({ queryKey: ["/api/accommodations"] });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const grouped = hotels.reduce((acc, h) => {
    const base = h.baseName || "אחר";
    if (!acc[base]) acc[base] = [];
    acc[base].push(h);
    return acc;
  }, {} as Record<string, Accommodation[]>);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">🏨 לינה</h2>
      {Object.entries(grouped).map(([baseName, hotels]) => (
        <div key={baseName} className="space-y-3">
          <h3 className="text-sm font-bold text-foreground/80 px-1">{baseName}</h3>
          {hotels.map((hotel) => (
            <Card key={hotel.id} className={`border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden ${hotel.isSelected ? 'ring-2 ring-success/50' : ''}`} data-testid={`hotel-card-${hotel.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{hotel.name}</h4>
                      {hotel.isSelected && <span className="bg-success/20 text-success-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">✅ הוזמן</span>}
                    </div>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                  {hotel.priceRange && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{hotel.priceRange}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{hotel.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{hotel.dates}</span>
                </div>
                <div className="flex gap-2">
                  {hotel.mapsUrl && (
                    <a href={hotel.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-hotel-maps-${hotel.id}`}>
                      <Button size="sm" className="w-full rounded-lg bg-secondary hover:bg-secondary/90 text-white text-xs h-8 gap-1.5">
                        <Navigation className="w-3 h-3" /> Maps
                      </Button>
                    </a>
                  )}
                  {hotel.wazeUrl && (
                    <a href={hotel.wazeUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-hotel-waze-${hotel.id}`}>
                      <Button size="sm" variant="outline" className="w-full rounded-lg text-xs h-8 gap-1.5">
                        <ExternalLink className="w-3 h-3" /> Waze
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

function CurrencyView() {
  const { data: rates = [] } = useQuery<CurrencyRate[]>({ queryKey: ["/api/currency-rates"] });
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("CZK");

  const filteredRates = rates.filter((r) => r.fromCurrency === fromCurrency);

  const quickAmounts = fromCurrency === "CZK"
    ? [50, 100, 200, 500, 1000, 2000]
    : fromCurrency === "EUR"
    ? [5, 10, 20, 50, 100, 200]
    : [10, 20, 50, 100, 200, 500];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">💱 מחשבון המרה</h2>

      <div className="flex gap-2 px-1">
        {["CZK", "EUR", "ILS"].map((cur) => (
          <button
            key={cur}
            onClick={() => { setFromCurrency(cur); setAmount("100"); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${fromCurrency === cur ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'}`}
            data-testid={`button-currency-${cur}`}
          >
            {cur === "CZK" ? "🇨🇿 CZK" : cur === "EUR" ? "🇪🇺 EUR" : "🇮🇱 ILS"}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] bg-white rounded-2xl">
        <CardContent className="p-5 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">סכום</Label>
            <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-xl">
              <span className="text-lg font-bold">{fromCurrency}</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-none shadow-none bg-transparent text-left text-2xl font-bold tracking-tight focus-visible:ring-0 px-2"
                dir="ltr"
                data-testid="input-currency-amount"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                onClick={() => setAmount(String(qa))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${Number(amount) === qa ? 'bg-primary text-white' : 'bg-muted/60 text-foreground/70 hover:bg-muted'}`}
                data-testid={`button-quick-${qa}`}
              >
                {qa.toLocaleString()}
              </button>
            ))}
          </div>

          {filteredRates.length > 0 && (
            <div className="space-y-3 pt-2">
              {filteredRates.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-success/10 rounded-xl" data-testid={`rate-result-${r.id}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{r.flag}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">1 {r.fromCurrency} = {r.rate} {r.toCurrency}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg" dir="ltr">{(Number(amount) * r.rate).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{r.toCurrency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-center text-muted-foreground pt-2">
            שער המרה משוער – מומלץ לבדוק שער עדכני לפני הטיול.
            כמעט בכל מקום בצ'כיה מקבלים כרטיסי אשראי.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PhotosView() {
  const { data: photos = [], isLoading } = useQuery<Photo[]>({ queryKey: ["/api/photos"] });
  const [showAdd, setShowAdd] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ url: "", caption: "" });

  const addMutation = useMutation({
    mutationFn: (photo: typeof newPhoto) => apiRequest("POST", "/api/photos", photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setShowAdd(false);
      setNewPhoto({ url: "", caption: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/photos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/photos"] }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">📸 גלריית הטיול</h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-secondary hover:bg-secondary/10 rounded-full h-9 w-9" data-testid="button-add-photo">
              <Camera className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת תמונה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>קישור לתמונה</Label>
                <Input placeholder="https://..." value={newPhoto.url} onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })} data-testid="input-photo-url" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>כיתוב</Label>
                <Input placeholder="תיאור..." value={newPhoto.caption} onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })} data-testid="input-photo-caption" />
              </div>
              {newPhoto.url && (
                <div className="rounded-xl overflow-hidden h-40">
                  <img src={newPhoto.url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Button className="w-full rounded-xl bg-secondary hover:bg-secondary/90" onClick={() => addMutation.mutate(newPhoto)} disabled={!newPhoto.url || !newPhoto.caption || addMutation.isPending} data-testid="button-save-photo">
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                שמירה
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">אין תמונות עדיין</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => (
            <div key={photo.id} className={`rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer bg-muted ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`} data-testid={`photo-${photo.id}`}>
              <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                <span className="text-white text-xs font-semibold">{photo.caption}</span>
                <button onClick={() => deleteMutation.mutate(photo.id)} className="text-white/80 hover:text-red-400 p-1" data-testid={`button-delete-photo-${photo.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TipsView() {
  const { data: tipsList = [], isLoading } = useQuery<Tip[]>({ queryKey: ["/api/tips"] });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">📌 טיפים חשובים</h2>
      <div className="space-y-3">
        {tipsList.map((tip, i) => (
          <Card key={tip.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white" data-testid={`tip-${tip.id}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
              <p className="text-sm text-foreground/90 leading-relaxed">{tip.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-5">
          <h3 className="font-bold text-sm mb-3">💰 הערכת תקציב</h3>
          <div className="space-y-2 text-xs">
            {[
              ["🏨 לינה ליד שדה (2 לילות)", "€160–240"],
              ["🏨 לינה בצפון צ'כיה (9 לילות)", "€550–900"],
              ["🚗 רכב שכור (10 ימים)", "€300–420"],
              ["⛽ דלק", "€100–150"],
              ["🎟 כניסה לאטרקציות", "€150–250"],
              ["🍽 אוכל", "€600–900"],
              ["🛍 שונות", "€100–150"],
            ].map(([item, cost]) => (
              <div key={item} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground/80">{item}</span>
                <span className="font-bold text-foreground">{cost}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold text-sm text-primary">
              <span>📊 סה"כ הערכה</span>
              <span>€1,960–3,010</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            צ'כיה זולה מאוד ביחס למערב אירופה. ארוחת צהריים במסעדה ~€8–15 לאדם.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}