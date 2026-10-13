import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Headphones,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  User,
  Phone,
  Mail,
  ExternalLink,
  AlertCircle,
  Filter,
  Check
} from "lucide-react";
import { useToast } from "../components/Toast";

interface SupportTicket {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  orderId?: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  priority: "high" | "normal";
  createdAt: string;
  messages: Array<{
    id: string;
    sender: "customer" | "admin";
    text: string;
    time: string;
  }>;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "TICK-101",
    customerName: "Kwame Mensah",
    email: "kwame.mensah@example.com",
    phone: "+233 24 111 2233",
    orderId: "79b3b375-0e59-4585-b079-9c6ce187ab28",
    subject: "When will my iPhone 15 Pro Max arrive in Kumasi?",
    status: "open",
    priority: "high",
    createdAt: "10 mins ago",
    messages: [
      {
        id: "m1",
        sender: "customer",
        text: "Hello, I made payment earlier today via MTN MoMo for the iPhone 15 Pro Max. Can you confirm when the delivery team will dispatch it to Kumasi?",
        time: "10 mins ago"
      }
    ]
  },
  {
    id: "TICK-102",
    customerName: "Ama Serwaa",
    email: "ama.serwaa@example.com",
    phone: "+233 20 888 9911",
    orderId: "e2f10d92-1234-4585-b079-9c6ce187ab29",
    subject: "Request to change delivery location to East Legon",
    status: "in_progress",
    priority: "normal",
    createdAt: "1 hour ago",
    messages: [
      {
        id: "m2",
        sender: "customer",
        text: "Hi support, I need to update my drop-off address. I will be at East Legon near American House tomorrow instead of Airport Residential.",
        time: "1 hour ago"
      },
      {
        id: "m3",
        sender: "admin",
        text: "Hello Ama, we received your request. We are updating the courier dispatch sheet accordingly.",
        time: "45 mins ago"
      }
    ]
  },
  {
    id: "TICK-103",
    customerName: "Kofi Boateng",
    email: "kofi.boateng@example.com",
    phone: "+233 55 444 3322",
    orderId: "a1c90f84-9876-4585-b079-9c6ce187ab30",
    subject: "Warranty verification certificate inquiry",
    status: "resolved",
    priority: "normal",
    createdAt: "Yesterday",
    messages: [
      {
        id: "m4",
        sender: "customer",
        text: "Good day, I received my MacBook Pro M3 today in sealed packaging. How do I verify the official Apple 1-year warranty online?",
        time: "Yesterday"
      },
      {
        id: "m5",
        sender: "admin",
        text: "Hello Kofi, you can enter the device serial number directly on checkcoverage.apple.com to verify your 1-year Apple international warranty. Enjoy your new MacBook!",
        time: "Yesterday"
      }
    ]
  }
];

export function Support() {
  const toast = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("TICK-101");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const newMsg = {
      id: `${Date.now()}`,
      sender: "admin" as const,
      text: replyText.trim(),
      time: "Just now"
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === activeTicket.id) {
          return {
            ...t,
            status: t.status === "open" ? "in_progress" : t.status,
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );

    setReplyText("");
    toast.success(`Response sent to ${activeTicket.customerName}`);
  };

  const handleUpdateStatus = (ticketId: string, status: "open" | "in_progress" | "resolved") => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
    toast.success(`Ticket marked as ${status.replace("_", " ")}`);
  };

  const setPreset = (preset: string) => {
    setReplyText(preset);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          Customer Support & Inquiries
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          Respond directly to customer complaints, delivery questions, and order inquiries.
        </p>
      </div>

      {/* Main Inbox Grid */}
      <div className="bg-white rounded-3xl border border-[#ebebe9] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ─── LEFT PANEL: TICKETS QUEUE ──────────────────────────────────── */}
        <div className="lg:col-span-5 border-r border-gray-100 flex flex-col">
          {/* Search & Filters */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search complaints or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(["all", "open", "in_progress", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-full capitalize whitespace-nowrap transition ${
                    filterStatus === st
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "text-gray-500 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No complaints in this queue</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                const lastMsg = t.messages[t.messages.length - 1];

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 cursor-pointer transition ${
                      isSelected ? "bg-neutral-50 border-l-4 border-neutral-900" : "hover:bg-gray-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-gray-900">{t.customerName}</span>
                      <span className="text-[10px] text-gray-400">{t.createdAt}</span>
                    </div>

                    <div className="font-semibold text-xs text-gray-800 truncate mb-1">
                      {t.subject}
                    </div>

                    <p className="text-[11px] text-gray-500 truncate mb-2">
                      {lastMsg ? lastMsg.text : ""}
                    </p>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          t.status === "open"
                            ? "bg-neutral-900 text-white"
                            : t.status === "in_progress"
                            ? "bg-neutral-200 text-neutral-800"
                            : "bg-gray-100 text-gray-500 line-through"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>

                      {t.priority === "high" && (
                        <span className="text-[10px] font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                          Priority
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: CONVERSATION & REPLY ───────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full bg-[#fafafa]">
          {activeTicket ? (
            <>
              {/* Ticket Top Info Bar */}
              <div className="p-5 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                    <span>{activeTicket.id}</span>
                    {activeTicket.orderId && (
                      <>
                        <span>•</span>
                        <Link
                          to={`/orders/${activeTicket.orderId}`}
                          className="text-neutral-900 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Order #{activeTicket.orderId.slice(0, 6)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </>
                    )}
                  </div>
                  <h2 className="text-base font-extrabold text-gray-900 mt-0.5">
                    {activeTicket.subject}
                  </h2>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {activeTicket.customerName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {activeTicket.phone}
                    </span>
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket.id, "in_progress")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      activeTicket.status === "in_progress"
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket.id, "resolved")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      activeTicket.status === "resolved"
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {activeTicket.messages.map((m) => {
                  const isAdmin = m.sender === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">
                        {isAdmin ? "Store Operations Admin" : activeTicket.customerName} • {m.time}
                      </span>
                      <div
                        className={`max-w-md p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                          isAdmin
                            ? "bg-neutral-900 text-white rounded-br-xs"
                            : "bg-white text-gray-900 border border-gray-200 rounded-bl-xs"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box Section */}
              <div className="p-4 bg-white border-t border-gray-100">
                {/* Quick Presets */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 text-[11px]">
                  <span className="text-gray-400 font-bold shrink-0">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreset(
                        "Hello, your order has been packed and handed over to our verified courier dispatch. You will receive an SMS upon arrival."
                      )
                    }
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 whitespace-nowrap transition border border-gray-200"
                  >
                    Order Dispatched
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreset(
                        "We have verified your delivery address update with our delivery team."
                      )
                    }
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 whitespace-nowrap transition border border-gray-200"
                  >
                    Address Confirmed
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreset(
                        "Your payment has been reconciled. All Apple serial numbers and warranties are verified."
                      )
                    }
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 whitespace-nowrap transition border border-gray-200"
                  >
                    Payment & Warranty Verified
                  </button>
                </div>

                <form onSubmit={handleSendReply} className="mt-2 flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Write a response to ${activeTicket.customerName}...`}
                    className="flex-1 p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-5 py-3 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-gray-400 m-auto">
              <Headphones className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Select a complaint ticket to inspect</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Support;
