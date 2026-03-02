import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useLocation } from "wouter";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Loader2, Plus, MapPin, Calendar, LogOut, Trash2, Users, Eye, EyeOff, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const isAdmin = (currentUser as any)?.role === "admin";
  const allUsers = useQuery(api.admin.listUsers, isAdmin ? {} : "skip");
  const { signOut } = useAuthActions();

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

  if (trips === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))", paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">הטיולים שלנו</h1>
            <p className="text-gray-500 text-sm mt-1">Family Navigator</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  onClick={() => setShowUsers(true)}
                  variant="outline"
                  className="rounded-xl shadow-sm gap-2"
                  data-testid="button-manage-users"
                >
                  <Users className="w-4 h-4" />
                  משתמשים
                </Button>
                <Button
                  onClick={() => setShowNew(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 gap-2"
                  data-testid="button-new-trip"
                >
                  <Plus className="w-4 h-4" />
                  טיול חדש
                </Button>
              </>
            )}
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl bg-white shadow-sm text-gray-400 hover:text-red-500 hover:shadow-md transition-all"
              title="התנתק"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="font-semibold text-lg">אין טיולים עדיין</p>
            {isAdmin && (
              <p className="text-sm mt-2">לחצו על "טיול חדש" כדי להתחיל</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div
                key={trip._id}
                onClick={() => navigate(`/trips/${trip._id}`)}
                className="w-full text-right bg-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] overflow-hidden cursor-pointer"
                data-testid={`trip-card-${trip._id}`}
              >
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-5 text-white relative">
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setTripToDelete(trip._id); }}
                      className="absolute top-3 left-3 p-1.5 rounded-lg bg-white/15 hover:bg-red-500/70 transition-colors"
                      title="מחק טיול"
                      data-testid={`button-delete-trip-${trip._id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{trip.coverEmoji || "✈️"}</span>
                    <div>
                      <h2 className="text-lg font-bold">{trip.name}</h2>
                      <div className="flex items-center gap-1.5 text-white/80 text-xs mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{trip.destination}</span>
                      </div>
                    </div>
                  </div>
                  {(trip.startDate || trip.endDate) && (
                    <div className="flex items-center gap-1.5 text-white/70 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {trip.startDate && trip.endDate
                          ? `${trip.startDate} – ${trip.endDate}`
                          : trip.startDate || trip.endDate}
                      </span>
                    </div>
                  )}
                </div>
                {trip.description && (
                  <div className="px-6 py-3">
                    <p className="text-sm text-gray-600 text-right">{trip.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white gap-2 mt-1"
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
              <Label>סיסמה</Label>
              <div className="relative">
                <Input
                  type={showUserPassword ? "text" : "password"}
                  placeholder="לפחות 8 תווים"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="pl-10"
                  minLength={8}
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
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
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
              <Input
                placeholder="לדוגמה: צפון צ'כיה"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                data-testid="input-trip-destination"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>תאריך התחלה</Label>
                <Input
                  type="text"
                  placeholder="25.3.2026"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  data-testid="input-trip-start"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>תאריך סיום</Label>
                <Input
                  type="text"
                  placeholder="4.4.2026"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  data-testid="input-trip-end"
                />
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
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
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
