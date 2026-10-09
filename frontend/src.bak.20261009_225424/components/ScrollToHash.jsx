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

    let attempts = 0;
    const maxAttempts = 20; // jaribu kwa hadi ~2s (20 x 100ms)
    let timeoutId;

    const scrollToElement = () => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      // Element bado haipo (page/picha bado zinapakia) - jaribu tena
      attempts += 1;
      if (attempts < maxAttempts) {
        timeoutId = setTimeout(scrollToElement, 100);
      }
    };

    // Subiri kidogo ili page ijifunue kabla ya jaribio la kwanza
    timeoutId = setTimeout(scrollToElement, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, hash]);

  return null;
}
