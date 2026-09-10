
import React, { useState } from "react";
import {
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  User,
  Home,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  nightSoft: "#1B2740",
  sandLine: "#E6E2D6",
};

const FONTS = {
  display: "'Fraunces', serif",
  body: "'Manrope', sans-serif",
};

// ============================================================
// MOCK DATA
// ============================================================

// Deal Room data
const DEAL_ROOMS = [
  {
    id: "dr1",
    property: {
      id: "p1",
      title: "Nyumba ya Ghorofa Mbezi Beach",
      price: 85000000,
      location: "Mbezi Beach, Dar es Salaam",
      category: "nyumba",
      images: ["/assets/properties/house1.jpg"],
    },
    buyer: {
      id: "b1",
      name: "Sarah Mwangi",
      avatar: "S",
      phone: "0754 123 456",
      email: "sarah@email.com",
    },
    seller: {
      id: "s1",
      name: "John Doe",
      avatar: "J",
      phone: "0743 895 038",
      email: "john@email.com",
    },
    status: "active", // "active" | "negotiating" | "inspecting" | "completed" | "cancelled"
    createdAt: "2026-09-10T10:30:00",
    updatedAt: "2026-09-12T14:20:00",
    messages: [
      {
        id: "m1",
        sender: "buyer",
        text: "Hello! I'm interested in this property. Is it still available?",
        timestamp: "2026-09-10T10:35:00",
        read: true,
      },
      {
        id: "m2",
        sender: "seller",
        text: "Yes, it's still available. Would you like to schedule a viewing?",
        timestamp: "2026-09-10T11:00:00",
        read: true,
      },
      {
        id: "m3",
        sender: "buyer",
        text: "Yes, please. Are you available this weekend?",
        timestamp: "2026-09-11T09:15:00",
        read: false,
      },
      {
        id: "m4",
        sender: "seller",
        text: "Yes, Saturday at 2pm works for me. I'll send you the location.",
        timestamp: "2026-09-11T14:30:00",
        read: false,
      },
    ],
    negotiations: [
      {
        id: "n1",
        offeredPrice: 75000000,
        sellerPrice: 85000000,
        status: "pending", // "pending" | "accepted" | "rejected" | "counter"
        createdAt: "2026-09-11T10:00:00",
      },
    ],
    inspection: {
      scheduled: "2026-09-16T14:00:00",
      status: "scheduled", // "scheduled" | "completed" | "cancelled"
      notes: "",
    },
  },
  {
    id: "dr2",
    property: {
      id: "p2",
      title: "Toyota Harrier 2016",
      price: 42000000,
      location: "Kinondoni, Dar es Salaam",
      category: "magari",
      images: ["/assets/properties/car1.jpg"],
    },
    buyer: {
      id: "b2",
      name: "Michael Kato",
      avatar: "M",
      phone: "0712 345 678",
      email: "michael@email.com",
    },
    seller: {
      id: "s2",
      name: "Jane Mushi",
      avatar: "J",
      phone: "0755 987 654",
      email: "jane@email.com",
    },
    status: "negotiating",
    createdAt: "2026-09-08T09:00:00",
    updatedAt: "2026-09-13T16:45:00",
    messages: [
      {
        id: "m5",
        sender: "buyer",
        text: "I'm interested in the car. Can you tell me more about its condition?",
        timestamp: "2026-09-08T09:30:00",
        read: true,
      },
      {
        id: "m6",
        sender: "seller",
        text: "It's in excellent condition. Regular servicing done. No accidents.",
        timestamp: "2026-09-08T10:00:00",
        read: true,
      },
      {
        id: "m7",
        sender: "buyer",
        text: "Would you accept 38,000,000?",
        timestamp: "2026-09-12T15:00:00",
        read: true,
      },
      {
        id: "m8",
        sender: "seller",
        text: "Let me think about it. I can do 40,000,000.",
        timestamp: "2026-09-13T16:45:00",
        read: false,
      },
    ],
    negotiations: [
      {
        id: "n2",
        offeredPrice: 38000000,
        sellerPrice: 42000000,
        counterPrice: 40000000,
        status: "counter",
        createdAt: "2026-09-12T15:30:00",
      },
    ],
    inspection: null,
  },
  {
    id: "dr3",
    property: {
      id: "p3",
      title: "Kiwanja Ubungo — Hati Miliki",
      price: 28000000,
      location: "Ubungo, Dar es Salaam",
      category: "viwanja",
      images: ["/assets/properties/land1.jpg"],
    },
    buyer: {
      id: "b3",
      name: "Peter Lema",
      avatar: "P",
      phone: "0765 432 109",
      email: "peter@email.com",
    },
    seller: {
      id: "s3",
      name: "Mary Mwangi",
      avatar: "M",
      phone: "0713 456 789",
      email: "mary@email.com",
    },
    status: "completed",
    createdAt: "2026-08-20T08:00:00",
    updatedAt: "2026-09-01T12:00:00",
    messages: [
      {
        id: "m9",
        sender: "buyer",
        text: "I saw the land and I'm interested.",
        timestamp: "2026-08-20T08:30:00",
        read: true,
      },
      {
        id: "m10",
        sender: "seller",
        text: "Great! Let's discuss the price.",
        timestamp: "2026-08-20T09:00:00",
        read: true,
      },
      {
        id: "m11",
        sender: "buyer",
        text: "I agree to the price. Let's proceed.",
        timestamp: "2026-08-25T10:00:00",
        read: true,
      },
      {
        id: "m12",
        sender: "seller",
        text: "Thank you! Sale completed successfully.",
        timestamp: "2026-09-01T12:00:00",
        read: true,
      },
    ],
    negotiations: [
      {
        id: "n3",
        offeredPrice: 26000000,
        sellerPrice: 28000000,
        status: "accepted",
        createdAt: "2026-08-25T10:30:00",
      },
    ],
    inspection: {
      scheduled: "2026-08-28T10:00:00",
      status: "completed",
      notes: "Land is as described. All documents are in order.",
    },
  },
];

// ============================================================
// STATUS CONFIGURATION
// ============================================================

const STATUS_CONFIG = {
  active: {
    label: "Active",
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
    icon: CheckCircle,
  },
  negotiating: {
    label: "Negotiating",
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.16)",
    icon: AlertCircle,
  },
  inspecting: {
    label: "Inspection",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: COLORS.green,
    bg: "rgba(47,109,79,0.12)",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: COLORS.rust,
    bg: "rgba(193,80,46,0.12)",
    icon: XCircle,
  },
};

// ============================================================
// COMPONENTS
// ============================================================

function MessageBubble({ message, isBuyer }) {
  const isOwn = (isBuyer && message.sender === "buyer") || (!isBuyer && message.sender === "seller");
  
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-[#E8A33D] text-[#101A2E]"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <span className="text-[10px] opacity-60 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function DealRoomCard({ deal, onClick }) {
  const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.active;
  const StatusIcon = status.icon;

  return (
    <div
      onClick={() => onClick(deal)}
      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm truncate">
            {deal.property.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {deal.property.location}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-bold text-[#C1502E]">
              TZS {deal.property.price.toLocaleString()}
            </span>
            <span
              style={{ background: status.bg, color: status.color }}
              className="text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1"
            >
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-8 h-8 rounded-full bg-[#E8A33D]/10 flex items-center justify-center text-[#E8A33D] font-semibold text-xs">
            {deal.buyer.avatar}
          </div>
          <div className="text-xs text-gray-500">
            <p className="font-medium text-gray-700">{deal.buyer.name}</p>
            <p className="text-[10px]">{new Date(deal.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Unread messages indicator */}
      {deal.messages.some(m => !m.read) && (
        <div className="mt-2 flex items-center gap-1.5 text-[#C1502E] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#C1502E]" />
          Ujumbe mpya
        </div>
      )}
    </div>
  );
}

function NegotiationPanel({ negotiation, onAccept, onReject, onCounter, isBuyer }) {
  const [counterAmount, setCounterAmount] = useState("");
  
  if (!negotiation) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">Hakuna negotiation iliyoanzishwa</p>
        <button className="mt-2 text-[#E8A33D] text-sm font-medium hover:underline">
          Anzisha Negotiation
        </button>
      </div>
    );
  }

  const statusColors = {
    pending: "text-yellow-600 bg-yellow-50",
    accepted: "text-green-600 bg-green-50",
    rejected: "text-red-600 bg-red-50",
    counter: "text-blue-600 bg-blue-50",
  };

  const statusLabels = {
    pending: "Inasubiri",
    accepted: "Imekubaliwa",
    rejected: "Imekataliwa",
    counter: "Counter Offer",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 text-sm">Negotiation</h4>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[negotiation.status]}`}>
          {statusLabels[negotiation.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Ofa yako</p>
          <p className="font-semibold text-gray-800">
            TZS {negotiation.offeredPrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Bei ya Muuzaji</p>
          <p className="font-semibold text-gray-800">
            TZS {negotiation.sellerPrice.toLocaleString()}
          </p>
        </div>
        {negotiation.counterPrice && (
          <div className="col-span-2">
            <p className="text-gray-500 text-xs">Counter Offer</p>
            <p className="font-semibold text-[#E8A33D]">
              TZS {negotiation.counterPrice.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {negotiation.status === "pending" && isBuyer && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept?.(negotiation.id)}
            className="flex-1 bg-[#2F6D4F] text-white text-sm font-medium py-2 rounded-lg"
          >
            Kubali
          </button>
          <button
            onClick={() => onReject?.(negotiation.id)}
            className="flex-1 border border-[#C1502E] text-[#C1502E] text-sm font-medium py-2 rounded-lg"
          >
            Kataa
          </button>
        </div>
      )}

      {negotiation.status === "counter" && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Weka bei..."
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              if (counterAmount && onCounter) {
                onCounter(negotiation.id, parseInt(counterAmount.replace(/[^0-9]/g, "")));
                setCounterAmount("");
              }
            }}
            className="bg-[#E8A33D] text-[#101A2E] px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function InspectionPanel({ inspection, onSchedule }) {
  if (!inspection) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">Hakuna inspection iliyopangwa</p>
        <button className="mt-2 text-[#E8A33D] text-sm font-medium hover:underline">
          Panga Inspection
        </button>
      </div>
    );
  }

  const statusColors = {
    scheduled: "text-blue-600 bg-blue-50",
    completed: "text-green-600 bg-green-50",
    cancelled: "text-red-600 bg-red-50",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 text-sm">Inspection</h4>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[inspection.status]}`}>
          {inspection.status === "scheduled" ? "Imepangwa" : 
           inspection.status === "completed" ? "Imekamilika" : "Imefutwa"}
        </span>
      </div>

      {inspection.scheduled && (
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-gray-700">
            {new Date(inspection.scheduled).toLocaleDateString('sw-TZ', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <Clock size={16} className="text-gray-400 ml-2" />
          <span className="text-gray-700">
            {new Date(inspection.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {inspection.notes && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <p className="font-medium text-gray-700 text-xs">Notes:</p>
          <p>{inspection.notes}</p>
        </div>
      )}

      {inspection.status === "scheduled" && (
        <div className="flex gap-2">
          <button className="flex-1 bg-[#2F6D4F] text-white text-sm font-medium py-2 rounded-lg">
            Kamilisha Inspection
          </button>
          <button className="flex-1 border border-[#C1502E] text-[#C1502E] text-sm font-medium py-2 rounded-lg">
            Ghairi
          </button>
        </div>
      )}
    </div>
  );
}

function MessageInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Andika ujumbe..."
        className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          message.trim()
            ? "bg-[#E8A33D] text-[#101A2E] hover:bg-[#B87A1F]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Send size={18} />
      </button>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DealRoom({ deals: externalDeals, userRole = "seller" }) {
  const [deals, setDeals] = useState(externalDeals || DEAL_ROOMS);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [activeTab, setActiveTab] = useState("messages"); // "messages" | "negotiation" | "inspection"

  const isBuyer = userRole === "buyer";

  const handleSendMessage = (text) => {
    if (!selectedDeal) return;
    
    const newMessage = {
      id: `m${Date.now()}`,
      sender: isBuyer ? "buyer" : "seller",
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setDeals((prev) =>
      prev.map((d) =>
        d.id === selectedDeal.id
          ? { ...d, messages: [...d.messages, newMessage], updatedAt: new Date().toISOString() }
          : d
      )
    );

    setSelectedDeal((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSelectDeal = (deal) => {
    setSelectedDeal(deal);
    setActiveTab("messages");
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000 / 60 / 60; // hours

    if (diff < 1) {
      const minutes = Math.floor(diff * 60);
      return `${minutes} dakika zilizopita`;
    } else if (diff < 24) {
      const hours = Math.floor(diff);
      return hours === 1 ? `Saa 1 iliyopita` : `Saa ${hours} zilizopita`;
    } else {
      const days = Math.floor(diff / 24);
      return days === 1 ? `Siku 1 iliyopita` : `Siku ${days} zilizopita`;
    }
  };

  return (
    <div style={{ fontFamily: FONTS.body, background: COLORS.sand }} className="w-full h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-6xl mx-auto">
        <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold mb-1">
          Deal Rooms
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          {isBuyer 
            ? "Mazungumzo yako na wauzaji wa mali"
            : "Mazungumzo yako na wanunuzi wa mali"}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================= LEFT - Deal List ================= */}
          <div className="lg:col-span-1 space-y-3">
            {deals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                <MessageSquare size={40} className="mx-auto text-gray-300" />
                <p className="text-gray-500 text-sm mt-2">Hakuna deal rooms</p>
                <p className="text-gray-400 text-xs">
                  {isBuyer 
                    ? "Anzisha mazungumzo kwa mali unayopenda"
                    : "Wateja watakapowasiliana nawe, wataonekana hapa"}
                </p>
              </div>
            ) : (
              deals.map((deal) => (
                <DealRoomCard
                  key={deal.id}
                  deal={deal}
                  onClick={handleSelectDeal}
                />
              ))
            )}
          </div>

          {/* ================= RIGHT - Selected Deal ================= */}
          <div className="lg:col-span-2">
            {!selectedDeal ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center h-[500px] flex flex-col items-center justify-center">
                <MessageSquare size={56} className="text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-800 mt-4">Chagua Deal Room</h3>
                <p className="text-gray-500 text-sm">
                  Bonyeza deal room kutoka upande wa kushoto kuona mazungumzo
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-[500px] flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#E8A33D]/10 flex items-center justify-center text-[#E8A33D] font-semibold text-sm flex-shrink-0">
                      {isBuyer ? selectedDeal.seller.avatar : selectedDeal.buyer.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {isBuyer ? selectedDeal.seller.name : selectedDeal.buyer.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedDeal.property.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                      <Phone size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-4">
                  <button
                    onClick={() => setActiveTab("messages")}
                    className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "messages"
                        ? "border-[#E8A33D] text-[#E8A33D]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Ujumbe
                    {selectedDeal.messages.some(m => !m.read) && (
                      <span className="ml-1.5 w-2 h-2 rounded-full bg-[#C1502E] inline-block" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("negotiation")}
                    className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "negotiation"
                        ? "border-[#E8A33D] text-[#E8A33D]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Negotiation
                  </button>
                  <button
                    onClick={() => setActiveTab("inspection")}
                    className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "inspection"
                        ? "border-[#E8A33D] text-[#E8A33D]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Inspection
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === "messages" && (
                    <div className="space-y-3">
                      {/* Property info */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {selectedDeal.property.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedDeal.property.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#C1502E] text-sm">
                              TZS {selectedDeal.property.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      {selectedDeal.messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isBuyer={isBuyer}
                        />
                      ))}
                    </div>
                  )}

                  {activeTab === "negotiation" && (
                    <NegotiationPanel
                      negotiation={selectedDeal.negotiations?.[0]}
                      isBuyer={isBuyer}
                    />
                  )}

                  {activeTab === "inspection" && (
                    <InspectionPanel
                      inspection={selectedDeal.inspection}
                    />
                  )}
                </div>

                {/* Message Input - Only for messages tab */}
                {activeTab === "messages" && (
                  <div className="p-3 border-t border-gray-100">
                    <MessageInput onSend={handleSendMessage} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export { DEAL_ROOMS };

