import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setTokens } from "../../api/client.js";
import { hydrateCurrentUserFromApi } from "../../config/authStore.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { lang } = useLanguage();
  const ran = useRef(false);
  const tx = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const access = params.get("access");
    const refresh = params.get("refresh");

    if (!access || !refresh) {
      navigate("/login?error=social", { replace: true });
      return;
    }

    setTokens({ access, refresh });
    hydrateCurrentUserFromApi()
      .then((res) => {
        if (res?.ok) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login?error=social", { replace: true });
        }
      })
      .catch(() => navigate("/login?error=social", { replace: true }));
  }, [navigate, params]);

  return (
    <div className="min-h-screen grid place-items-center bg-page">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-sandline border-t-royal" />
        <p className="text-sm text-secondary">
          {tx("Inakamilisha kuingia...", "Completing sign-in...")}
        </p>
      </div>
    </div>
  );
}