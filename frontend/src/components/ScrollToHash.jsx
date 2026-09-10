import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Kama hakuna hash, rudi juu
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Kama kuna hash, tafuta element na scroll
    const id = hash.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      // Subiri kidogo ili page ijifunue
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [pathname, hash]);

  return null;
}
