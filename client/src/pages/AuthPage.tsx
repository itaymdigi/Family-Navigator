import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthActions } from "@convex-dev/auth/react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuthActions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn("password", { email: username, password, flow: "signIn" });
      } else {
        await signIn("password", { email: username, password, flow: "signUp", name: displayName });
      }
      toast({ title: mode === "login" ? "התחברת בהצלחה!" : "נרשמת בהצלחה!" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "שגיאת שרת";
      toast({ title: "שגיאה", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-4" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧭</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Family Navigator</h1>
          <p className="text-gray-500">אפליקציית הטיולים המשפחתית שלנו</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              data-testid="tab-login"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "login" ? "bg-white shadow text-blue-600" : "text-gray-500"
              }`}
            >
              התחברות
            </button>
            <button
              data-testid="tab-register"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "register" ? "bg-white shadow text-blue-600" : "text-gray-500"
              }`}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
              <input
                data-testid="input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="הכנס שם משתמש"
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם תצוגה</label>
                <input
                  data-testid="input-displayname"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="השם שיוצג באפליקציה"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
              <input
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="הכנס סיסמה"
                required
                minLength={4}
              />
            </div>

            <button
              data-testid="button-submit-auth"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? "..." : mode === "login" ? "התחבר" : "הירשם"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
