import { useState } from "react";
import { useQuery } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../../../convex/_generated/api";

export function CurrencyView() {
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
