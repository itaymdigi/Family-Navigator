import { useState, useRef, useEffect, createContext, useContext } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  CalendarDays, Hotel, Calculator, Image as ImageIcon,
  MapPin, ExternalLink, Navigation, Clock, Star, Users,
  ChevronDown, ChevronUp, Lightbulb, Camera, Trash2, Loader2,
  Plus, Pencil, Map, X, Check, Upload, Link, CloudOff, Wifi,
  Filter, Maximize2, Lock, Unlock, FileText, FolderOpen, Globe,
  Plane, CreditCard, FileCheck, MoreVertical, UtensilsCrossed,
  MapPinned, ThumbsUp, ThumbsDown, LogOut, User
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const AdminContext = createContext<{ isAdmin: boolean; toggleAdmin: () => void }>({ isAdmin: false, toggleAdmin: () => {} });
function useAdmin() { return useContext(AdminContext); }

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);
  return online;
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isToday: false });
  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        const tripEnd = new Date("2026-04-04T23:59:59").getTime();
        if (now <= tripEnd) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isToday: true });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isToday: false });
        }
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isPast: false,
        isToday: false,
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

export default function TripPlanner({ tripId }: { tripId: string }) {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [isAdmin, setIsAdmin] = useState(false);
  const isOnline = useOnlineStatus();
  const countdown = useCountdown("2026-03-25T00:00:00");
  const currentUser = useQuery(api.users.me);
  const { signOut } = useAuthActions();

  const user = currentUser as (Doc<"users"> & { role?: string }) | null | undefined;

  const toggleAdmin = () => {
    if (user?.role === "admin") {
      setIsAdmin(!isAdmin);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin }}>
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
              <div className="flex items-center gap-2">
                {!isOnline && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full" data-testid="offline-indicator">
                    <CloudOff className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">אופליין</span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full">
                  <User className="w-3 h-3" />
                  <span className="text-[10px] font-medium" data-testid="text-username">{user?.name ?? ""}</span>
                </div>
                {user?.role === "admin" && (
                  <button
                    onClick={toggleAdmin}
                    className={`p-2 rounded-full transition-all ${isAdmin ? "bg-green-500/30 text-white" : "bg-white/15 text-white/70 hover:bg-white/25"}`}
                    data-testid="button-toggle-admin"
                    title={isAdmin ? "מצב עריכה פעיל" : "כניסה למצב עריכה"}
                  >
                    {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full bg-white/15 text-white/70 hover:bg-red-500/30 hover:text-white transition-all"
                  data-testid="button-logout"
                  title="התנתק"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["🏔 שוויץ הבוהמית", "🪨 אדרשפאך", "🌲 גן עדן בוהמי", "🏰 טירות"].map((tag) => (
                <span key={tag} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold">{tag}</span>
              ))}
            </div>
            {!countdown.isPast && (
              <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-2xl p-3" data-testid="countdown-timer">
                {countdown.isToday ? (
                  <div className="text-center">
                    <p className="text-lg font-bold animate-pulse">🎉 הטיול התחיל!</p>
                    <p className="text-[11px] opacity-90">תהנו מכל רגע בצ'כיה</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-semibold text-center opacity-80 mb-1.5">⏳ ספירה לאחור לטיול</p>
                    <div className="flex justify-center gap-2">
                      {[
                        { value: countdown.days, label: "ימים" },
                        { value: countdown.hours, label: "שעות" },
                        { value: countdown.minutes, label: "דקות" },
                        { value: countdown.seconds, label: "שניות" },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/20 rounded-xl px-2.5 py-1.5 min-w-[52px] text-center">
                          <div className="text-lg font-bold tabular-nums leading-tight">{String(item.value).padStart(2, "0")}</div>
                          <div className="text-[9px] font-medium opacity-80">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {isAdmin && (
              <div className="mt-3 bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-center">
                <span className="text-[11px] font-bold">מצב עריכה פעיל - ניתן להוסיף, לערוך ולמחוק</span>
              </div>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-4 z-0">
            {activeTab === "itinerary" && <ItineraryView tripId={tripId} />}
            {activeTab === "hotels" && <HotelsView tripId={tripId} />}
            {activeTab === "currency" && <CurrencyView />}
            {activeTab === "map" && <MapView tripId={tripId} />}
            {activeTab === "photos" && <PhotosView tripId={tripId} />}
            {activeTab === "docs" && <DocsView tripId={tripId} />}
            {activeTab === "food" && <RestaurantsView tripId={tripId} />}
            {activeTab === "tips" && <TipsView tripId={tripId} />}
          </main>

          <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-border px-1 py-3 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
            <NavItem icon={<CalendarDays className="w-4.5 h-4.5" />} label="מסלול" isActive={activeTab === "itinerary"} onClick={() => setActiveTab("itinerary")} />
            <NavItem icon={<Hotel className="w-4.5 h-4.5" />} label="לינה" isActive={activeTab === "hotels"} onClick={() => setActiveTab("hotels")} />
            <NavItem icon={<Globe className="w-4.5 h-4.5" />} label="מפה" isActive={activeTab === "map"} onClick={() => setActiveTab("map")} />
            <NavItem icon={<Calculator className="w-4.5 h-4.5" />} label="מט״ח" isActive={activeTab === "currency"} onClick={() => setActiveTab("currency")} />
            <NavItem icon={<ImageIcon className="w-4.5 h-4.5" />} label="תמונות" isActive={activeTab === "photos"} onClick={() => setActiveTab("photos")} />
            <NavItem icon={<FolderOpen className="w-4.5 h-4.5" />} label="מסמכים" isActive={activeTab === "docs"} onClick={() => setActiveTab("docs")} />
            <NavItem icon={<UtensilsCrossed className="w-4.5 h-4.5" />} label="אוכל" isActive={activeTab === "food"} onClick={() => setActiveTab("food")} />
            <NavItem icon={<Lightbulb className="w-4.5 h-4.5" />} label="טיפים" isActive={activeTab === "tips"} onClick={() => setActiveTab("tips")} />
          </nav>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} data-testid={`nav-${label}`}
      className={`flex flex-col items-center gap-0.5 transition-all duration-300 ease-out flex-1 min-w-0 ${isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"}`}>
      <div className={`${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"} p-1.5 rounded-xl transition-colors duration-300`}>{icon}</div>
      <span className={`text-[9px] font-semibold ${isActive ? "opacity-100" : "opacity-70"} truncate max-w-full`}>{label}</span>
    </button>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function EditableField({ value, onSave, type = "text", className = "" }: { value: string; onSave: (v: string) => void; type?: string; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (!editing) return <span onClick={() => setEditing(true)} className={`cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 transition-colors ${className}`}>{value}</span>;
  return (
    <div className="flex items-center gap-1">
      <Input type={type} value={val} onChange={(e) => setVal(e.target.value)} className="h-7 text-xs" autoFocus onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } if (e.key === "Escape") setEditing(false); }} />
      <button onClick={() => { onSave(val); setEditing(false); }} className="text-success"><Check className="w-4 h-4" /></button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
    </div>
  );
}

function DayCard({ day, tripId }: { day: Doc<"tripDays">; tripId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { isAdmin } = useAdmin();
  const events = useQuery(api.dayEvents.listByDay, expanded ? { dayId: day._id } : "skip");
  const dayAttractions = useQuery(api.attractions.listByDay, expanded ? { dayId: day._id } : "skip");

  const updateDay = useMutation(api.tripDays.update);
  const deleteDay = useMutation(api.tripDays.remove);
  const deleteEvent = useMutation(api.dayEvents.remove);
  const deleteAttr = useMutation(api.attractions.remove);

  const displayEvents = events ?? [];
  const displayAttractions = dayAttractions ?? [];

  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden" data-testid={`day-card-${day.dayNumber}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-right" data-testid={`button-expand-day-${day.dayNumber}`}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold ${day.dayNumber === 0 || day.dayNumber === 10 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
            <span className="text-[10px] leading-none font-semibold">יום</span>
            <span className="text-lg leading-none">{day.dayNumber}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium">{day.subtitle}</p>
            <h3 className="font-bold text-sm text-foreground truncate">{day.title}</h3>
            {day.rating && <RatingStars rating={day.rating} />}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {day.weatherIcon && (
              <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <span className="text-lg leading-none">{day.weatherIcon}</span>
                <span className="text-[10px] font-bold text-foreground/60">{day.weatherTemp}</span>
              </div>
            )}
            {day.mapsUrl && (
              <a href={day.mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors" data-testid={`button-day-maps-${day.dayNumber}`}>
                <Map className="w-4 h-4" />
              </a>
            )}
            {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </CardContent>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {day.weatherIcon && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2" data-testid={`weather-${day.dayNumber}`}>
              <span className="text-2xl">{day.weatherIcon}</span>
              <div>
                <span className="font-bold text-sm text-blue-900">{day.weatherTemp}</span>
                <span className="text-xs text-blue-700 mr-2"> · {day.weatherDesc}</span>
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="flex gap-2 justify-end">
              <button onClick={(e) => { e.stopPropagation(); deleteDay({ id: day._id }); }} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors" data-testid={`button-delete-day-${day.dayNumber}`}>
                <Trash2 className="w-3 h-3" /> מחק יום
              </button>
            </div>
          )}
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
          {displayEvents.length > 0 && (
            <div className="relative">
              <div className="absolute right-[19px] top-2 bottom-2 w-0.5 bg-border"></div>
              <div className="space-y-3">
                {displayEvents.map((event) => (
                  <div key={event._id} className="flex gap-3 items-start relative group" data-testid={`event-${event._id}`}>
                    <div className="w-10 text-left flex-shrink-0"><span className="text-[11px] font-bold text-primary">{event.time}</span></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm mt-1 flex-shrink-0 z-10"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                    </div>
                    {isAdmin && <button onClick={() => deleteEvent({ id: event._id })} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity" data-testid={`button-delete-event-${event._id}`}>
                      <Trash2 className="w-3 h-3" />
                    </button>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {isAdmin && <AddEventForm dayId={day._id} />}
          {displayAttractions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">אטרקציות</h4>
              {displayAttractions.map((attr) => (
                <AttractionCard key={attr._id} attraction={attr} dayId={day._id} onDelete={() => deleteAttr({ id: attr._id })} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AddEventForm({ dayId }: { dayId: Id<"tripDays"> }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const createEvent = useMutation(api.dayEvents.create);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!time || !title) return;
    setSaving(true);
    try {
      await createEvent({ dayId, time, title, description: desc || undefined, sortOrder: 99 });
      setOpen(false); setTime(""); setTitle(""); setDesc("");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 py-1" data-testid={`button-add-event-${dayId}`}>
      <Plus className="w-3 h-3" /> הוסף אירוע
    </button>
  );
  return (
    <div className="bg-muted/30 rounded-xl p-3 space-y-2 animate-in fade-in duration-200">
      <div className="flex gap-2">
        <Input placeholder="שעה" value={time} onChange={(e) => setTime(e.target.value)} className="w-20 h-8 text-xs" dir="ltr" data-testid={`input-event-time-${dayId}`} />
        <Input placeholder="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 h-8 text-xs" data-testid={`input-event-title-${dayId}`} />
      </div>
      <Input placeholder="תיאור (אופציונלי)" value={desc} onChange={(e) => setDesc(e.target.value)} className="h-8 text-xs" data-testid={`input-event-desc-${dayId}`} />
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs rounded-lg bg-primary" onClick={handleSave} disabled={!time || !title || saving} data-testid={`button-save-event-${dayId}`}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "שמור"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={() => setOpen(false)}>ביטול</Button>
      </div>
    </div>
  );
}

function AttractionCard({ attraction, dayId, onDelete }: { attraction: Doc<"attractions">; dayId: Id<"tripDays">; onDelete: () => void }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 space-y-2.5 group relative" data-testid={`attraction-${attraction._id}`}>
      {useAdmin().isAdmin && <button onClick={onDelete} className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1.5 bg-white/80 rounded-lg transition-opacity z-10" data-testid={`button-delete-attr-${attraction._id}`}>
        <Trash2 className="w-3 h-3" />
      </button>}
      {attraction.image && (
        <div className="h-28 rounded-lg overflow-hidden"><img src={attraction.image} alt={attraction.name} className="w-full h-full object-cover" /></div>
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
          <a href={attraction.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-maps-${attraction._id}`}>
            <Button size="sm" className="w-full rounded-lg bg-secondary hover:bg-secondary/90 text-white text-xs h-8 gap-1.5"><Navigation className="w-3 h-3" /> Google Maps</Button>
          </a>
        )}
        {attraction.wazeUrl && (
          <a href={attraction.wazeUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`button-waze-${attraction._id}`}>
            <Button size="sm" variant="outline" className="w-full rounded-lg text-xs h-8 gap-1.5"><ExternalLink className="w-3 h-3" /> Waze</Button>
          </a>
        )}
      </div>
    </div>
  );
}

function ItineraryView({ tripId }: { tripId: string }) {
  const days = useQuery(api.tripDays.list, { tripId: tripId as Id<"trips"> });
  if (days === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">📅 מסלול יום-יומי</h2>
      {days.map((day) => <DayCard key={day._id} day={day} tripId={tripId} />)}
    </div>
  );
}

function HotelsView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const hotels = useQuery(api.accommodations.list, { tripId: tripId as Id<"trips"> });
  const [showDocDialog, setShowDocDialog] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");

  const deleteAccommodation = useMutation(api.accommodations.remove);
  const updateAccommodation = useMutation(api.accommodations.update);

  const handleUpdateReservation = async () => {
    if (showDocDialog && docUrl) {
      await updateAccommodation({ id: showDocDialog as Id<"accommodations">, reservationUrl: docUrl, reservationName: docName || "מסמך הזמנה" });
      setShowDocDialog(null); setDocUrl(""); setDocName("");
    }
  };

  const handleRemoveReservation = async () => {
    if (showDocDialog) {
      await updateAccommodation({ id: showDocDialog as Id<"accommodations">, reservationUrl: undefined, reservationName: undefined });
      setShowDocDialog(null);
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
                    {isAdmin && <button onClick={() => deleteAccommodation({ id: hotel._id })} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity" data-testid={`button-delete-hotel-${hotel._id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{hotel.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>{hotel.dates}</span></div>

                {hotel.reservationUrl && (
                  <a
                    href={hotel.reservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                    data-testid={`link-reservation-${hotel._id}`}
                  >
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-xs h-8 gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        setShowDocDialog(hotel._id);
                        setDocUrl(hotel.reservationUrl || "");
                        setDocName(hotel.reservationName || "");
                      }}
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

      <Dialog open={showDocDialog !== null} onOpenChange={(open) => { if (!open) { setShowDocDialog(null); setDocUrl(""); setDocName(""); } }}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>צירוף מסמך הזמנה</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="שם המסמך (למשל: אישור הזמנה Booking)" value={docName} onChange={(e) => setDocName(e.target.value)} data-testid="input-reservation-name" />
            <Input placeholder="קישור למסמך (URL)" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} data-testid="input-reservation-url" />
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 h-10 text-sm rounded-xl bg-primary"
                onClick={handleUpdateReservation}
                disabled={!docUrl}
                data-testid="button-save-reservation"
              >
                שמור
              </Button>
              {showDocDialog && hotels?.find(h => h._id === showDocDialog)?.reservationUrl && (
                <Button
                  variant="outline"
                  className="h-10 text-sm rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                  onClick={handleRemoveReservation}
                  data-testid="button-remove-reservation"
                >
                  <Trash2 className="w-3.5 h-3.5 ml-1" /> הסר
                </Button>
              )}
              <Button variant="outline" className="h-10 text-sm rounded-xl" onClick={() => { setShowDocDialog(null); setDocUrl(""); setDocName(""); }}>ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CurrencyView() {
  const rates = useQuery(api.currencyRates.list);
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("CZK");
  const displayRates = rates ?? [];
  const filteredRates = displayRates.filter((r) => r.fromCurrency === fromCurrency);
  const quickAmounts = fromCurrency === "CZK" ? [50, 100, 200, 500, 1000, 2000] : fromCurrency === "EUR" ? [5, 10, 20, 50, 100, 200] : [10, 20, 50, 100, 200, 500];
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">💱 מחשבון המרה</h2>
      <div className="flex gap-2 px-1">
        {["CZK", "EUR", "ILS"].map((cur) => (
          <button key={cur} onClick={() => { setFromCurrency(cur); setAmount("100"); }} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${fromCurrency === cur ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground"}`} data-testid={`button-currency-${cur}`}>
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
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="border-none shadow-none bg-transparent text-left text-2xl font-bold tracking-tight focus-visible:ring-0 px-2" dir="ltr" data-testid="input-currency-amount" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((qa) => (
              <button key={qa} onClick={() => setAmount(String(qa))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${Number(amount) === qa ? "bg-primary text-white" : "bg-muted/60 text-foreground/70 hover:bg-muted"}`} data-testid={`button-quick-${qa}`}>{qa.toLocaleString()}</button>
            ))}
          </div>
          {filteredRates.length > 0 && (
            <div className="space-y-3 pt-2">
              {filteredRates.map((r) => (
                <div key={r._id} className="flex items-center justify-between p-3 bg-success/10 rounded-xl" data-testid={`rate-result-${r._id}`}>
                  <div className="flex items-center gap-2"><span className="text-xl">{r.flag}</span><p className="text-xs text-muted-foreground">1 {r.fromCurrency} = {r.rate} {r.toCurrency}</p></div>
                  <div className="text-left"><p className="font-bold text-lg" dir="ltr">{(Number(amount) * r.rate).toFixed(2)}</p><p className="text-[10px] text-muted-foreground font-medium">{r.toCurrency}</p></div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-center text-muted-foreground pt-2">שער המרה משוער – מומלץ לבדוק שער עדכני לפני הטיול. כמעט בכל מקום בצ'כיה מקבלים כרטיסי אשראי.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PhotosView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const photos = useQuery(api.photos.list, { tripId: tripId as Id<"trips"> });
  const members = useQuery(api.familyMembers.list, { tripId: tripId as Id<"trips"> });
  const [showAdd, setShowAdd] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [newPhoto, setNewPhoto] = useState({ url: "", caption: "", uploadedBy: null as string | null, category: "general" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Doc<"photos"> | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("הכל");

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);
  const deletePhoto = useMutation(api.photos.remove);

  const categories = ["הכל", "נופים", "אוכל", "משפחה", "אטרקציות"];
  const displayPhotos = photos ?? [];
  const displayMembers = members ?? [];

  const filteredPhotos = displayPhotos.filter(p =>
    filterCategory === "הכל" || p.category === filterCategory
  );

  const resetForm = () => {
    setNewPhoto({ url: "", caption: "", uploadedBy: null, category: "general" });
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (uploadMode === "url") {
      await createPhoto({ tripId: tripId as Id<"trips">, url: newPhoto.url, caption: newPhoto.caption, category: newPhoto.category });
      setShowAdd(false);
      resetForm();
      return;
    }
    if (!selectedFile || !newPhoto.caption) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, { method: "POST", body: selectedFile, headers: { "Content-Type": selectedFile.type } });
      const { storageId } = await result.json();
      await createPhoto({ tripId: tripId as Id<"trips">, storageId, caption: newPhoto.caption, category: newPhoto.category });
      setShowAdd(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (photos === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;

  const getMemberName = (id: string | null) => {
    if (!id) return null;
    return displayMembers.find((m) => m._id === id);
  };

  const canSave = uploadMode === "file" ? (!!selectedFile && !!newPhoto.caption) : (!!newPhoto.url && !!newPhoto.caption);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">📸 גלריית הטיול</h2>
        <div className="flex gap-1">
          {isAdmin && <Dialog open={showMembers} onOpenChange={setShowMembers}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9" data-testid="button-manage-members">
                <Users className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
              <DialogHeader><DialogTitle>בני משפחה</DialogTitle></DialogHeader>
              <FamilyMembersManager tripId={tripId} />
            </DialogContent>
          </Dialog>}
          {isAdmin && <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-secondary hover:text-secondary hover:bg-secondary/10 rounded-full h-9 w-9" data-testid="button-add-photo">
                <Camera className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
              <DialogHeader><DialogTitle>הוספת תמונה</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <button onClick={() => setUploadMode("file")} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${uploadMode === "file" ? "bg-secondary text-white" : "bg-muted text-muted-foreground"}`} data-testid="button-mode-file">
                    <Upload className="w-3.5 h-3.5" /> מהמכשיר
                  </button>
                  <button onClick={() => setUploadMode("url")} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${uploadMode === "url" ? "bg-secondary text-white" : "bg-muted text-muted-foreground"}`} data-testid="button-mode-url">
                    <Link className="w-3.5 h-3.5" /> קישור URL
                  </button>
                </div>
                {uploadMode === "file" ? (
                  <div className="space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" data-testid="input-photo-file" />
                    {filePreview ? (
                      <div className="relative rounded-xl overflow-hidden h-48">
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => { setSelectedFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1.5"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()} className="w-full h-36 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-secondary/50 hover:bg-secondary/5 transition-colors" data-testid="button-select-file">
                        <Camera className="w-8 h-8 text-muted-foreground/40" />
                        <span className="text-sm text-muted-foreground font-medium">לחצו לצלם או לבחור תמונה</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>קישור לתמונה</Label>
                    <Input placeholder="https://..." value={newPhoto.url} onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })} data-testid="input-photo-url" dir="ltr" />
                    {newPhoto.url && <div className="rounded-xl overflow-hidden h-40"><img src={newPhoto.url} alt="Preview" className="w-full h-full object-cover" /></div>}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>קטגוריה</Label>
                  <Select value={newPhoto.category} onValueChange={(v) => setNewPhoto({ ...newPhoto, category: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">כללי</SelectItem>
                      <SelectItem value="נופים">נופים</SelectItem>
                      <SelectItem value="אוכל">אוכל</SelectItem>
                      <SelectItem value="משפחה">משפחה</SelectItem>
                      <SelectItem value="אטרקציות">אטרקציות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>כיתוב</Label>
                  <Input placeholder="תיאור..." value={newPhoto.caption} onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })} data-testid="input-photo-caption" />
                </div>
                {displayMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label>מי העלה?</Label>
                    <Select value={newPhoto.uploadedBy || "none"} onValueChange={(v) => setNewPhoto({ ...newPhoto, uploadedBy: v === "none" ? null : v })}>
                      <SelectTrigger data-testid="select-photo-uploader"><SelectValue placeholder="בחר..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא</SelectItem>
                        {displayMembers.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button className="w-full rounded-xl bg-secondary hover:bg-secondary/90" onClick={handleUpload} disabled={!canSave || uploading} data-testid="button-save-photo">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />} שמירה
                </Button>
              </div>
            </DialogContent>
          </Dialog>}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar mb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              filterCategory === cat
                ? "bg-primary text-white shadow-sm scale-105"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {displayMembers.length > 0 && (
        <div className="flex gap-2 px-1 overflow-x-auto pb-1 mb-2">
          {displayMembers.map((m) => (
            <div key={m._id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: m.color }} data-testid={`member-avatar-${m._id}`}>
                {m.avatar || m.name[0]}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{m.name}</span>
            </div>
          ))}
        </div>
      )}

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">אין תמונות בקטגוריה זו</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredPhotos.map((photo, i) => {
            const member = getMemberName(photo.uploadedBy ?? null);
            return (
              <div
                key={photo._id}
                className={`rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer bg-muted ${i % 5 === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}
                data-testid={`photo-${photo._id}`}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                {member && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ backgroundColor: member.color }}>
                    {member.avatar || member.name[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                  <span className="text-white text-xs font-semibold">{photo.caption}</span>
                  {isAdmin && <button onClick={(e) => { e.stopPropagation(); deletePhoto({ id: photo._id }); }} className="text-white/80 hover:text-red-400 p-1" data-testid={`button-delete-photo-${photo._id}`}><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-[100vw] h-[100vh] p-0 overflow-hidden border-none bg-black/95 flex flex-col items-center justify-center">
          {selectedPhoto && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="max-w-full max-h-[85vh] object-contain" />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white text-right">
                <p className="font-bold text-xl mb-1">{selectedPhoto.caption}</p>
                <div className="flex items-center gap-2 opacity-80 text-sm">
                  {getMemberName(selectedPhoto.uploadedBy ?? null) && (
                    <span>הועלה על ידי: {getMemberName(selectedPhoto.uploadedBy ?? null)?.name}</span>
                  )}
                  <span>•</span>
                  <span>{selectedPhoto.category === "general" ? "כללי" : selectedPhoto.category}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-10 right-6 text-white/80 hover:text-white bg-white/10 backdrop-blur-md rounded-full p-2.5 z-50 transition-all hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FamilyMembersManager({ tripId }: { tripId: string }) {
  const members = useQuery(api.familyMembers.list, { tripId: tripId as Id<"trips"> });
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#6C5CE7", "#FD79A8", "#00B894", "#E17055"];
  const [color, setColor] = useState(colors[0]);

  const addMember = useMutation(api.familyMembers.create);
  const deleteMember = useMutation(api.familyMembers.remove);
  const [saving, setSaving] = useState(false);

  const displayMembers = members ?? [];

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-3">
        {displayMembers.map((m) => (
          <div key={m._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl" data-testid={`member-row-${m._id}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: m.color }}>
                {m.avatar || m.name[0]}
              </div>
              <span className="font-medium text-sm">{m.name}</span>
            </div>
            <button onClick={() => deleteMember({ id: m._id })} className="text-red-400 hover:text-red-600 p-1" data-testid={`button-delete-member-${m._id}`}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t pt-3">
        <div className="flex gap-2">
          <Input placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 h-9 text-sm" data-testid="input-member-name" />
          <Input placeholder="🙂" value={avatar} onChange={(e) => setAvatar(e.target.value)} className="w-14 h-9 text-center text-lg" data-testid="input-member-avatar" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {colors.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`} style={{ backgroundColor: c }} data-testid={`button-color-${c}`} />
          ))}
        </div>
        <Button
          className="w-full rounded-xl bg-primary h-9 text-sm"
          onClick={async () => {
            if (!name) return;
            setSaving(true);
            try { await addMember({ tripId: tripId as Id<"trips">, name, avatar: avatar || undefined, color }); setName(""); setAvatar(""); }
            finally { setSaving(false); }
          }}
          disabled={!name || saving}
          data-testid="button-add-member"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />} הוסף בן משפחה
        </Button>
      </div>
    </div>
  );
}

function MapView({ tripId }: { tripId: string }) {
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
                  <button onClick={() => deleteLocation({ id: loc._id })} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity" data-testid={`button-delete-location-${loc._id}`}>
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

function DocsView({ tripId }: { tripId: string }) {
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
                    <button onClick={() => deleteDoc({ id: doc._id })} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity" data-testid={`button-delete-doc-${doc._id}`}>
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

            {/* Upload mode toggle */}
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

function RestaurantsView({ tripId }: { tripId: string }) {
  const { isAdmin } = useAdmin();
  const restaurants = useQuery(api.restaurants.list, { tripId: tripId as Id<"trips"> });
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", cuisine: "", priceRange: "", address: "", mapsUrl: "", wazeUrl: "", notes: "", isKosher: false, rating: 0, lat: "", lng: "" });

  const addRestaurant = useMutation(api.restaurants.create);
  const updateRestaurant = useMutation(api.restaurants.update);
  const deleteRestaurant = useMutation(api.restaurants.remove);
  const [saving, setSaving] = useState(false);

  const displayRestaurants = restaurants ?? [];

  const resetForm = () => setForm({ name: "", cuisine: "", priceRange: "", address: "", mapsUrl: "", wazeUrl: "", notes: "", isKosher: false, rating: 0, lat: "", lng: "" });

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

  const getCuisineInfo = (cuisine: string | null | undefined) => cuisineOptions.find(c => c.value === cuisine) || { value: "other", label: "מסעדה", icon: "🍴" };

  if (restaurants === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
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
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary p-1.5 transition-all"
                          data-testid={`button-edit-restaurant-${r._id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteRestaurant({ id: r._id })} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1.5 transition-all" data-testid={`button-delete-restaurant-${r._id}`}>
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

function TipsView({ tripId }: { tripId: string }) {
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
              {isAdmin && <button onClick={() => deleteTip({ id: tip._id })} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity flex-shrink-0" data-testid={`button-delete-tip-${tip._id}`}>
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
