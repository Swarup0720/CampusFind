import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, MapPin, Store, CheckCircle, Clock, 
  ShoppingBag, ArrowRight, X, RefreshCw, User as UserIcon, Phone, Mail, LogOut,
  Search, ShieldCheck
} from 'lucide-react';
import { searchService, reservationService } from '../services/api';
import { SearchResultItem, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const StudentChatPage: React.FC<{ activeTab?: 'search' | 'reservations' | 'profile' }> = ({ activeTab = 'search' }) => {
  const { user, logout } = useAuth();
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeReservationModalItem, setActiveReservationModalItem] = useState<SearchResultItem | null>(null);
  const [selectedEta, setSelectedEta] = useState<number>(20);
  const [reserving, setReserving] = useState(false);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    timestamp: string;
    text?: string;
    parsedFilters?: any;
    searchResults?: SearchResultItem[];
    reservationConfirmed?: Reservation;
  }

  const popularCategories = [
    { name: 'Stationery', query: 'blue pen under 30' },
    { name: 'Food & Snacks', query: 'Maggi masala noodles' },
    { name: 'Electronics', query: 'USB Type-C cable' },
    { name: 'Printing', query: 'Printout xerox' },
    { name: 'Personal Care', query: 'hand sanitizer' },
  ];

  const initialBotGreeting: ChatMessage = {
    id: 'msg-welcome',
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: `Hello ${user?.full_name || user?.username || 'Student'}! 👋 Welcome to **CampusFind** for **ITER College**.\n\nSearch for stationery, snacks, printouts, or chargers in plain language (e.g. *\"blue pen under ₹30\"*, *\"notebook\"*, or *\"calculator\"*). I will check live inventory across all 20 campus outlets for you!`
  };

  useEffect(() => {
    setMessages([initialBotGreeting]);
    loadMyReservations();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadMyReservations = async () => {
    try {
      const resList = await reservationService.getReservations();
      setMyReservations(resList);
    } catch (e) {
      console.error("Could not load reservations", e);
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await searchService.search(q);
      
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response.count > 0 
          ? `I found **${response.count} item${response.count > 1 ? 's' : ''}** available across ITER campus shops matching **"${response.query}"**:`
          : `⚠️ **This item is not available in any store.**\n\nWe searched across all 20 campus outlets at ITER College, but could not find any active inventory matching **"${response.query}"**. Please check for items like pens, notebooks, calculators, Maggi, coffee, printouts, or phone chargers!`,
        parsedFilters: response.filters,
        searchResults: response.results
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "Apologies, I encountered an issue searching the campus database. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!activeReservationModalItem || reserving) return;
    setReserving(true);

    try {
      const newReservation = await reservationService.create(
        activeReservationModalItem.shop_id,
        [{ product_id: activeReservationModalItem.product_id, quantity: 1 }],
        selectedEta
      );

      // Try opening the WhatsApp deep link automatically
      if (newReservation.whatsapp_link) {
        window.open(newReservation.whatsapp_link, '_blank');
      } else if (newReservation.whatsapp_error === 'MISSING_NUMBER') {
        alert('WhatsApp is not configured for this shop.');
      } else if (newReservation.whatsapp_error === 'INVALID_NUMBER') {
        alert("The shopkeeper's WhatsApp contact is currently unavailable.");
      }

      const confirmMsg: ChatMessage = {
        id: `conf-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `✓ **Order Initiated**\n\nYour request has been initiated with:\n\n**${activeReservationModalItem.shop}**\n\n🛒 ${activeReservationModalItem.product} × 1\n⏱ Within ${selectedEta} minutes\n\nThe shopkeeper has been contacted through WhatsApp.\n\nYou can collect the item once it is ready.`,
        reservationConfirmed: newReservation
      };

      setMessages(prev => [...prev, confirmMsg]);
      setActiveReservationModalItem(null);
      await loadMyReservations();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.[0] || 'Failed to create reservation. Stock might be reserved.');
    } finally {
      setReserving(false);
    }
  };

  const handleCancelReservation = async (resId: number) => {
    if (!window.confirm("Are you sure you want to cancel this reservation? Stock will be released.")) return;
    try {
      const targetRes = myReservations.find(r => r.id === resId);
      await reservationService.cancel(resId);
      
      // WhatsApp notification for cancellation to shopkeeper
      if (targetRes?.shop_phone) {
        const cleanPhone = targetRes.shop_phone.replace(/\D/g, '');
        const cancelText = encodeURIComponent(`❌ *CAMPUSFIND ORDER CANCELLATION*\n\nReservation ID: *${targetRes.reservation_code}*\nStudent: ${user?.full_name || user?.username} (${user?.phone || 'ITER Student'})\nShop: ${targetRes.shop_name}\n\nNotice: This pickup reservation has been cancelled by the student. Any reserved stock has been released.\n\nThank you!`);
        const cancelWaLink = `https://wa.me/91${cleanPhone}?text=${cancelText}`;
        window.open(cancelWaLink, '_blank');
      }

      await loadMyReservations();
    } catch (e) {
      alert("Failed to cancel reservation.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Search Tab View */}
      {activeTab === 'search' && (
        <>
          {/* Active Campus Status Banner */}
          <div className="bg-[#132D46] border border-[#696E79]/30 rounded-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#01C38D]/15 border border-[#01C38D]/30 flex items-center justify-center text-[#01C38D] shadow-[0_0_15px_rgba(1,195,141,0.2)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-tt-demibold text-[#FFFFFF] flex items-center gap-2">
                  ITER Campus Hyperlocal Marketplace
                  <Badge variant="emerald" size="sm">20 Outlets Live</Badge>
                </h1>
                <p className="text-xs text-[#01C38D] font-tt-demibold mt-0.5">
                  Real-time stock check with instant WhatsApp shopkeeper order dispatch
                </p>
              </div>
            </div>

            {myReservations.length > 0 && (
              <div className="flex items-center gap-2 bg-[#191E29] px-4 py-2.5 rounded-xl border border-[#696E79]/30 text-xs font-tt">
                <ShoppingBag className="w-4 h-4 text-[#01C38D]" />
                <span className="text-[#696E79] font-medium">Active Requests:</span>
                <span className="font-tt-demibold text-[#01C38D] text-sm">
                  {myReservations.filter(r => ['PENDING', 'ACCEPTED', 'READY'].includes(r.status)).length}
                </span>
              </div>
            )}
          </div>

          {/* Main Conversational Terminal */}
          <div className="bg-[#132D46] border border-[#696E79]/30 rounded-card flex flex-col h-[670px] shadow-[0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden relative">
            {/* Header bar */}
            <div className="px-6 py-4 border-b border-[#696E79]/20 bg-[#191E29]/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#01C38D] animate-pulse shadow-[0_0_8px_#01C38D]" />
                <span className="text-xs font-tt-demibold text-[#FFFFFF] tracking-wide">Campus Inventory Terminal</span>
              </div>
              <span className="text-xs text-[#696E79] font-tt">
                Connected Student: <strong className="text-[#FFFFFF] font-tt-demibold">{user?.full_name || user?.username}</strong>
              </span>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[11px] font-tt-demibold text-[#696E79]">
                      {msg.sender === 'user' ? user?.full_name || 'You' : 'CampusFind Core'}
                    </span>
                    <span className="text-[10px] text-[#696E79]/70 font-tt">{msg.timestamp}</span>
                  </div>

                  {msg.text && (
                    <div
                      className={`p-4 rounded-2xl max-w-2xl text-sm leading-relaxed font-tt ${
                        msg.sender === 'user'
                          ? 'bg-[#01C38D] text-[#191E29] font-tt-demibold font-bold rounded-tr-none shadow-[0_4px_16px_rgba(1,195,141,0.3)]'
                          : 'bg-[#191E29] border border-[#696E79]/30 text-[#FFFFFF] rounded-tl-none shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {msg.text?.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className={`font-tt-demibold ${msg.sender === 'user' ? 'text-[#191E29]' : 'text-[#FFFFFF]'}`}>{part.slice(2, -2)}</strong>;
                          } else if (part.startsWith('*') && part.endsWith('*')) {
                            return <em key={i} className={`italic ${msg.sender === 'user' ? 'text-[#191E29]' : 'text-[#01C38D]'}`}>{part.slice(1, -1)}</em>;
                          }
                          return part;
                        })}
                      </p>
                    </div>
                  )}

                  {msg.searchResults && msg.searchResults.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                      {msg.searchResults.map((item) => (
                        <div
                          key={`${msg.id}-${item.id}`}
                          className="bg-[#191E29] rounded-card p-4 border border-[#696E79]/30 hover:border-[#01C38D] transition-all duration-200 flex flex-col justify-between group shadow-md"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <Badge variant="emerald" size="sm">
                                  {item.category}
                                </Badge>
                                <h3 className="font-tt-demibold text-[#FFFFFF] text-base mt-1.5 group-hover:text-[#01C38D] transition-colors">
                                  {item.product}
                                </h3>
                                {item.brand && (
                                  <span className="text-xs text-[#696E79] font-tt">Brand: {item.brand}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-tt-demibold text-[#01C38D]">₹{item.price}</span>
                                <div className="text-[11px] text-[#696E79] font-tt">per {item.unit}</div>
                              </div>
                            </div>

                            <p className="text-xs text-[#696E79] font-tt line-clamp-2 mb-3">
                              {item.description || 'In stock and verified at campus shop.'}
                            </p>

                            <div className="space-y-1.5 text-xs text-[#696E79] font-tt mb-4 bg-[#132D46] p-3 rounded-lg border border-[#696E79]/20">
                              <div className="flex items-center gap-1.5 font-tt-demibold text-[#FFFFFF]">
                                <Store className="w-3.5 h-3.5 text-[#01C38D] shrink-0" />
                                <span className="truncate">{item.shop}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <span className="flex items-center gap-1 text-[#696E79]">
                                  <MapPin className="w-3 h-3 text-[#01C38D]" />
                                  {item.location_name}
                                </span>
                                <span className="text-[#01C38D] font-tt-demibold">{item.approx_distance_m}m away</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-[#696E79]/20 text-[11px]">
                                <span className="text-[#696E79]">Available Stock:</span>
                                <span className="font-tt-demibold text-[#01C38D]">
                                  {item.available_quantity} units
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => setActiveReservationModalItem(item)}
                            variant="primary"
                            size="md"
                            className="w-full"
                            icon={<ShoppingBag className="w-4 h-4" />}
                          >
                            <span>Reserve for Pickup</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.reservationConfirmed && (
                    <div className="mt-4 w-full max-w-lg bg-[#191E29] rounded-card p-5 border-2 border-[#01C38D] shadow-[0_0_30px_rgba(1,195,141,0.25)]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-[#01C38D]/20 border border-[#01C38D] flex items-center justify-center text-[#01C38D] shadow-[0_0_15px_rgba(1,195,141,0.3)]">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-tt-demibold uppercase tracking-wider text-[#01C38D]">
                            {msg.reservationConfirmed.status === 'PENDING' ? 'Order Initiated' : 'Order Confirmed ✓'}
                          </span>
                          <h3 className="font-tt-demibold text-[#FFFFFF] text-xl tracking-tight">{msg.reservationConfirmed.reservation_code}</h3>
                        </div>
                      </div>

                      {/* Order summary */}
                      <div className="space-y-2 mb-4 bg-[#132D46] rounded-xl p-3.5 border border-[#696E79]/30 text-xs font-tt">
                        <div className="text-[#696E79] font-medium mb-1">
                          Pickup Request Destination:
                        </div>
                        <div className="font-tt-demibold text-[#FFFFFF] text-sm mb-2">
                          {msg.reservationConfirmed.shop_name}
                        </div>
                        {msg.reservationConfirmed.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-[#FFFFFF]">
                            <span>🛒 {item.product_name} × {item.quantity}</span>
                            <span className="font-tt-demibold text-[#01C38D]">₹{item.unit_price}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-[#696E79]/30 font-tt-demibold text-sm">
                          <span className="text-[#FFFFFF]">Total Amount</span>
                          <span className="text-[#01C38D]">₹{msg.reservationConfirmed.total_amount}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#696E79] pt-1">
                          <span className="flex items-center gap-1">⏱ ETA: Within {msg.reservationConfirmed.pickup_eta_minutes || 20} minutes</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="space-y-3">
                        <p className="text-xs text-[#696E79] font-tt">
                          The shopkeeper has been notified via WhatsApp. You can collect your item once prepared.
                        </p>

                        {msg.reservationConfirmed.whatsapp_link && (
                          <a
                            href={msg.reservationConfirmed.whatsapp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#01C38D] hover:bg-[#00AB7B] text-[#191E29] font-tt-demibold font-bold rounded-input text-sm transition-all shadow-[0_4px_16px_rgba(1,195,141,0.35)] hover:shadow-[0_6px_22px_rgba(1,195,141,0.5)]"
                          >
                            <span>💬 Send WhatsApp Message to Shopkeeper</span>
                          </a>
                        )}

                        {msg.reservationConfirmed.whatsapp_notification_status && (
                          <div className={`p-3 rounded-xl border text-xs font-tt ${
                            msg.reservationConfirmed.whatsapp_notification_status === 'SENT'
                              ? 'bg-[#01C38D]/15 border-[#01C38D]/40 text-[#01C38D] font-tt-demibold'
                              : msg.reservationConfirmed.whatsapp_notification_status === 'NOT_CONFIGURED'
                              ? 'bg-amber-950/40 border-amber-800/30 text-amber-300'
                              : msg.reservationConfirmed.whatsapp_notification_status === 'MOCK'
                              ? 'bg-[#132D46] border-[#696E79]/40 text-[#FFFFFF]'
                              : msg.reservationConfirmed.whatsapp_notification_status === 'PENDING'
                              ? 'bg-[#132D46] border-[#696E79]/40 text-[#696E79]'
                              : 'bg-rose-950/40 border-rose-800/30 text-rose-300'
                          }`}>
                            {msg.reservationConfirmed.whatsapp_notification_status === 'SENT' && '💬 WhatsApp notification successfully sent to shopkeeper.'}
                            {msg.reservationConfirmed.whatsapp_notification_status === 'NOT_CONFIGURED' && '⚠️ WhatsApp delivery is not configured on the server. Please configure WhatsApp Business API credentials.'}
                            {msg.reservationConfirmed.whatsapp_notification_status === 'MOCK' && '🔧 WhatsApp delivery is in mock/development mode. No real message was sent.'}
                            {msg.reservationConfirmed.whatsapp_notification_status === 'FAILED' && '⚠️ WhatsApp delivery failed. Please check backend server logs.'}
                            {msg.reservationConfirmed.whatsapp_notification_status === 'PENDING' && '⏳ Dispatching WhatsApp notification to shopkeeper...'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-[#696E79] text-xs p-4 bg-[#191E29] rounded-2xl max-w-xs border border-[#696E79]/30 font-tt">
                  <Sparkles className="w-4 h-4 text-[#01C38D] animate-spin" />
                  <span className="text-[#FFFFFF]">Searching 20 campus outlets...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Queries Bar */}
            <div className="px-4 py-3 bg-[#191E29]/90 border-t border-[#696E79]/20 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] text-[#696E79] font-tt-demibold whitespace-nowrap">Quick Queries:</span>
              {popularCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleSendQuery(cat.query)}
                  className="px-3 py-1.5 rounded-lg bg-[#132D46] hover:bg-[#1A3B5C] text-[#FFFFFF] hover:text-[#01C38D] text-xs font-tt border border-[#696E79]/30 whitespace-nowrap transition-all shadow-sm"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Input Search Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
              className="p-3.5 sm:p-4 bg-[#132D46] border-t border-[#696E79]/30 flex items-center gap-2.5"
            >
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-[#01C38D] absolute left-4" />
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Search live campus stock (e.g. 'blue pen under ₹30', 'calculator', 'Maggi')..."
                  className="w-full pl-11 pr-4 py-3 bg-[#191E29] text-[#FFFFFF] placeholder-[#696E79] border border-[#696E79]/40 focus:border-[#01C38D] focus:ring-2 focus:ring-[#01C38D]/30 rounded-input text-sm font-medium focus:outline-none transition-all"
                  style={{
                    backgroundColor: '#191E29',
                    color: '#FFFFFF',
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                variant="primary"
                size="md"
                icon={<Send className="w-4 h-4" />}
              >
                <span>Search</span>
              </Button>
            </form>
          </div>
        </>
      )}

      {/* Reservations Tab View */}
      {activeTab === 'reservations' && (
        <div className="bg-[#132D46] border border-[#696E79]/30 rounded-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-tt-demibold text-[#FFFFFF] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#01C38D]" />
                My Campus Reservations
              </h2>
              <p className="text-xs text-[#696E79] font-tt mt-0.5">Track and manage your hyperlocal pickup requests</p>
            </div>
            <button
              onClick={loadMyReservations}
              className="p-2.5 text-[#696E79] hover:text-[#FFFFFF] rounded-xl bg-[#191E29] border border-[#696E79]/30 transition-colors"
              title="Refresh Reservations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {myReservations.length === 0 ? (
            <div className="text-center py-16 text-[#696E79] text-sm font-tt">
              <ShoppingBag className="w-8 h-8 text-[#696E79]/40 mx-auto mb-2" />
              You haven't made any pickup reservations yet. Use the Search tab to reserve items!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReservations.map((res) => (
                <div key={res.id} className="bg-[#191E29] rounded-card p-4 border border-[#696E79]/30 text-xs font-tt flex flex-col justify-between gap-3 shadow-md hover:border-[#01C38D]/60 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-tt-demibold font-mono text-[#01C38D] text-sm">{res.reservation_code}</span>
                      <Badge 
                        variant={
                          res.status === 'COMPLETED' ? 'emerald' :
                          res.status === 'READY' ? 'emerald' :
                          res.status === 'ACCEPTED' ? 'navy' :
                          res.status === 'CANCELLED' ? 'rose' : 'amber'
                        }
                        size="sm"
                      >
                        {res.status}
                      </Badge>
                    </div>
                    <div className="text-[#FFFFFF] font-tt-demibold text-sm">{res.shop_name}</div>
                    <div className="text-[#696E79] text-xs mt-1">
                      Items: {res.items?.map(i => `${i.product_name} ×${i.quantity}`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#696E79]/20">
                    <span className="font-tt-demibold text-[#01C38D] text-sm">Total: ₹{res.total_amount}</span>
                    {['PENDING', 'ACCEPTED'].includes(res.status) && (
                      <button
                        onClick={() => handleCancelReservation(res.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-tt-demibold underline transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab View */}
      {activeTab === 'profile' && (
        <div className="bg-[#132D46] border border-[#696E79]/30 rounded-card p-6 sm:p-8 max-w-xl mx-auto space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#01C38D] flex items-center justify-center text-[#191E29] text-xl font-tt-demibold shadow-[0_0_20px_rgba(1,195,141,0.4)]">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-xl font-tt-demibold text-[#FFFFFF]">{user?.full_name || user?.username}</h2>
              <Badge variant="emerald" size="sm" className="mt-1">
                ITER College Student Account
              </Badge>
            </div>
          </div>

          <div className="bg-[#191E29] p-5 rounded-card border border-[#696E79]/30 space-y-3.5 text-xs font-tt">
            <div className="flex justify-between py-2 border-b border-[#696E79]/20">
              <span className="text-[#696E79] flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-[#01C38D]" />
                Full Name:
              </span>
              <span className="font-tt-demibold text-[#FFFFFF]">{user?.full_name || user?.username}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-[#696E79]/20">
              <span className="text-[#696E79] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#01C38D]" />
                Email Address:
              </span>
              <span className="font-tt-demibold text-[#FFFFFF]">{user?.email || 'Registered'}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-[#696E79]/20">
              <span className="text-[#696E79] flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#01C38D]" />
                Mobile Phone:
              </span>
              <span className="font-tt-demibold text-[#FFFFFF] font-mono">{user?.phone ? `+91 ${user.phone}` : 'Registered'}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-[#696E79]/20">
              <span className="text-[#696E79] flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#01C38D]" />
                Campus Association:
              </span>
              <span className="font-tt-demibold text-[#01C38D]">ITER College (SOA University)</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-[#696E79] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#01C38D]" />
                Member Since:
              </span>
              <span className="text-[#696E79]">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'August 2026'}
              </span>
            </div>
          </div>

          <Button
            onClick={logout}
            variant="danger"
            size="lg"
            className="w-full"
            icon={<LogOut className="w-4 h-4" />}
          >
            <span>Log Out of CampusFind</span>
          </Button>
        </div>
      )}

      {/* Reservation Confirmation Modal */}
      <Modal
        isOpen={!!activeReservationModalItem}
        onClose={() => setActiveReservationModalItem(null)}
        title="Confirm Pickup Request"
        subtitle="Select your arrival timeframe to notify the shopkeeper via WhatsApp."
      >
        {activeReservationModalItem && (
          <div className="space-y-5 font-tt">
            <div className="bg-[#191E29] p-4 rounded-card border border-[#696E79]/30 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-tt-demibold text-[#FFFFFF] text-sm">{activeReservationModalItem.product}</h4>
                  <div className="text-xs text-[#696E79]">{activeReservationModalItem.shop}</div>
                </div>
                <span className="text-lg font-tt-demibold text-[#01C38D]">₹{activeReservationModalItem.price}</span>
              </div>
              <div className="text-xs text-[#696E79] flex items-center gap-1 pt-1.5 border-t border-[#696E79]/20">
                <MapPin className="w-3.5 h-3.5 text-[#01C38D]" />
                <span>{activeReservationModalItem.location_name} ({activeReservationModalItem.approx_distance_m}m away)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-tt-demibold text-[#FFFFFF] mb-2">
                Estimated Arrival Time:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedEta(mins)}
                    className={`py-2.5 rounded-input text-xs font-tt-demibold border transition-all ${
                      selectedEta === mins
                        ? 'bg-[#01C38D] text-[#191E29] border-[#01C38D] shadow-[0_0_12px_rgba(1,195,141,0.3)]'
                        : 'bg-[#132D46] text-[#696E79] border-[#696E79]/40 hover:text-[#FFFFFF]'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleConfirmReservation}
              disabled={reserving}
              loading={reserving}
              variant="primary"
              size="lg"
              className="w-full"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              <span>Confirm & Dispatch via WhatsApp</span>
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
