import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { Users, Camera, Trash2, Loader2, Plus, X, Upload, Link, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useAdmin } from "@/lib/trip-context";

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
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: m.color }}>{m.avatar || m.name[0]}</div>
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
        <Button className="w-full rounded-xl bg-primary h-9 text-sm" onClick={async () => { if (!name) return; setSaving(true); try { await addMember({ tripId: tripId as Id<"trips">, name, avatar: avatar || undefined, color }); setName(""); setAvatar(""); } finally { setSaving(false); } }} disabled={!name || saving} data-testid="button-add-member">
          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />} הוסף בן משפחה
        </Button>
      </div>
    </div>
  );
}

export function PhotosView({ tripId }: { tripId: string }) {
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
  const filteredPhotos = displayPhotos.filter(p => filterCategory === "הכל" || p.category === filterCategory);

  const resetForm = () => { setNewPhoto({ url: "", caption: "", uploadedBy: null, category: "general" }); setSelectedFile(null); setFilePreview(null); };

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
      setShowAdd(false); resetForm(); return;
    }
    if (!selectedFile || !newPhoto.caption) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, { method: "POST", body: selectedFile, headers: { "Content-Type": selectedFile.type } });
      const { storageId } = await result.json();
      await createPhoto({ tripId: tripId as Id<"trips">, storageId, caption: newPhoto.caption, category: newPhoto.category });
      setShowAdd(false); resetForm();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  if (photos === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;

  const getMemberName = (id: string | null) => id ? displayMembers.find((m) => m._id === id) : null;
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
          <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-secondary hover:text-secondary hover:bg-secondary/10 rounded-full h-9 w-9" data-testid="button-add-photo">
                <Camera className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] rounded-2xl" dir="rtl">
              <DialogHeader><DialogTitle>הוספת תמונה</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <button onClick={() => setUploadMode("file")} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${uploadMode === "file" ? "bg-secondary text-white" : "bg-muted text-muted-foreground"}`} data-testid="button-mode-file"><Upload className="w-3.5 h-3.5" /> מהמכשיר</button>
                  <button onClick={() => setUploadMode("url")} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${uploadMode === "url" ? "bg-secondary text-white" : "bg-muted text-muted-foreground"}`} data-testid="button-mode-url"><Link className="w-3.5 h-3.5" /> קישור URL</button>
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
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar mb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${filterCategory === cat ? "bg-primary text-white shadow-sm scale-105" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{cat}</button>
        ))}
      </div>

      {displayMembers.length > 0 && (
        <div className="flex gap-2 px-1 overflow-x-auto pb-1 mb-2">
          {displayMembers.map((m) => (
            <div key={m._id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: m.color }} data-testid={`member-avatar-${m._id}`}>{m.avatar || m.name[0]}</div>
              <span className="text-[10px] text-muted-foreground font-medium">{m.name}</span>
            </div>
          ))}
        </div>
      )}

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-40" /><p className="font-medium">אין תמונות בקטגוריה זו</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredPhotos.map((photo, i) => {
            const member = getMemberName(photo.uploadedBy ?? null);
            return (
              <div key={photo._id} className={`rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer bg-muted ${i % 5 === 0 ? "col-span-2 aspect-video" : "aspect-square"}`} data-testid={`photo-${photo._id}`} onClick={() => setSelectedPhoto(photo)}>
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                {member && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ backgroundColor: member.color }}>{member.avatar || member.name[0]}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 transition-opacity duration-300 flex items-end justify-between p-3">
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
          <DialogTitle className="sr-only">{selectedPhoto?.caption ?? "תצוגת תמונה"}</DialogTitle>
          {selectedPhoto && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="max-w-full max-h-[85vh] object-contain" />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white text-right">
                <p className="font-bold text-xl mb-1">{selectedPhoto.caption}</p>
                <div className="flex items-center gap-2 opacity-80 text-sm">
                  {getMemberName(selectedPhoto.uploadedBy ?? null) && <span>הועלה על ידי: {getMemberName(selectedPhoto.uploadedBy ?? null)?.name}</span>}
                  <span>•</span>
                  <span>{selectedPhoto.category === "general" ? "כללי" : selectedPhoto.category}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPhoto(null)} className="absolute top-10 right-6 text-white/80 hover:text-white bg-white/10 backdrop-blur-md rounded-full p-2.5 z-50 transition-all hover:bg-white/20"><X className="w-6 h-6" /></button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
