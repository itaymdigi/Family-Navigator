import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useLocation } from "wouter";
import { api } from "../../../convex/_generated/api";
import { Loader2, Plus, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TripDashboard() {
  const [, navigate] = useLocation();
  const currentUser = useQuery(api.users.me);
  const trips = useQuery(api.trips.list);
  const createTrip = useMutation(api.trips.create);
  const [showNew, setShowNew] = useState(false);
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

  if (trips === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8 pt-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">הטיולים שלנו</h1>
            <p className="text-gray-500 text-sm mt-1">Family Navigator</p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowNew(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 gap-2"
              data-testid="button-new-trip"
            >
              <Plus className="w-4 h-4" />
              טיול חדש
            </Button>
          )}
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
              <button
                key={trip._id}
                onClick={() => navigate(`/trips/${trip._id}`)}
                className="w-full text-right bg-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] overflow-hidden"
                data-testid={`trip-card-${trip._id}`}
              >
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-5 text-white">
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
              </button>
            ))}
          </div>
        )}
      </div>

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
