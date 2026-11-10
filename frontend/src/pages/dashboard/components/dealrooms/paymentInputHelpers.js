

export function formatMoneyInput(value) {
  if (!value) return "";
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

export function cleanMoneyInput(value) {
  return String(value).replace(/[^0-9]/g, "");
}

export function cleanPhoneInput(value) {
  return String(value || "").replace(/[^\d+]/g, "").slice(0, 15);
}

export function cleanCardInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function isMobileMoneyMethod(m) {
  return (
    m === "M-Pesa" ||
    m === "Mixx by Yas" ||
    m === "Airtel Money" ||
    m === "HaloPesa"
  );
}

export function isBankMethod(m) {
  const s = String(m || "").toLowerCase();
  return (
    s.includes("benki") ||
    s.includes("bank") ||
    s.includes("card") ||
    s.includes("kadi")
  );
}
