import React from "react";
import { COLORS } from "../shared";
import ContactDrawer from "../../../../components/ContactDrawer.jsx";
import { Flag } from "lucide-react";
import ReservationModal from "./ReservationModal.jsx";

export default function DealDetailModals({ buyerEmail, buyerPhone, contactDrawerOpen, deal, handleReportSubmit, handleReserveSuccess, isBuyer, lang, reportBusy, reportDetails, reportOpen, reportReason, reportSuccess, reserveModalOpen, sellerEmail, sellerPhone, setContactDrawerOpen, setReportDetails, setReportOpen, setReportReason, setReserveModalOpen, side, user }) {
  return (
    <>
{/* Reservation Modal */}
      <ReservationModal
        open={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        deal={deal}
        lang={lang}
        user={user}
        onConfirm={handleReserveSuccess}
      />

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-2xl border w-full max-w-md p-5"
          >
            <h3 className="text-primary text-base font-bold mb-3 flex items-center gap-2">
              <Flag size={16} color={COLORS.rust} />
              {side === "buyer"
                ? lang === "sw"
                  ? "Ripoti Muuzaji"
                  : "Report this Seller"
                : lang === "sw"
                  ? "Ripoti Mnunuzi"
                  : "Report this Buyer"}
            </h3>

            {reportSuccess ? (
               <div
                  style={{
                       color: COLORS.green,
                        background: "rgba(47,109,79,0.1)",
                 }}
                className="rounded-lg p-3 text-sm text-center mb-3 space-y-2"
               >
           <p>
           {lang === "sw"
                  ? "Ripoti yako imetumwa. Timu yetu itachukua hatua ndani ya saa 24."
                  : "Your report has been sent. Our team will act within 24 hours."}
            </p>
               <a
                href="/dashboard/safety"
                className="inline-block text-xs font-semibold underline"
                >
              {lang === "sw"
               ? "Fuatilia kwenye Usalama & Msaada →"
               : "Track in Safety & Support →"}
               </a>
          </div>
            ) : (
              <>
                <label className="text-xs font-semibold text-secondary">
                  {lang === "sw" ? "Sababu" : "Reason"}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1"
                  style={{ borderColor: COLORS.sandLine }}
                >
                  <option value="FRAUD">
                    {lang === "sw"
                      ? "Utapeli / Uongo"
                      : "Fraud / Dishonesty"}
                  </option>
                  <option value="HARASSMENT">
                    {lang === "sw"
                      ? "Unyanyasaji / Vitisho"
                      : "Harassment / Threats"}
                  </option>
                  <option value="NO_SHOW">
                    {lang === "sw"
                      ? "Hakufika kwenye Ukaguzi"
                      : "No-show at inspection"}
                  </option>
                  <option value="FAKE_DOCS">
                    {lang === "sw"
                      ? "Hati za Uongo"
                      : "Fake documents"}
                  </option>
                  <option value="OFF_PLATFORM">
                    {lang === "sw"
                      ? "Kutaka Malipo Nje ya Jukwaa"
                      : "Off-platform payment request"}
                  </option>
                  <option value="OTHER">
                    {lang === "sw" ? "Nyingine" : "Other"}
                  </option>
                </select>

                <label className="text-xs font-semibold text-secondary">
                  {lang === "sw" ? "Maelezo" : "Details"}
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  placeholder={
                    lang === "sw"
                      ? "Eleza kwa ufupi tatizo (angalau herufi 10)..."
                      : "Describe the issue briefly (at least 10 chars)..."
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1 resize-none"
                  style={{ borderColor: COLORS.sandLine }}
                />

                {reportDetails.trim().length > 0 &&
                  reportDetails.trim().length < 10 && (
                    <p
                      className="text-xs mb-2"
                      style={{ color: COLORS.rust }}
                    >
                      {lang === "sw"
                        ? "Tafadhali toa maelezo ya kutosha (angalau herufi 10)."
                        : "Please provide enough details (at least 10 chars)."}
                    </p>
                  )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReportOpen(false);
                      setReportDetails("");
                      setReportReason("FRAUD");
                    }}
                    disabled={reportBusy}
                    style={{ borderColor: COLORS.sandLine }}
                    className="flex-1 border text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    {lang === "sw" ? "Ghairi" : "Cancel"}
                  </button>
                  <button
                    onClick={handleReportSubmit}
                    disabled={
                      reportDetails.trim().length < 10 || reportBusy
                    }
                    style={{
                      background:
                        reportDetails.trim().length >= 10
                          ? COLORS.rust
                          : COLORS.sandLine,
                      color: "white",
                    }}
                    className="flex-1 text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportBusy
                      ? lang === "sw"
                        ? "Inatuma..."
                        : "Sending..."
                      : lang === "sw"
                        ? "Tuma Ripoti"
                        : "Send Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ContactDrawer
        open={contactDrawerOpen}
        onClose={() => setContactDrawerOpen(false)}
        lang={lang}
        dealId={deal.dealRoomId || deal.id}
        currentUserId={user?.id}
        contact={{
          name: deal.counterpartyName,
          phone: isBuyer ? sellerPhone : buyerPhone,
          email: isBuyer ? sellerEmail : buyerEmail,
          role: isBuyer ? "seller" : "buyer",
          userId: isBuyer ? deal.sellerId : deal.buyerId,
        }}
      />
    </>
  );
}
