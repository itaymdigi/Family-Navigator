import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { useLocation } from "wouter";
import {
  CalendarDays, Hotel, Calculator, Image as ImageIcon,
  MapPin, Loader2, Search, X, CloudOff, Lightbulb,
  Globe, UtensilsCrossed, Home, Package, ListChecks, Backpack,
  Grid3X3, Lock, Unlock, User, LogOut, FolderOpen,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { AdminContext, useWithCache } from "@/lib/trip-context";
import { ItineraryView } from "./tabs/ItineraryTab";
import { HotelsView } from "./tabs/HotelsTab";
import { CurrencyView } from "./tabs/CurrencyTab";
import { PhotosView } from "./tabs/PhotosTab";
import { MapView } from "./tabs/MapTab";
import { DocsView } from "./tabs/DocsTab";
import { RestaurantsView } from "./tabs/RestaurantsTab";
import { TipsView } from "./tabs/TipsTab";
import { PackingView, ChecklistView } from "./tabs/PackingTab";

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

function useCountdown(targetDate: string, endDate?: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isToday: false });
  useEffect(() => {
    const toLocal = (d: string) => new Date(d.includes("T") ? d : d + "T00:00:00").getTime();
    const calc = () => {
      const now = new Date().getTime();
      const target = toLocal(targetDate);
      const diff = target - now;
      if (diff <= 0) {
        const tripEnd = endDate ? new Date(endDate + "T23:59:59").getTime() : 0;
        if (tripEnd > 0 && now <= tripEnd) {
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
  }, [targetDate, endDate]);
  return timeLeft;
}

const ALL_TABS = [
  { id: "itinerary",  label: "מסלול",   icon: <CalendarDays   className="w-5 h-5" /> },
  { id: "hotels",     label: "לינה",    icon: <Hotel          className="w-5 h-5" /> },
  { id: "map",        label: "מפה",     icon: <Globe          className="w-5 h-5" /> },
  { id: "currency",   label: 'מט"ח',   icon: <Calculator     className="w-5 h-5" /> },
  { id: "photos",     label: "תמונות",  icon: <ImageIcon      className="w-5 h-5" /> },
  { id: "docs",       label: "מסמכים",  icon: <FolderOpen     className="w-5 h-5" /> },
  { id: "food",       label: "אוכל",    icon: <UtensilsCrossed className="w-5 h-5" /> },
  { id: "tips",       label: "טיפים",   icon: <Lightbulb      className="w-5 h-5" /> },
  { id: "packing",    label: "הכנות",   icon: <Backpack       className="w-5 h-5" /> },
];

const PRIMARY_TAB_IDS = ["itinerary", "hotels", "food", "packing"];

export default function TripPlanner({ tripId }: { tripId: string }) {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isOnline = useOnlineStatus();
  const tripLive = useQuery(api.trips.get, { id: tripId as Id<"trips"> });
  const trip = useWithCache(tripLive, `fnav-trip-${tripId}`);
  const countdown = useCountdown(trip?.startDate ?? "2099-01-01T00:00:00", trip?.endDate);
  const currentUser = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const [, navigate] = useLocation();
  const allChecklist = useQuery(api.checklistItems.list, { tripId: tripId as Id<"trips"> });
  const allPacking = useQuery(api.packingItems.list, { tripId: tripId as Id<"trips"> });

  const user = currentUser as (Doc<"users"> & { role?: string }) | null | undefined;

  const toggleAdmin = () => {
    if (user?.role === "admin") {
      setIsAdmin(!isAdmin);
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin, isOnline }}>
      <div className="h-dvh bg-muted/50 flex justify-center selection:bg-primary/20 overflow-hidden" dir="rtl">
        <div className="w-full max-w-md bg-background shadow-2xl h-dvh relative flex flex-col overflow-hidden sm:border-x sm:border-border" style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}>
          <header className="pb-5 px-4 bg-primary text-primary-foreground rounded-b-[2rem] shadow-lg z-10 relative" style={{ paddingTop: "calc(1.75rem + env(safe-area-inset-top))" }}>
            <div className="flex justify-between items-center gap-2 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-fluid-2xl flex-shrink-0 leading-none">{trip?.coverEmoji ?? "✈️"}</span>
                  <h1 className="text-fluid-xl font-bold tracking-tight truncate text-balance" data-testid="text-trip-title">{trip?.name ?? ""}</h1>
                </div>
                {trip && (() => {
                  const s = new Date(trip.startDate + "T00:00:00");
                  const e = new Date(trip.endDate + "T00:00:00");
                  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  return <p className="text-primary-foreground/80 text-fluid-xs font-medium truncate tabular-nums">{`${s.getDate()}.${s.getMonth() + 1} – ${e.getDate()}.${e.getMonth() + 1}.${e.getFullYear()} · ${days} ימים`}</p>;
                })()}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!isOnline && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full" data-testid="offline-indicator">
                    <CloudOff className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold hidden sm:inline">אופליין</span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full">
                  <User className="w-3 h-3" />
                  <span className="text-[10px] font-medium hidden sm:inline" data-testid="text-username">{user?.name ?? ""}</span>
                </div>
                {user?.role === "admin" && (
                  <button
                    onClick={toggleAdmin}
                    className={`p-1.5 rounded-full transition-all ${isAdmin ? "bg-green-500/30 text-white" : "bg-white/15 text-white/70 hover:bg-white/25"}`}
                    data-testid="button-toggle-admin"
                    title={isAdmin ? "מצב עריכה פעיל" : "כניסה למצב עריכה"}
                  >
                    {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-1.5 rounded-full bg-white/15 text-white/80 hover:bg-white/25 transition-all"
                  data-testid="button-search"
                  aria-label="חיפוש בטיול"
                  title="חיפוש"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="p-1.5 rounded-full bg-white/15 text-white/80 hover:bg-white/25 transition-all"
                  data-testid="button-home"
                  title="כל הטיולים"
                >
                  <Home className="w-4 h-4" />
                </button>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-full bg-white/15 text-white/70 hover:bg-red-500/30 hover:text-white transition-all"
                  data-testid="button-logout"
                  title="התנתק"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            {trip && !countdown.isPast && (
              <div className="mt-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5" data-testid="countdown-timer">
                {countdown.isToday ? (
                  <p className="text-sm font-bold text-center animate-pulse">🎉 הטיול התחיל! תהנו!</p>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[10px] opacity-75 ml-1">⏳</span>
                    {[
                      { value: countdown.days, label: "ימ" },
                      { value: countdown.hours, label: "שע" },
                      { value: countdown.minutes, label: "דק" },
                      { value: countdown.seconds, label: "שנ" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-baseline gap-0.5">
                        <span className="text-base font-bold tabular-nums leading-none">{String(item.value).padStart(2, "0")}</span>
                        <span className="text-[9px] opacity-70">{item.label}</span>
                        {i < 3 && <span className="text-[10px] opacity-50 mr-0.5">:</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {(allChecklist !== undefined || allPacking !== undefined) && (
              <div className="mt-2 flex gap-2 justify-center">
                {allChecklist !== undefined && allChecklist.length > 0 && (() => {
                  const done = allChecklist.filter((c) => c.isDone).length;
                  const total = allChecklist.length;
                  return (
                    <button
                      onClick={() => { setActiveTab("checklist"); }}
                      className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-white/25 transition-all"
                    >
                      <ListChecks className="w-3 h-3 opacity-80" />
                      <span className="text-[10px] font-bold tabular-nums">{done}/{total}</span>
                      <span className="text-[9px] opacity-70">משימות</span>
                    </button>
                  );
                })()}
                {allPacking !== undefined && allPacking.length > 0 && (() => {
                  const packed = allPacking.filter((p) => p.isPacked).length;
                  const total = allPacking.length;
                  return (
                    <button
                      onClick={() => { setActiveTab("packing"); }}
                      className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-white/25 transition-all"
                    >
                      <Package className="w-3 h-3 opacity-80" />
                      <span className="text-[10px] font-bold tabular-nums">{packed}/{total}</span>
                      <span className="text-[9px] opacity-70">ציוד</span>
                    </button>
                  );
                })()}
              </div>
            )}
            {isAdmin && (
              <div className="mt-3 bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-center">
                <span className="text-[11px] font-bold">מצב עריכה פעיל - ניתן להוסיף, לערוך ולמחוק</span>
              </div>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-4 z-0 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            {!isOnline && (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-amber-800" data-testid="offline-banner">
                <CloudOff className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">מצב לא מקוון</p>
                  <p className="text-[10px] opacity-75">מציג נתונים שמורים · שינויים לא יישמרו</p>
                </div>
              </div>
            )}
            {activeTab === "itinerary" && <ItineraryView tripId={tripId} />}
            {activeTab === "hotels" && <HotelsView tripId={tripId} />}
            {activeTab === "currency" && <CurrencyView />}
            {activeTab === "map" && <MapView tripId={tripId} />}
            {activeTab === "photos" && <PhotosView tripId={tripId} />}
            {activeTab === "docs" && <DocsView tripId={tripId} />}
            {activeTab === "food" && <RestaurantsView tripId={tripId} />}
            {activeTab === "tips" && <TipsView tripId={tripId} />}
            {(activeTab === "packing" || activeTab === "checklist") && (
              <>
                <div className="flex gap-2 sticky top-0 z-10 bg-muted/50 -mx-4 px-4 py-2 -mt-4 mb-0 backdrop-blur-sm border-b border-border/30">
                  <button
                    onClick={() => setActiveTab("packing")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "packing" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Package className="w-4 h-4" /> ציוד
                  </button>
                  <button
                    onClick={() => setActiveTab("checklist")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "checklist" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ListChecks className="w-4 h-4" /> משימות
                  </button>
                </div>
                {activeTab === "packing" && <PackingView tripId={tripId} />}
                {activeTab === "checklist" && <ChecklistView tripId={tripId} />}
              </>
            )}
          </main>

          <nav
            className="absolute bottom-0 left-0 w-full bg-white/98 backdrop-blur-md border-t border-border shadow-[0_-1px_0_0_hsl(var(--border))] z-20"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-stretch px-1 pt-1.5 pb-1">
              {PRIMARY_TAB_IDS.map((id) => {
                const tab = ALL_TABS.find((t) => t.id === id)!;
                const isActive = activeTab === id || (id === "packing" && (activeTab === "packing" || activeTab === "checklist"));
                return (
                  <NavItem
                    key={id}
                    icon={tab.icon}
                    label={tab.label}
                    isActive={isActive}
                    onClick={() => setActiveTab(id === "packing" && activeTab === "checklist" ? "checklist" : id)}
                  />
                );
              })}
              <button
                onClick={() => setShowMenu(true)}
                aria-label="תפריט כל הסעיפים"
                className={`flex flex-col items-center gap-0.5 flex-1 min-w-0 py-1 rounded-2xl transition-all duration-200 ${
                  !PRIMARY_TAB_IDS.includes(activeTab) && activeTab !== "checklist"
                    ? "text-primary"
                    : "text-muted-foreground active:scale-95"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  !PRIMARY_TAB_IDS.includes(activeTab) && activeTab !== "checklist"
                    ? "bg-primary/12 text-primary shadow-sm"
                    : ""
                }`}>
                  <Grid3X3 className="w-[20px] h-[20px]" />
                </div>
                <span className="text-[10px] font-semibold leading-none">עוד</span>
              </button>
            </div>
          </nav>

          <Sheet open={showMenu} onOpenChange={setShowMenu}>
            <SheetContent side="bottom" className="rounded-t-[2rem] px-0 pb-0 border-0" dir="rtl">
              <SheetTitle className="sr-only">כל הסעיפים</SheetTitle>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
              </div>
              <p className="text-center text-sm font-bold text-foreground pb-3 border-b border-border/50 mx-6">כל הסעיפים</p>
              <div className="grid grid-cols-3 gap-3 px-5 py-4" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
                {ALL_TABS.map((tab) => {
                  const isActive = activeTab === tab.id || (tab.id === "packing" && (activeTab === "packing" || activeTab === "checklist"));
                  return (
                    <button
                      key={tab.id}
                      aria-label={tab.label}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        setActiveTab(tab.id === "packing" && activeTab === "checklist" ? "checklist" : tab.id);
                        setShowMenu(false);
                      }}
                      className={`flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl transition-all active:scale-95 ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${isActive ? "bg-primary/15" : "bg-background"}`}>
                        {tab.icon}
                      </div>
                      <span className="text-fluid-xs font-semibold leading-none">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          {showSearch && (
            <SearchModal tripId={tripId} onClose={() => setShowSearch(false)} onNavigate={(tab) => { setActiveTab(tab); setShowSearch(false); }} />
          )}
        </div>
      </div>
    </AdminContext.Provider>
  );
}

function SearchModal({ tripId, onClose, onNavigate }: { tripId: string; onClose: () => void; onNavigate: (tab: string) => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const results = useQuery(
    api.search.tripSearch,
    debounced.length >= 2 ? { tripId: tripId as Id<"trips">, q: debounced } : "skip"
  );

  const hasResults = results && (
    results.days.length + results.attractions.length + results.restaurants.length + results.hotels.length + results.tips.length > 0
  );

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col" dir="rtl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חפש בטיול..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button onClick={() => setQ("")} className="p-0.5 rounded-full text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
        <button onClick={onClose} className="text-sm font-medium text-primary ml-2">ביטול</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {debounced.length >= 2 && !results && (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        )}
        {debounced.length >= 2 && results && !hasResults && (
          <p className="text-center text-muted-foreground text-sm py-10">לא נמצאו תוצאות עבור "{debounced}"</p>
        )}
        {debounced.length < 2 && (
          <p className="text-center text-muted-foreground text-sm py-10">הקלד לפחות 2 תווים לחיפוש</p>
        )}

        {results?.days && results.days.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide px-1">ימים</p>
            {results.days.map((d) => (
              <button key={d._id} onClick={() => onNavigate("itinerary")} className="w-full flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 text-right hover:bg-muted transition-colors">
                <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">יום {d.dayNumber} — {d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.date}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {results?.attractions && results.attractions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide px-1">אטרקציות</p>
            {results.attractions.map((a) => (
              <button key={a._id} onClick={() => onNavigate("itinerary")} className="w-full flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 text-right hover:bg-muted transition-colors">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">יום {a.dayNumber} — {a.dayTitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {results?.restaurants && results.restaurants.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide px-1">מסעדות</p>
            {results.restaurants.map((r) => (
              <button key={r._id} onClick={() => onNavigate("food")} className="w-full flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 text-right hover:bg-muted transition-colors">
                <UtensilsCrossed className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  {r.cuisine && <p className="text-xs text-muted-foreground">{r.cuisine}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        {results?.hotels && results.hotels.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide px-1">לינה</p>
            {results.hotels.map((h) => (
              <button key={h._id} onClick={() => onNavigate("hotels")} className="w-full flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 text-right hover:bg-muted transition-colors">
                <Hotel className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.dates}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {results?.tips && results.tips.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide px-1">טיפים</p>
            {results.tips.map((t) => (
              <button key={t._id} onClick={() => onNavigate("tips")} className="w-full flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 text-right hover:bg-muted transition-colors">
                <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-foreground text-right line-clamp-2">{t.text}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      data-testid={`nav-${label}`}
      className={`flex flex-col items-center gap-0.5 transition-all duration-200 ease-out flex-1 min-w-0 py-1.5 rounded-2xl ${isActive ? "text-primary" : "text-muted-foreground active:scale-95"}`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-primary/12 text-primary shadow-sm" : "text-muted-foreground"}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-semibold leading-none truncate w-full text-center px-0.5 ${isActive ? "text-primary" : "opacity-60"}`}>{label}</span>
    </button>
  );
}
