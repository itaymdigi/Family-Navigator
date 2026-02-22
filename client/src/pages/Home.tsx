import { useState } from "react";
import { Map, MapPin, Image as ImageIcon, Calculator, Plus, ArrowRightLeft, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock Data
const SAVED_PLACES = [
  { id: 1, name: "Eiffel Tower", location: "Paris, France", image: "/src/assets/images/place-1.jpg", type: "Attraction" },
  { id: 2, name: "Colosseum", location: "Rome, Italy", image: "/src/assets/images/place-2.jpg", type: "Historical" },
];

const PHOTOS = [
  { id: 1, url: "/src/assets/images/photo-1.jpg", caption: "Family Selfie!" },
  { id: 2, url: "/src/assets/images/photo-2.jpg", caption: "Beach Day" },
  { id: 3, url: "/src/assets/images/photo-3.jpg", caption: "Sunset" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("places");

  return (
    <div className="min-h-screen bg-muted/50 flex justify-center selection:bg-primary/20">
      <div className="w-full max-w-md bg-background shadow-2xl min-h-screen relative flex flex-col pb-20 overflow-hidden sm:border-x sm:border-border">
        {/* Header */}
        <header className="pt-12 pb-6 px-6 bg-primary text-primary-foreground rounded-b-[2rem] shadow-sm z-10 relative">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1 tracking-tight">Euro Trip 2026</h1>
              <p className="text-primary-foreground/90 text-sm font-medium">3 Days remaining</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-primary-foreground/30 overflow-hidden shadow-inner bg-white/20 flex-shrink-0">
              <img src="/src/assets/images/photo-1.jpg" alt="Profile" className="w-full h-full object-cover" />
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 z-0">
          {activeTab === "places" && <PlacesView />}
          {activeTab === "photos" && <PhotosView />}
          {activeTab === "currency" && <CurrencyView />}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-border px-6 py-4 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
          <NavItem 
            icon={<Map className="w-[26px] h-[26px]" />} 
            label="Places" 
            isActive={activeTab === "places"} 
            onClick={() => setActiveTab("places")} 
          />
          <NavItem 
            icon={<ImageIcon className="w-[26px] h-[26px]" />} 
            label="Photos" 
            isActive={activeTab === "photos"} 
            onClick={() => setActiveTab("photos")} 
          />
          <NavItem 
            icon={<Calculator className="w-[26px] h-[26px]" />} 
            label="Currency" 
            isActive={activeTab === "currency"} 
            onClick={() => setActiveTab("currency")} 
          />
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
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Saved Places</h2>
        <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-10 w-10 transition-colors">
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </Button>
      </div>
      
      <div className="space-y-5 pb-8">
        {SAVED_PLACES.map((place) => (
          <Card key={place.id} className="overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group cursor-pointer rounded-[1.25rem] bg-white" data-testid={`place-card-${place.id}`}>
            <div className="h-44 overflow-hidden relative">
              <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-bold tracking-wide uppercase rounded-full text-foreground shadow-sm">
                {place.type}
              </div>
            </div>
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-foreground tracking-tight">{place.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5" /> {place.location}
                </p>
              </div>
              <Button size="sm" className="rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold shadow-sm px-4">
                Navigate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PhotosView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Trip Gallery</h2>
        <Button variant="ghost" size="icon" className="text-secondary hover:text-secondary hover:bg-secondary/10 rounded-full h-10 w-10 transition-colors">
          <Camera className="w-5 h-5" strokeWidth={2.5} />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pb-8">
        {PHOTOS.map((photo, i) => (
          <div key={photo.id} className={`rounded-[1.25rem] overflow-hidden shadow-sm relative group cursor-pointer bg-muted ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`} data-testid={`photo-${photo.id}`}>
            <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-sm font-semibold tracking-wide">{photo.caption}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrencyView() {
  const [amount, setAmount] = useState("100");
  
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
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm font-bold text-sm">
                <span className="text-lg leading-none">🇪🇺</span> EUR
              </div>
              <div className="flex-1 text-right text-3xl font-bold tracking-tight text-success-foreground px-2" data-testid="text-currency-result">
                {(Number(amount) * 0.92).toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4 pb-2">
            <p className="text-sm font-semibold text-foreground/80">1 USD = 0.92 EUR</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">Mid-market rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}