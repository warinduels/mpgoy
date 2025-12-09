import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: boolean;
  loading: boolean;
  secretKey: string | null;
  validateSecretKey: (secretKey: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = "mpgoy_auth";
const SECRET_KEY_STORAGE = "mpgoy_secret_key";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [secretKey, setSecretKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has valid session in localStorage
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedKey = localStorage.getItem(SECRET_KEY_STORAGE);
    if (storedAuth === "true" && storedKey) {
      setUser(true);
      setSecretKey(storedKey);
    }
    setLoading(false);
  }, []);

  const validateSecretKey = async (key: string) => {
    const { data: validationResult, error: validationError } = await supabase.functions.invoke(
      "validate-signup-key",
      { body: { secretKey: key } }
    );

    if (validationError) {
      return { error: new Error("Failed to validate secret key. Please try again.") };
    }

    if (!validationResult?.valid) {
      return { error: new Error("Invalid secret key. Contact the admin to get access.") };
    }

    // Store auth state and secret key
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    localStorage.setItem(SECRET_KEY_STORAGE, key);
    setUser(true);
    setSecretKey(key);

    return { error: null };
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SECRET_KEY_STORAGE);
    setUser(false);
    setSecretKey(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, secretKey, validateSecretKey, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
