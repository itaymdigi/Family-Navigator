import { useState } from "react";
import { useQuery } from "convex/react";
import { useToast } from "@/hooks/use-toast";
import { useAuthActions } from "@convex-dev/auth/react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../../../convex/_generated/api";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const hasUsers = useQuery(api.users.hasUsers);
  const { toast } = useToast();
  const { signIn } = useAuthActions();

  // Normalize username: lowercase + trim + append domain if no @ present
  const toEmail = (u: string) => {
    const clean = u.trim().toLowerCase();
    return clean.includes("@") ? clean : `${clean}@family.nav`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const email = toEmail(username.trim());
      if (mode === "login") {
        await signIn("password", { email, password, flow: "signIn" });
      } else {
        await signIn("password", { email, password, flow: "signUp", name: displayName });
      }
      toast({ title: mode === "login" ? "התחברת בהצלחה!" : "נרשמת בהצלחה!" });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const msg =
        raw === "InvalidSecret" ? "סיסמה שגויה. נסה שוב." :
        raw === "InvalidAccountId" ? "משתמש לא נמצא. האם הרשמת?" :
        raw === "TooManyFailedAttempts" ? "יותר מדי ניסיונות כושלים. נסה שוב מאוחר יותר." :
        raw.includes("Invalid password") ? "הסיסמה חייבת להכיל לפחות 8 תווים." :
        raw;
      setError(msg);
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
          {/* Show register tab only on first run (no users yet) */}
          {hasUsers === false && (
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
                הגדרת מנהל ראשוני
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
              <input
                data-testid="input-username"
                type="text"
                inputMode="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="הכנס שם משתמש"
                required
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
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
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pl-11"
                  placeholder="לפחות 8 תווים"
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  autoCorrect="off"
                  autoCapitalize="none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium text-right">
                {error}
              </div>
            )}

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
