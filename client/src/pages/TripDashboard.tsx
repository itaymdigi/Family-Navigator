import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useLocation } from "wouter";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Plus, MapPin, Calendar as CalendarIcon, LogOut, Trash2, Users, Eye, EyeOff, ShieldCheck, UserRound, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function TripDashboard() {
  const [, navigate] = useLocation();
  const currentUser = useQuery(api.users.me);
  const trips = useQuery(api.trips.list);
  const createTrip = useMutation(api.trips.create);
  const deleteTrip = useMutation(api.trips.remove);
  const createUser = useAction(api.admin.createUser);
  const deleteUser = useMutation(api.admin.deleteUser);
  const [showNew, setShowNew] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Id<"trips"> | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Id<"users"> | null>(null);
  const [showNewUser, setShowNewUser] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", displayName: "", password: "", role: "viewer" as "admin" | "viewer" });
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    coverEmoji: "✈️",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);

  const isAdmin = (currentUser as any)?.role === "admin";
  const allUsers = useQuery(api.admin.listUsers, isAdmin ? {} : "skip");
  const { signOut } = useAuthActions();

  // Date helpers
  const parseDate = (s: string) => (s ? new Date(s + "T00:00:00") : undefined);
  const toDateStr = (d: Date) => d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Destination flag detection
  const DEST_FLAGS: Array<[string[], string]> = [
    [["ישראל", "israel", "tel aviv", "תל אביב", "jerusalem", "ירושלים"], "🇮🇱"],
    [["czech", "צ'כיה", "צכיה", "prague", "פראג", "brno", "ברנו"], "🇨🇿"],
    [["france", "צרפת", "paris", "פריז"], "🇫🇷"],
    [["italy", "איטליה", "rome", "רומא", "milan", "מילאן", "venice", "ונציה"], "🇮🇹"],
    [["spain", "ספרד", "barcelona", "ברצלונה", "madrid", "מדריד"], "🇪🇸"],
    [["germany", "גרמניה", "berlin", "ברלין", "munich", "מינכן"], "🇩🇪"],
    [["uk", "england", "britain", "אנגליה", "london", "לונדון", "scotland", "סקוטלנד"], "🇬🇧"],
    [["usa", "america", 'ארה"ב', "new york", "ניו יורק", "los angeles", "florida"], "🇺🇸"],
    [["greece", "יוון", "athens", "אתונה", "santorini", "סנטוריני"], "🇬🇷"],
    [["turkey", "טורקיה", "istanbul", "איסטנבול", "antalya", "אנטליה"], "🇹🇷"],
    [["portugal", "פורטוגל", "lisbon", "ליסבון", "porto", "פורטו"], "🇵🇹"],
    [["netherlands", "holland", "הולנד", "amsterdam", "אמסטרדם"], "🇳🇱"],
    [["austria", "אוסטריה", "vienna", "וינה"], "🇦🇹"],
    [["switzerland", "שוויץ", "zurich", "ציריך", "bern", "ברן"], "🇨🇭"],
    [["poland", "פולין", "warsaw", "ורשה", "krakow", "קרקוב"], "🇵🇱"],
    [["hungary", "הונגריה", "budapest", "בודפשט"], "🇭🇺"],
    [["croatia", "קרואטיה", "zagreb", "זגרב", "dubrovnik", "דוברובניק"], "🇭🇷"],
    [["slovakia", "סלובקיה", "bratislava", "ברטיסלבה"], "🇸🇰"],
    [["japan", "יפן", "tokyo", "טוקיו", "kyoto", "קיוטו"], "🇯🇵"],
    [["thailand", "תאילנד", "bangkok", "בנגקוק"], "🇹🇭"],
    [["jordan", "ירדן", "petra", "פטרה", "aqaba", "עקבה"], "🇯🇴"],
    [["egypt", "מצרים", "cairo", "קהיר", "sharm", "שארם"], "🇪🇬"],
    [["morocco", "מרוקו", "marrakech", "מרקש", "casablanca", "קזבלנקה"], "🇲🇦"],
    [["dubai", "דובאי", "uae", "אמירויות", "abu dhabi"], "🇦🇪"],
    [["canada", "קנדה", "toronto", "טורונטו", "vancouver", "ונקובר"], "🇨🇦"],
    [["australia", "אוסטרליה", "sydney", "סידני", "melbourne", "מלבורן"], "🇦🇺"],
    [["sweden", "שוודיה", "stockholm", "סטוקהולם"], "🇸🇪"],
    [["norway", "נורווגיה", "oslo", "אוסלו"], "🇳🇴"],
    [["denmark", "דנמרק", "copenhagen", "קופנהגן"], "🇩🇰"],
    [["romania", "רומניה", "bucharest", "בוקרשט"], "🇷🇴"],
    [["bulgaria", "בולגריה", "sofia", "סופיה"], "🇧🇬"],
  ];
  const getDestFlag = (dest: string) => {
    if (!dest.trim()) return "";
    const lower = dest.toLowerCase();
    for (const [keys, flag] of DEST_FLAGS) {
      if (keys.some((k) => lower.includes(k))) return flag;
    }
    return "";
  };
  const destFlag = getDestFlag(form.destination);

  const handleCreate = async () => {
    if (!form.name || !form.destination) return;
    setSaving(true);
    try {
      await createTrip({
        name: form.name,
        destination: form.destination,
        startDate: form.startDate || new Date().toISOString().split("T")[0],
        endDate: form.endDate || new Date().toISOString().split("T")[0],
        coverEmoji: form.coverEmoji || undefined,
        description: form.description || undefined,
      });
      setShowNew(false);
      setForm({ name: "", destination: "", startDate: "", endDate: "", coverEmoji: "✈️", description: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.displayName || !userForm.password) return;
    setUserSaving(true);
    setUserError(null);
    try {
      await createUser(userForm);
      setShowNewUser(false);
      setUserForm({ username: "", displayName: "", password: "", role: "viewer" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setUserError(msg.includes("already") || msg.includes("exists") ? "שם המשתמש כבר קיים במערכת" : msg);
    } finally {
      setUserSaving(false);
    }
  };

  // ── Skeleton loading ─────────────────────────────────────────────────
  if (trips === undefined) {
    return (
      <div dir="rtl" className="h-dvh bg-background flex flex-col">
        {/* Header skeleton */}
        <div className="bg-background border-b border-border px-4 flex items-center justify-between gap-3 flex-shrink-0" style={{ paddingTop: "calc(0.875rem + env(safe-area-inset-top))", paddingBottom: "0.875rem" }}>
          <div className="space-y-1.5">
            <div className="h-5 w-28 rounded-lg bg-muted animate-pulse" />
            <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        </div>
        {/* Card skeletons */}
        <div className="flex-1 overflow-hidden p-4 space-y-3">
          <div className="h-3.5 w-16 rounded bg-muted animate-pulse mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] rounded-2xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Trip card + section helpers ───────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const active   = trips.filter((t) => t.startDate <= today && t.endDate >= today);
  const upcoming = trips.filter((t) => t.startDate > today);
  const past     = trips.filter((t) => t.endDate < today);

  const fmtDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${day}.${m}`;
  };

  const TripCard = ({ trip, dim }: { trip: typeof trips[0]; dim?: boolean }) => {
    const isActive = trip.startDate <= today && trip.endDate >= today;
    return (
      <div
        onClick={() => navigate(`/trips/${trip._id}`)}
        className={`card-pressable w-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden ${dim ? "opacity-40 grayscale saturate-0" : ""}`}
        data-testid={`trip-card-${trip._id}`}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Status stripe */}
          {isActive && <div className="absolute right-0 top-0 h-full w-1 bg-green-400 rounded-r-2xl" aria-hidden />}
          {/* Emoji badge */}
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0 select-none">
            {trip.coverEmoji || "✈️"}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground text-fluid-base text-balance leading-tight truncate">{trip.name}</h2>
            <div className="flex items-center gap-1 text-muted-foreground mt-0.5" style={{ fontSize: "clamp(0.625rem, 2vw, 0.75rem)" }}>
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </div>
            {(trip.startDate || trip.endDate) && (
              <div className="flex items-center gap-1 text-muted-foreground mt-0.5 tabular-nums" style={{ fontSize: "clamp(0.625rem, 2vw, 0.75rem)" }}>
                <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                <span>
                  {trip.startDate && trip.endDate
                    ? `${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}`
                    : trip.startDate || trip.endDate}
                </span>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); setTripToDelete(trip._id); }}
                className="size-8 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="מחק טיול"
                data-testid={`button-delete-trip-${trip._id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronLeft className="w-4 h-4 text-muted-foreground/40" aria-hidden />
          </div>
        </div>
        {trip.description && (
          <p className="px-4 pb-3 -mt-1 text-muted-foreground line-clamp-1 text-pretty" style={{ fontSize: "clamp(0.625rem, 2vw, 0.75rem)" }}>{trip.description}</p>
        )}
      </div>
    );
  };

  const Section = ({ label, badge, badgeClass, items, dim }: { label: string; badge: string; badgeClass: string; items: typeof trips; dim?: boolean }) =>
    items.length === 0 ? null : (
      <div className="space-y-2.5">
        <div className="section-label px-1">
          <span className={`text-fluid-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>{badge}</span>
          <span className="text-fluid-xs font-semibold text-muted-foreground">{label}</span>
        </div>
        {items.map((trip) => <TripCard key={trip._id} trip={trip} dim={dim} />)}
      </div>
    );

  return (
    <div dir="rtl" className="h-dvh bg-muted/30 flex flex-col">
      {/* ── App Bar ──────────────────────────────────────────────────────── */}
      <header
        className="bg-background border-b border-border flex items-center justify-between gap-3 px-4 flex-shrink-0 z-10"
        style={{ paddingTop: "calc(0.875rem + env(safe-area-inset-top))", paddingBottom: "0.875rem" }}
      >
        <div>
          <h1 className="text-fluid-xl font-bold text-foreground text-balance leading-tight">הטיולים שלנו</h1>
          <p className="text-fluid-xs text-muted-foreground">Family Navigator</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowUsers(true)}
                className="size-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                aria-label="ניהול משתמשים"
                data-testid="button-manage-users"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNew(true)}
                className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                data-testid="button-new-trip"
              >
                <Plus className="w-4 h-4" />
                <span>טיול חדש</span>
              </button>
            </>
          )}
          <button
            onClick={() => void signOut()}
            className="size-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="התנתק"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <main className="app-scroll px-4 py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <div className="max-w-md mx-auto">
          {trips.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground space-y-3">
              <div className="text-6xl">🗺️</div>
              <p className="font-semibold text-fluid-lg text-balance">אין טיולים עדיין</p>
              {isAdmin && (
                <button
                  onClick={() => setShowNew(true)}
                  className="mx-auto h-10 px-5 flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  צור טיול ראשון
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <Section label="מתרחש עכשיו" badge="פעיל" badgeClass="bg-green-100 text-green-700" items={active} />
              <Section label="קרוב" badge="עתידי" badgeClass="bg-blue-100 text-blue-700" items={upcoming} />
              <Section label="הסתיים" badge="עבר" badgeClass="bg-muted text-muted-foreground" items={past} dim />
            </div>
          )}
        </div>
      </main>

      {/* User Management Dialog */}
      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="max-w-[92vw] rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>ניהול משתמשים</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {allUsers?.map((u: { _id: Id<"users">; displayName?: string; name?: string; email?: string; role?: "admin" | "viewer" }) => (
              <div key={u._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-full ${u.role === "admin" ? "bg-indigo-100" : "bg-gray-200"}`}>
                    {u.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> : <UserRound className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{u.displayName ?? u.name ?? "—"}</p>
                    <p className="text-[11px] text-gray-400">{u.email?.replace("@family.nav", "") ?? "—"} · {u.role === "admin" ? "מנהל" : "צופה"}</p>
                  </div>
                </div>
                {u._id !== (currentUser as { _id?: string } | null)?._id && (
                  <button
                    onClick={() => setUserToDelete(u._id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            onClick={() => setShowNewUser(true)}
            className="w-full rounded-xl gap-2 mt-1"
          >
            <Plus className="w-4 h-4" />
            הוסף משתמש
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showNewUser} onOpenChange={(open) => { if (!open) { setShowNewUser(false); setUserError(null); } }}>
        <DialogContent className="max-w-[92vw] rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף משתמש חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label>שם משתמש</Label>
              <Input
                placeholder="לדוגמה: sarah"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                autoCapitalize="none"
                autoCorrect="off"
              />
              <p className="text-[11px] text-gray-400">יתווסף אוטומטית @family.nav אם אין @</p>
            </div>
            <div className="space-y-1.5">
              <Label>שם תצוגה</Label>
              <Input
                placeholder="לדוגמה: שרה"
                value={userForm.displayName}
                onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label>סיסמה</Label>
                {userForm.password.length > 0 && (
                  <span className={`text-[11px] font-medium ${userForm.password.length >= 8 ? "text-green-600" : "text-red-500"}`}>
                    {userForm.password.length}/8 תווים{userForm.password.length >= 8 ? " ✓" : ""}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showUserPassword ? "text" : "password"}
                  placeholder="לפחות 8 תווים"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className={`pl-10 ${userForm.password.length > 0 && userForm.password.length < 8 ? "border-red-300 focus-visible:ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowUserPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>הרשאה</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as "admin" | "viewer" })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">צופה</SelectItem>
                  <SelectItem value="admin">מנהל</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {userError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{userError}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 h-10 rounded-xl"
                onClick={handleCreateUser}
                disabled={!userForm.username || !userForm.displayName || userForm.password.length < 8 || userSaving}
              >
                {userSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור משתמש"}
              </Button>
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => { setShowNewUser(false); setUserError(null); }}>
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => { if (!open) setUserToDelete(null); }}>
        <DialogContent className="max-w-[80vw] rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>מחיקת משתמש</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">האם אתה בטוח? המשתמש לא יוכל להתחבר לאחר המחיקה.</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1 h-10 rounded-xl"
              onClick={async () => {
                if (userToDelete) {
                  await deleteUser({ userId: userToDelete });
                  setUserToDelete(null);
                }
              }}
            >
              כן, מחק
            </Button>
            <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setUserToDelete(null)}>
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tripToDelete} onOpenChange={(open) => { if (!open) setTripToDelete(null); }}>
        <DialogContent className="max-w-[80vw] rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>מחיקת טיול</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">האם אתה בטוח שברצונך למחוק את הטיול? פעולה זו אינה ניתנת לביטול.</p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="destructive"
              className="flex-1 h-10 rounded-xl"
              onClick={async () => {
                if (tripToDelete) {
                  await deleteTrip({ id: tripToDelete });
                  setTripToDelete(null);
                }
              }}
            >
              כן, מחק
            </Button>
            <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setTripToDelete(null)}>
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>טיול חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>שם הטיול</Label>
              <Input
                placeholder="לדוגמה: טיול לצ'כיה 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-trip-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>יעד</Label>
              <div className="relative">
                <Input
                  placeholder="לדוגמה: צפון צ'כיה"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  data-testid="input-trip-destination"
                  className={destFlag ? "pl-10" : ""}
                />
                {destFlag && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                    {destFlag}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>תאריך התחלה</Label>
                <Popover open={showStartCal} onOpenChange={setShowStartCal}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal h-10 rounded-lg"
                      data-testid="input-trip-start"
                    >
                      <span className={form.startDate ? "text-gray-900" : "text-gray-400"}>
                        {form.startDate ? toDateStr(parseDate(form.startDate)!) : "בחר תאריך"}
                      </span>
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDate(form.startDate)}
                      onSelect={(d) => { if (d) { setForm({ ...form, startDate: d.toISOString().split("T")[0] }); setShowStartCal(false); } }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>תאריך סיום</Label>
                <Popover open={showEndCal} onOpenChange={setShowEndCal}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal h-10 rounded-lg"
                      data-testid="input-trip-end"
                    >
                      <span className={form.endDate ? "text-gray-900" : "text-gray-400"}>
                        {form.endDate ? toDateStr(parseDate(form.endDate)!) : "בחר תאריך"}
                      </span>
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDate(form.endDate)}
                      onSelect={(d) => { if (d) { setForm({ ...form, endDate: d.toISOString().split("T")[0] }); setShowEndCal(false); } }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>אימוג'י</Label>
              <Input
                placeholder="✈️"
                value={form.coverEmoji}
                onChange={(e) => setForm({ ...form, coverEmoji: e.target.value })}
                className="w-20 text-center text-2xl"
                data-testid="input-trip-emoji"
              />
            </div>
            <div className="space-y-1.5">
              <Label>תיאור (אופציונלי)</Label>
              <Textarea
                placeholder="תיאור קצר של הטיול..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                data-testid="input-trip-description"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 h-10 rounded-xl"
                onClick={handleCreate}
                disabled={!form.name || !form.destination || saving}
                data-testid="button-save-trip"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור טיול"}
              </Button>
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => setShowNew(false)}>
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
