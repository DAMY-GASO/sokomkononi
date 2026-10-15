import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, MessageSquare, LayoutGrid, Heart } from "lucide-react";
import { useAuth } from "../config/authStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useDashboardSide } from "../config/dashboardSideStore.js";
import { cx } from "./ui";

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const side = useDashboardSide();
  const isActive = (p) => (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));
  const isBuyer = side === "buyer";

  const actionLink  = isBuyer ? "/tafuta" : user ? "/dashboard/post" : "/register?intent=sell";
  const ActionIcon  = isBuyer ? Search : PlusCircle;
  const actionLabel = isBuyer ? (lang === "sw" ? "Tafuta" : "Search") : t("nav_sell");
  const secondTarget = isBuyer ? "/dashboard/buyer/saved" : "/dashboard/deals";
  const secondLink   = user ? secondTarget : "/login";
  const SecondIcon   = isBuyer ? Heart : MessageSquare;
  const secondLabel  = isBuyer ? t("nav_saved") : (lang === "sw" ? "Deals" : "Deals");
  const messagesTarget = isBuyer ? "/dashboard/buyer/messages" : "/dashboard/messages";
  const messagesLink   = user ? messagesTarget : "/login";

  const Item = ({ to, icon: Icon, label, active, sell }) => (
    <Link to={to} className={cx("nav-item", active && "active", sell && "sell-btn")}>
      <Icon size={sell ? 22 : 21} />
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="bottom-nav safe-bottom">
      <Item to="/" icon={Home} label={t("nav_home")} active={isActive("/")} />
      <Item to={secondLink} icon={SecondIcon} label={secondLabel} active={isActive(secondTarget)} />
      <Item to={actionLink} icon={ActionIcon} label={actionLabel} sell />
      <Item to={messagesLink} icon={MessageSquare} label={t("nav_messages")} active={isActive(messagesLink)} />
      <Item to="/mali-zote" icon={LayoutGrid} label={lang === "sw" ? "Mali Zote" : "All"} active={isActive("/mali-zote")} />
    </nav>
  );
}
