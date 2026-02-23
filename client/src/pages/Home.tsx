import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Map, MapPin, Image as ImageIcon, Calculator, Plus, ArrowRightLeft, Camera, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Place, Photo, CurrencyRate } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("places");

  return (
    <div className="min-h-screen bg-muted/50 flex justify-center selection:bg-primary/20">
      <div className="w-full max-w-md bg-background shadow-2xl min-h-screen relative flex flex-col pb-20 overflow-hidden sm:border-x sm:border-border">
        <header className="pt-12 pb-6 px-6 bg-primary text-primary-foreground rounded-b-[2rem] shadow-sm z-10 relative">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1 tracking-tight" data-testid="text-trip-title">Euro Trip 2026</h1>
              <p className="text-primary-foreground/90 text-sm font-medium">3 Days remaining</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-primary-foreground/30 overflow-hidden shadow-inner bg-white/20 flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <Card className="bg-white/15 backdrop-blur-md border-white/20 text-white shadow-none rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-white/25 p-3 rounded-xl shadow-sm">
                <MapPin className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs text-white/90 font-semibold tracking-wide uppercase">Next Stop</p>
                <p className="font-bold text-xl tracking-tight">Paris, France</p>
              </div>
            </CardContent>
          </Card>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 z-0">
          {activeTab === "places" && <PlacesView />}
          {activeTab === "photos" && <PhotosView />}
          {activeTab === "currency" && <CurrencyView />}
        </main>

        <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-border px-6 py-4 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
          <NavItem icon={<Map className="w-[26px] h-[26px]" />} label="Places" isActive={activeTab === "places"} onClick={() => setActiveTab("places")} />
          <NavItem icon={<ImageIcon className="w-[26px] h-[26px]" />} label="Photos" isActive={activeTab === "photos"} onClick={() => setActiveTab("photos")} />
          <NavItem icon={<Calculator className="w-[26px] h-[26px]" />} label="Currency" isActive={activeTab === "currency"} onClick={() => setActiveTab("currency")} />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase()}`}
      className={`flex flex-col items-center gap-1.5 transition-all duration-300 ease-out flex-1 ${isActive ? 'text-primary scale-105' : 'text-muted-foreground hover:text-foreground'}`}
    >
      <div className={`${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'} p-2.5 rounded-2xl transition-colors duration-300`}>
        {icon}
      </div>
      <span className={`text-[11px] font-semibold ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
    </button>
  );
}

function PlacesView() {
  const { data: places = [], isLoading } = useQuery<Place[]>({ queryKey: ["/api/places"] });
  const [showAdd, setShowAdd] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: "", location: "", type: "Attraction", image: "" });

  const addMutation = useMutation({
    mutationFn: (place: typeof newPlace) => apiRequest("POST", "/api/places", place),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setShowAdd(false);
      setNewPlace({ name: "", location: "", type: "Attraction", image: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/places/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/places"] }),
  });

  const openInMaps = (place: Place) => {
    const query = place.lat && place.lng
      ? `${place.lat},${place.lng}`
      : encodeURIComponent(`${place.name}, ${place.location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Saved Places</h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-10 w-10 transition-colors" data-testid="button-add-place">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Place</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Eiffel Tower" value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} data-testid="input-place-name" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. Paris, France" value={newPlace.location} onChange={(e) => setNewPlace({ ...newPlace, location: e.target.value })} data-testid="input-place-location" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newPlace.type} onValueChange={(v) => setNewPlace({ ...newPlace, type: v })}>
                  <SelectTrigger data-testid="select-place-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Attraction">Attraction</SelectItem>
                    <SelectItem value="Historical">Historical</SelectItem>
                    <SelectItem value="Scenic">Scenic</SelectItem>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Hotel">Hotel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input placeholder="https://..." value={newPlace.image} onChange={(e) => setNewPlace({ ...newPlace, image: e.target.value })} data-testid="input-place-image" />
              </div>
              <Button className="w-full rounded-xl bg-primary" onClick={() => addMutation.mutate(newPlace)} disabled={!newPlace.name || !newPlace.location || !newPlace.image || addMutation.isPending} data-testid="button-save-place">
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Place
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {places.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No places saved yet</p>
          <p className="text-sm mt-1">Tap + to add your first destination</p>
        </div>
      ) : (
        <div className="space-y-5 pb-8">
          {places.map((place) => (
            <Card key={place.id} className="overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group cursor-pointer rounded-[1.25rem] bg-white" data-testid={`place-card-${place.id}`}>
              <div className="h-44 overflow-hidden relative">
                <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-bold tracking-wide uppercase rounded-full text-foreground shadow-sm">
                  {place.type}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(place.id); }}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
                  data-testid={`button-delete-place-${place.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight" data-testid={`text-place-name-${place.id}`}>{place.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5" /> {place.location}
                  </p>
                </div>
                <Button size="sm" className="rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold shadow-sm px-4 gap-1.5" onClick={() => openInMaps(place)} data-testid={`button-navigate-${place.id}`}>
                  <ExternalLink className="w-3.5 h-3.5" /> Navigate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Trip Gallery</h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-secondary hover:bg-secondary/10 rounded-full h-10 w-10 transition-colors" data-testid="button-add-photo">
              <Camera className="w-5 h-5" strokeWidth={2.5} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Photo URL</Label>
                <Input placeholder="https://..." value={newPhoto.url} onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })} data-testid="input-photo-url" />
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Input placeholder="e.g. Beach sunset" value={newPhoto.caption} onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })} data-testid="input-photo-caption" />
              </div>
              {newPhoto.url && (
                <div className="rounded-xl overflow-hidden h-40">
                  <img src={newPhoto.url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Button className="w-full rounded-xl bg-secondary hover:bg-secondary/90" onClick={() => addMutation.mutate(newPhoto)} disabled={!newPhoto.url || !newPhoto.caption || addMutation.isPending} data-testid="button-save-photo">
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Photo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No photos yet</p>
          <p className="text-sm mt-1">Tap the camera to add your first photo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-8">
          {photos.map((photo, i) => (
            <div key={photo.id} className={`rounded-[1.25rem] overflow-hidden shadow-sm relative group cursor-pointer bg-muted ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`} data-testid={`photo-${photo.id}`}>
              <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                <span className="text-white text-sm font-semibold tracking-wide" data-testid={`text-photo-caption-${photo.id}`}>{photo.caption}</span>
                <button
                  onClick={() => deleteMutation.mutate(photo.id)}
                  className="text-white/80 hover:text-red-400 transition-colors p-1"
                  data-testid={`button-delete-photo-${photo.id}`}
                >
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

function CurrencyView() {
  const { data: rates = [] } = useQuery<CurrencyRate[]>({ queryKey: ["/api/currency-rates"] });
  const [amount, setAmount] = useState("100");
  const [selectedRate, setSelectedRate] = useState<number | null>(null);

  const activeRate = rates.find((r) => r.id === selectedRate) || rates[0];
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Currency Converter</h2>
      </div>
      
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[1.5rem]">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">You Pay</Label>
            <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl border-2 border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm font-bold text-sm">
                <span className="text-lg leading-none">🇺🇸</span> USD
              </div>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="border-none shadow-none bg-transparent text-right text-3xl font-bold tracking-tight focus-visible:ring-0 px-2"
                data-testid="input-currency-from"
              />
            </div>
          </div>

          <div className="flex justify-center relative z-10 my-2">
            <Button size="icon" className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg h-12 w-12 border-4 border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform hover:rotate-180 duration-500">
              <ArrowRightLeft className="w-5 h-5 rotate-90" strokeWidth={2.5} />
            </Button>
            <div className="h-px w-full bg-border absolute top-1/2 left-0 -translate-y-1/2 -z-10"></div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">You Get</Label>
            <div className="flex items-center gap-3 bg-success/15 p-3 rounded-2xl border-2 border-transparent">
              {activeRate ? (
                <>
                  <Select value={String(activeRate.id)} onValueChange={(v) => setSelectedRate(Number(v))}>
                    <SelectTrigger className="w-auto border-none shadow-sm bg-white rounded-xl font-bold text-sm gap-2 px-4 py-2.5 h-auto" data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rates.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{r.flag}</span> {r.toCurrency}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 text-right text-3xl font-bold tracking-tight text-success-foreground px-2" data-testid="text-currency-result">
                    {(Number(amount) * activeRate.rate).toFixed(2)}
                  </div>
                </>
              ) : (
                <div className="flex-1 text-center text-muted-foreground py-2">Loading rates...</div>
              )}
            </div>
          </div>
          
          {activeRate && (
            <div className="text-center pt-4 pb-2">
              <p className="text-sm font-semibold text-foreground/80" data-testid="text-exchange-rate">1 USD = {activeRate.rate} {activeRate.toCurrency}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">Mid-market rate</p>
            </div>
          )}
        </CardContent>
      </Card>

      {rates.length > 0 && (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[1.5rem]">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Quick Rates</h3>
            <div className="space-y-3">
              {rates.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRate(r.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeRate?.id === r.id ? 'bg-primary/10 border-2 border-primary/20' : 'bg-muted/30 border-2 border-transparent hover:bg-muted/60'}`}
                  data-testid={`button-rate-${r.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.flag}</span>
                    <div className="text-left">
                      <p className="font-bold text-sm">{r.toCurrency}</p>
                      <p className="text-xs text-muted-foreground">1 USD = {r.rate}</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg">{(Number(amount) * r.rate).toFixed(2)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}