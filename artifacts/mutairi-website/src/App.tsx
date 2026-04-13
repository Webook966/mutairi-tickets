import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider, useApp } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Book from "@/pages/Book";
import MyTickets from "@/pages/MyTickets";
import Wallet from "@/pages/Wallet";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import { Ticket, BookOpen, Wallet as WalletIcon, User, Home as HomeIcon } from "lucide-react";

const queryClient = new QueryClient();

type Page = "home" | "book" | "my-tickets" | "wallet" | "account" | "admin";

const TABS = [
  { id: "account", label: "حسابي", icon: User },
  { id: "wallet", label: "المحفظة", icon: WalletIcon },
  { id: "my-tickets", label: "تذاكري", icon: BookOpen },
  { id: "book", label: "حجز", icon: Ticket },
  { id: "home", label: "الرئيسية", icon: HomeIcon },
] as const;

function Shell() {
  const { currentUser, isLoading } = useApp();
  const [page, setPage] = useState<Page>("home");

  useEffect(() => {
    if (!currentUser) setPage("home");
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#0B1426,#1B3A8C,#1B4FD8)" }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
          <Ticket size={40} color="#fff" />
        </div>
        <p className="text-white font-black text-2xl mb-2">تذكرتك بتجيك ذحين</p>
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mt-4" />
      </div>
    );
  }

  if (!currentUser) return <Login />;

  const navigate = (p: string) => setPage(p as Page);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F4FF", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: 70 }}>
        {page === "home" && <Home navigate={navigate} />}
        {page === "book" && <Book navigate={navigate} />}
        {page === "my-tickets" && <MyTickets />}
        {page === "wallet" && <Wallet />}
        {page === "account" && <Account navigate={navigate} />}
        {page === "admin" && <Admin navigate={navigate} />}
      </div>

      {page !== "admin" && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full flex items-end z-30" style={{ maxWidth: 480, paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
          <div className="w-full flex bg-white" style={{ borderTop: "1px solid #E2E8F0", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = page === tab.id;
              return (
                <button key={tab.id} onClick={() => navigate(tab.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all active:scale-95"
                  style={{ color: active ? "#1B4FD8" : "#6B7A99" }}>
                  <div className="relative">
                    {active && <div className="absolute inset-0 rounded-full scale-150" style={{ background: "#EEF2FF" }} />}
                    <Icon size={22} color={active ? "#1B4FD8" : "#9CA3AF"} style={{ position: "relative" }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: active ? "#1B4FD8" : "#9CA3AF" }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Shell />
        <Toaster />
      </AppProvider>
    </QueryClientProvider>
  );
}
