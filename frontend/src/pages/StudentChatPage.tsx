import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, MapPin, Store, CheckCircle, Clock, 
  ShoppingBag, ArrowRight, X, RefreshCw, User as UserIcon, Phone, Mail, LogOut
} from 'lucide-react';
import { searchService, reservationService } from '../services/api';
import { SearchResultItem, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';

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

      // Determine the WhatsApp notification message based on backend status
      // This is driven by backend data — never hardcoded
      const notifStatus = newReservation.whatsapp_notification_status;
      let notifLine = '';
      if (notifStatus === 'SENT') {
        notifLine = '💬 Real WhatsApp notification sent to shopkeeper (+91 9348957645).';
      } else if (notifStatus === 'NOT_CONFIGURED') {
        notifLine = '⚠️ Order confirmed. Real WhatsApp delivery is not configured. Configure the WhatsApp Business sender credentials before testing.';
      } else if (notifStatus === 'FAILED') {
        notifLine = '⚠️ Order confirmed. Real WhatsApp delivery attempt failed. Check Admin Panel logs for error details.';
      } else if (notifStatus === 'MOCK') {
        notifLine = '🔧 Your order is confirmed. Notification service is currently in test mode.';
      } else {
        notifLine = '✓ Order confirmed. Shopkeeper notification is being processed.';
      }


      const confirmMsg: ChatMessage = {
        id: `conf-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `🎉 **Order Confirmed ✓**\n\n${notifLine}\n\nShow code **${newReservation.reservation_code}** when you collect your item at **${activeReservationModalItem.shop}**.`,
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
      await reservationService.cancel(resId);
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
          {/* Active Campus Banner */}
          <div className="bg-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  ITER Campus Hyperlocal Marketplace
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                    20 Campus Outlets Live
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Search stationery, snacks, printouts, and chargers in real time
                </p>
              </div>
            </div>

            {myReservations.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300 font-medium">Active Reservations:</span>
                <span className="font-bold text-indigo-400">{myReservations.filter(r => ['PENDING', 'ACCEPTED', 'READY'].includes(r.status)).length}</span>
              </div>
            )}
          </div>

          {/* Main Conversational Chatbox */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[660px] shadow-lg overflow-hidden relative">
            <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">Campus Product Search</span>
              </div>
              <span className="text-xs text-slate-400">Student: <strong className="text-white">{user?.full_name || user?.username}</strong></span>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {msg.sender === 'user' ? user?.full_name || 'You' : 'CampusFind Assistant'}
                    </span>
                    <span className="text-[10px] text-slate-600">{msg.timestamp}</span>
                  </div>

                  {msg.text && (
                    <div
                      className={`p-4 rounded-2xl max-w-2xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {msg.text?.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
                          } else if (part.startsWith('*') && part.endsWith('*')) {
                            return <em key={i} className="italic text-indigo-300">{part.slice(1, -1)}</em>;
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
                          className="bg-slate-950 rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                                  {item.category}
                                </span>
                                <h3 className="font-bold text-white text-base mt-1 group-hover:text-indigo-300 transition-colors">
                                  {item.product}
                                </h3>
                                {item.brand && (
                                  <span className="text-xs text-slate-400">Brand: {item.brand}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-emerald-400">₹{item.price}</span>
                                <div className="text-[11px] text-slate-500">per {item.unit}</div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                              {item.description || 'Available in stock at campus shop.'}
                            </p>

                            <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                                <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate">{item.shop}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  {item.location_name}
                                </span>
                                <span className="text-indigo-300 font-semibold">{item.approx_distance_m}m away</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                                <span className="text-slate-400">Available Stock:</span>
                                <span className="font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900">
                                  {item.available_quantity} available
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveReservationModalItem(item)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Reserve for Pickup</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.reservationConfirmed && (
                    <div className="mt-4 w-full max-w-lg bg-slate-950 rounded-2xl p-5 border border-emerald-500/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Order Confirmed ✓</span>
                          <h3 className="font-extrabold text-white text-lg">{msg.reservationConfirmed.reservation_code}</h3>
                        </div>
                      </div>

                      {/* Order summary */}
                      <div className="space-y-2 mb-4 bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs">
                        {msg.reservationConfirmed.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-slate-200">
                            <span>{item.product_name} × {item.quantity}</span>
                            <span className="font-bold text-emerald-400">₹{item.unit_price}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
                          <span className="text-slate-300">Total</span>
                          <span className="text-emerald-400">₹{msg.reservationConfirmed.total_amount}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1"><Store className="w-3 h-3 text-indigo-400" />{msg.reservationConfirmed.shop_name}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" />Pickup in {msg.reservationConfirmed.pickup_eta_minutes || msg.reservationConfirmed.estimated_eta_minutes || 20} mins</span>
                        </div>
                      </div>

                      {/* Notification status */}
                      <div className={`p-3 rounded-xl border text-xs font-medium ${
                        msg.reservationConfirmed.whatsapp_notification_status === 'SENT'
                          ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300'
                          : msg.reservationConfirmed.whatsapp_notification_status === 'NOT_CONFIGURED'
                          ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                          : msg.reservationConfirmed.whatsapp_notification_status === 'MOCK'
                          ? 'bg-amber-950/40 border-amber-800/30 text-amber-300'
                          : msg.reservationConfirmed.whatsapp_notification_status === 'FAILED'
                          ? 'bg-rose-950/40 border-rose-800/30 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        {msg.reservationConfirmed.whatsapp_notification_status === 'SENT' && '💬 Real WhatsApp notification sent to shopkeeper.'}
                        {msg.reservationConfirmed.whatsapp_notification_status === 'NOT_CONFIGURED' && '⚠️ Real WhatsApp delivery is not configured. Configure the WhatsApp Business sender credentials before testing.'}
                        {msg.reservationConfirmed.whatsapp_notification_status === 'MOCK' && '🔧 Your order is confirmed. Notification service is currently in test mode.'}
                        {msg.reservationConfirmed.whatsapp_notification_status === 'FAILED' && '⚠️ Real WhatsApp delivery failed. Check Admin Panel for error logs.'}
                        {(!msg.reservationConfirmed.whatsapp_notification_status || msg.reservationConfirmed.whatsapp_notification_status === 'PENDING') && '✓ Order confirmed. Show your code at pickup!'}
                      </div>

                    </div>
                  )}

                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-slate-400 text-xs p-4 bg-slate-950 rounded-2xl max-w-xs">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Searching campus database...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Queries Bar */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Quick Queries:</span>
              {popularCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleSendQuery(cat.query)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-600/30 text-slate-300 text-xs font-medium border border-slate-800 whitespace-nowrap transition-all"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
              className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Type your search (e.g. 'blue pen under ₹30', 'calculator', 'Maggi')..."
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                <span>Search</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

      {/* Reservations Tab View */}
      {activeTab === 'reservations' && (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                My Campus Reservations
              </h2>
              <p className="text-xs text-slate-400">View and track your product pickup reservations</p>
            </div>
            <button
              onClick={loadMyReservations}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950 border border-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {myReservations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              You haven't made any reservations yet. Use the Search tab to reserve items!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReservations.map((res) => (
                <div key={res.id} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold font-mono text-indigo-300 text-sm">{res.reservation_code}</span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        res.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        res.status === 'READY' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                        res.status === 'ACCEPTED' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                        res.status === 'CANCELLED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                    <div className="text-slate-200 font-bold">{res.shop_name}</div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Items: {res.items?.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="font-extrabold text-emerald-400 text-sm">Total: ₹{res.total_amount}</span>
                    {['PENDING', 'ACCEPTED'].includes(res.status) && (
                      <button
                        onClick={() => handleCancelReservation(res.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold underline"
                      >
                        Cancel Reservation
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
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-600/30">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.full_name || user?.username}</h2>
              <span className="text-xs text-indigo-300 font-medium bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                ITER College Student Account
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                Full Name:
              </span>
              <span className="font-semibold text-white">{user?.full_name || user?.username}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Email Address:
              </span>
              <span className="font-semibold text-white">{user?.email || 'Registered'}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Mobile Phone:
              </span>
              <span className="font-semibold text-white font-mono">{user?.phone ? `+91 ${user.phone}` : 'Registered'}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Campus Association:
              </span>
              <span className="font-semibold text-emerald-400">ITER College (SOA University)</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Member Since:
              </span>
              <span className="font-semibold text-slate-300">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'August 2026'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-3 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-rose-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of CampusFind</span>
          </button>
        </div>
      )}

      {/* Reservation Confirmation Modal Step */}
      {activeReservationModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
            <button
              onClick={() => setActiveReservationModalItem(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              Confirm Product Reservation
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Select your pickup arrival time. Stock will be reserved for you.
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">{activeReservationModalItem.product}</h3>
                  <div className="text-xs text-slate-400">{activeReservationModalItem.shop}</div>
                </div>
                <span className="text-base font-extrabold text-emerald-400">₹{activeReservationModalItem.price}</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{activeReservationModalItem.location_name} ({activeReservationModalItem.approx_distance_m}m)</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                How soon will you arrive at the shop?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedEta(mins)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedEta === mins
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConfirmReservation}
              disabled={reserving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {reserving ? 'Reserving Stock...' : 'Confirm & Reserve Now'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
