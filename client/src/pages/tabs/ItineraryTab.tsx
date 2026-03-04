import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import {
  Star, ChevronDown, ChevronUp, Trash2, Loader2, Plus, Pencil,
  Map, X, Check, Navigation, ExternalLink, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useAdmin, useWithCache } from "@/lib/trip-context";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function getClothingAdvice(weatherTemp: string, weatherIcon: string): string[] {
  const match = weatherTemp.match(/(\d+)–(\d+)/);
  const avg = match ? (parseInt(match[1]) + parseInt(match[2])) / 2 : 10;
  const items: string[] = [];
  if (avg < 5) items.push("🧥 מעיל חורפי כבד", "🧤 כובע וכפפות", "👢 מגפיים");
  else if (avg < 12) items.push("🧥 מעיל + שכבות", "🧣 צעיף", "👟 נעלי הליכה");
  else if (avg < 18) items.push("🫧 ג'קט קל", "👖 מכנסיים ארוכים", "👟 נעלי הליכה");
  else items.push("👕 חולצה קלה", "🩳 מכנסיים קצרים", "👟 נעלי ספורט");
  if (/🌧|🌨|🌦|⛈/.test(weatherIcon)) items.push("☂️ מטרייה / מעיל גשם");
  return items;
}

function AttractionCard({ attraction, onDelete, onEdit }: { attraction: Doc<"attractions">; dayId: Id<"tripDays">; onDelete: () => void; onEdit: () => void }) {
  const { isAdmin } = useAdmin();
  return (
    <div className="bg-muted/40 rounded-xl p-3 space-y-2.5 group relative" data-testid={`attraction-${attraction._id}`}>
      {isAdmin && (
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          <button onClick={onEdit} className="text-blue-400 hover:text-blue-600 p-1.5 bg-white/80 rounded-lg" data-testid={`button-edit-attr-${attraction._id}`}>
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-1.5 bg-white/80 rounded-lg" data-testid={`button-delete-attr-${attraction._id}`}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
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
    } finally { setSaving(false); }
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

function DayCard({ day, tripId }: { day: Doc<"tripDays">; tripId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { isAdmin, isOnline } = useAdmin();
  const eventsLive = useQuery(api.dayEvents.listByDay, expanded ? { dayId: day._id } : "skip");
  const attractionsLive = useQuery(api.attractions.listByDay, expanded ? { dayId: day._id } : "skip");
  const events = useWithCache(eventsLive, `fnav-events-${day._id}`);
  const dayAttractions = useWithCache(attractionsLive, `fnav-attr-${day._id}`);

  const updateDay = useMutation(api.tripDays.update);
  const deleteDay = useMutation(api.tripDays.remove);
  const deleteEvent = useMutation(api.dayEvents.remove);
  const updateEvent = useMutation(api.dayEvents.update);
  const deleteAttr = useMutation(api.attractions.remove);
  const updateAttr = useMutation(api.attractions.update);
  const fetchWeather = useAction(api.weather.fetchForDay);

  const [weatherLoading, setWeatherLoading] = useState(false);
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [editDayTitle, setEditDayTitle] = useState(day.title);
  const [editDaySubtitle, setEditDaySubtitle] = useState(day.subtitle ?? "");
  const [editDayDate, setEditDayDate] = useState(day.date);
  const [editDayNotes, setEditDayNotes] = useState((day.notes ?? []).join("\n"));
  const [savingDay, setSavingDay] = useState(false);

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventTime, setEditEventTime] = useState("");
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDesc, setEditEventDesc] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [editAttrName, setEditAttrName] = useState("");
  const [editAttrDesc, setEditAttrDesc] = useState("");
  const [editAttrDuration, setEditAttrDuration] = useState("");
  const [editAttrPrice, setEditAttrPrice] = useState("");
  const [editAttrMaps, setEditAttrMaps] = useState("");
  const [editAttrWaze, setEditAttrWaze] = useState("");
  const [editAttrBadges, setEditAttrBadges] = useState("");
  const [savingAttr, setSavingAttr] = useState(false);

  const displayEvents = events ?? [];
  const displayAttractions = dayAttractions ?? [];

  const handleRefreshWeather = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setWeatherLoading(true);
    try { await fetchWeather({ tripId: tripId as Id<"trips">, dayId: day._id }); }
    finally { setWeatherLoading(false); }
  };

  const handleSaveDay = async () => {
    if (!isOnline) { alert("לא ניתן לשמור במצב לא מקוון"); return; }
    setSavingDay(true);
    try {
      await updateDay({ id: day._id, title: editDayTitle, subtitle: editDaySubtitle || undefined, date: editDayDate, notes: editDayNotes.split("\n").filter(Boolean) });
      setEditDayOpen(false);
    } finally { setSavingDay(false); }
  };

  const startEditEvent = (event: { _id: string; time: string; title: string; description?: string }) => {
    setEditingEventId(event._id);
    setEditEventTime(event.time);
    setEditEventTitle(event.title);
    setEditEventDesc(event.description ?? "");
  };

  const handleSaveEvent = async () => {
    if (!editingEventId) return;
    if (!isOnline) { alert("לא ניתן לשמור במצב לא מקוון"); return; }
    setSavingEvent(true);
    try {
      await updateEvent({ id: editingEventId as Id<"dayEvents">, time: editEventTime, title: editEventTitle, description: editEventDesc || undefined });
      setEditingEventId(null);
    } finally { setSavingEvent(false); }
  };

  const startEditAttr = (attr: Doc<"attractions">) => {
    setEditingAttrId(attr._id);
    setEditAttrName(attr.name);
    setEditAttrDesc(attr.description);
    setEditAttrDuration(attr.duration ?? "");
    setEditAttrPrice(attr.price ?? "");
    setEditAttrMaps(attr.mapsUrl ?? "");
    setEditAttrWaze(attr.wazeUrl ?? "");
    setEditAttrBadges((attr.badges ?? []).join(", "));
  };

  const handleSaveAttr = async () => {
    if (!editingAttrId) return;
    if (!isOnline) { alert("לא ניתן לשמור במצב לא מקוון"); return; }
    setSavingAttr(true);
    try {
      await updateAttr({ id: editingAttrId as Id<"attractions">, name: editAttrName, description: editAttrDesc, duration: editAttrDuration || undefined, price: editAttrPrice || undefined, mapsUrl: editAttrMaps || undefined, wazeUrl: editAttrWaze || undefined, badges: editAttrBadges ? editAttrBadges.split(",").map((b) => b.trim()).filter(Boolean) : undefined });
      setEditingAttrId(null);
    } finally { setSavingAttr(false); }
  };

  return (
    <>
      <Card className="border-none shadow-[0_2px_12px_rgb(0,0,0,0.05)] rounded-2xl bg-white overflow-hidden" data-testid={`day-card-${day.dayNumber}`}>
        <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)} onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)} className="w-full text-right cursor-pointer" data-testid={`button-expand-day-${day.dayNumber}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`size-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold ${day.dayNumber === 0 || day.dayNumber === 10 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
              <span className="text-fluid-2xs leading-none font-semibold">יום</span>
              <span className="text-fluid-lg leading-none">{day.dayNumber}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-fluid-xs text-muted-foreground font-medium text-pretty">{day.subtitle}</p>
              <h3 className="font-bold text-fluid-sm text-foreground truncate">{day.title}</h3>
              {day.rating && <RatingStars rating={day.rating} />}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {day.weatherIcon && (
                <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                  <span className="text-lg leading-none">{day.weatherIcon}</span>
                  <span className="text-[10px] font-bold text-foreground/60">{day.weatherTemp}</span>
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditDayTitle(day.title); setEditDaySubtitle(day.subtitle ?? ""); setEditDayDate(day.date); setEditDayNotes((day.notes ?? []).join("\n")); setEditDayOpen(true); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  data-testid={`button-edit-day-${day.dayNumber}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {day.mapsUrl && (
                <a href={day.mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors" data-testid={`button-day-maps-${day.dayNumber}`}>
                  <Map className="w-4 h-4" />
                </a>
              )}
              {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
          </CardContent>
        </div>
        {expanded && (
          <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {day.weatherIcon && (
              <div className="space-y-2" data-testid={`weather-${day.dayNumber}`}>
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                  <span className="text-2xl">{day.weatherIcon}</span>
                  <div className="flex-1">
                    <span className="font-bold text-sm text-blue-900">{day.weatherTemp}</span>
                    <span className="text-xs text-blue-700 mr-2"> · {day.weatherDesc}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getClothingAdvice(day.weatherTemp ?? "", day.weatherIcon ?? "").map((item, i) => (
                    <span key={i} className="bg-sky-50 text-sky-700 rounded-full px-2 py-0.5 text-[10px] font-medium">{item}</span>
                  ))}
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="flex gap-2 justify-end">
                <button onClick={handleRefreshWeather} disabled={weatherLoading} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors" data-testid={`button-weather-refresh-${day.dayNumber}`}>
                  {weatherLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "🌡️"} רענן מזג אוויר
                </button>
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
                    editingEventId === event._id ? (
                      <div key={event._id} className="bg-muted/30 rounded-xl p-3 space-y-2 animate-in fade-in duration-150" data-testid={`event-edit-${event._id}`}>
                        <div className="flex gap-2">
                          <Input value={editEventTime} onChange={(e) => setEditEventTime(e.target.value)} placeholder="שעה" className="w-20 h-8 text-xs" dir="ltr" />
                          <Input value={editEventTitle} onChange={(e) => setEditEventTitle(e.target.value)} placeholder="כותרת" className="flex-1 h-8 text-xs" />
                        </div>
                        <Input value={editEventDesc} onChange={(e) => setEditEventDesc(e.target.value)} placeholder="תיאור" className="h-8 text-xs" />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs rounded-lg bg-primary" onClick={handleSaveEvent} disabled={savingEvent}>
                            {savingEvent ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={() => setEditingEventId(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      <div key={event._id} className="flex gap-3 items-start relative group" data-testid={`event-${event._id}`}>
                        <div className="w-10 text-left flex-shrink-0"><span className="text-[11px] font-bold text-primary">{event.time}</span></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm mt-1 flex-shrink-0 z-10"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{event.title}</p>
                          {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button onClick={() => startEditEvent(event)} className="text-blue-400 hover:text-blue-600 p-1" data-testid={`button-edit-event-${event._id}`}><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => deleteEvent({ id: event._id })} className="text-red-400 hover:text-red-600 p-1" data-testid={`button-delete-event-${event._id}`}><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
            {isAdmin && <AddEventForm dayId={day._id} />}
            {displayAttractions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">אטרקציות</h4>
                {displayAttractions.map((attr) => (
                  <AttractionCard key={attr._id} attraction={attr} dayId={day._id} onDelete={() => deleteAttr({ id: attr._id })} onEdit={() => startEditAttr(attr)} />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Dialog open={editDayOpen} onOpenChange={setEditDayOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
          <DialogHeader><DialogTitle>עריכת יום {day.dayNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>כותרת</Label>
              <Input value={editDayTitle} onChange={(e) => setEditDayTitle(e.target.value)} data-testid="input-edit-day-title" />
            </div>
            <div className="space-y-1.5">
              <Label>תת-כותרת</Label>
              <Input value={editDaySubtitle} onChange={(e) => setEditDaySubtitle(e.target.value)} data-testid="input-edit-day-subtitle" />
            </div>
            <div className="space-y-1.5">
              <Label>תאריך</Label>
              <Input type="date" value={editDayDate} onChange={(e) => setEditDayDate(e.target.value)} dir="ltr" data-testid="input-edit-day-date" />
            </div>
            <div className="space-y-1.5">
              <Label>הערות (שורה לכל הערה)</Label>
              <Textarea value={editDayNotes} onChange={(e) => setEditDayNotes(e.target.value)} rows={4} data-testid="input-edit-day-notes" />
            </div>
            <Button className="w-full rounded-xl bg-primary h-10" onClick={handleSaveDay} disabled={savingDay || !editDayTitle} data-testid="button-save-edit-day">
              {savingDay ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />} שמור שינויים
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAttrId} onOpenChange={(o) => { if (!o) setEditingAttrId(null); }}>
        <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
          <DialogHeader><DialogTitle>עריכת אטרקציה</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5"><Label>שם</Label><Input value={editAttrName} onChange={(e) => setEditAttrName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>תיאור</Label><Input value={editAttrDesc} onChange={(e) => setEditAttrDesc(e.target.value)} /></div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5"><Label>משך</Label><Input value={editAttrDuration} onChange={(e) => setEditAttrDuration(e.target.value)} placeholder="2 שעות" /></div>
              <div className="flex-1 space-y-1.5"><Label>מחיר</Label><Input value={editAttrPrice} onChange={(e) => setEditAttrPrice(e.target.value)} placeholder="חינם" /></div>
            </div>
            <div className="space-y-1.5"><Label>Google Maps URL</Label><Input value={editAttrMaps} onChange={(e) => setEditAttrMaps(e.target.value)} dir="ltr" placeholder="https://maps.google.com/..." /></div>
            <div className="space-y-1.5"><Label>Waze URL</Label><Input value={editAttrWaze} onChange={(e) => setEditAttrWaze(e.target.value)} dir="ltr" placeholder="https://waze.com/..." /></div>
            <div className="space-y-1.5"><Label>תגיות (מופרדות בפסיק)</Label><Input value={editAttrBadges} onChange={(e) => setEditAttrBadges(e.target.value)} placeholder="מומלץ, חינמי, ילדים" /></div>
            <Button className="w-full rounded-xl bg-primary h-10" onClick={handleSaveAttr} disabled={savingAttr || !editAttrName} data-testid="button-save-edit-attr">
              {savingAttr ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />} שמור שינויים
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ItineraryView({ tripId }: { tripId: string }) {
  const daysLive = useQuery(api.tripDays.list, { tripId: tripId as Id<"trips"> });
  const days = useWithCache(daysLive, `fnav-days-${tripId}`);
  if (days === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight px-1">📅 מסלול יום-יומי</h2>
      {days.map((day) => <DayCard key={day._id} day={day} tripId={tripId} />)}
    </div>
  );
}
