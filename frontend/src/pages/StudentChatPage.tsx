import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, MapPin, Store, CheckCircle, Clock, 
  ShoppingBag, ArrowRight, X, RefreshCw, User as UserIcon, Phone, Mail, LogOut,
  Search, ShieldCheck, QrCode, Copy, Check, ExternalLink, CreditCard, ArrowLeft
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
  
  // Checkout & Payment Modal state
  const [activeReservationModalItem, setActiveReservationModalItem] = useState<SearchResultItem | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'SUMMARY' | 'PAYMENT' | 'SUCCESS'>('SUMMARY');
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [upiTransactionRef, setUpiTransactionRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [selectedEta, setSelectedEta] = useState<number>(20);
  const [reserving, setReserving] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    timestamp: string;
    text?: string;
    parsedFilters?: any;
    isClarification?: boolean;
    clarificationQuestion?: string;
    clarificationOptions?: any[];
    context?: any;
    searchResults?: SearchResultItem[];
    reservationConfirmed?: Reservation;
  }

  const popularCategories = [
    { name: 'Stationery', query: 'blue pen' },
    { name: 'Food & Snacks', query: 'paneer roll' },
    { name: 'Pizza', query: 'large veg pizza' },
    { name: 'Notebooks', query: 'notebook' },
    { name: 'Electronics', query: 'USB Type-C cable' },
  ];

  const initialBotGreeting: ChatMessage = {
    id: 'msg-welcome',
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: `Hello ${user?.full_name || user?.username || 'Student'}! 👋 Welcome to **CampusFind** for **ITER College**.\n\nSearch for stationery, rolls, pizzas, snacks, or cables in natural language (e.g. *\"I want a pen\"*, *\"I want a roll\"*, *\"large veg pizza\"*, or *\"notebook\"*). I will check live stock across all 20 campus outlets!`
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
      
      let botText = "";
      if (response.is_clarification) {
        botText = response.clarification_question || "Please choose an option to help me find the exact item:";
      } else if (response.count > 0) {
        const itemLabel = response.matched_variant || response.matched_product || response.query;
        botText = `I found **${response.count} shop${response.count > 1 ? 's' : ''}** with available stock for **"${itemLabel}"**:`;
      } else {
        botText = response.message || `⚠️ **This item is currently unavailable across campus outlets.**`;
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: botText,
        isClarification: response.is_clarification,
        clarificationQuestion: response.clarification_question,
        clarificationOptions: response.clarification_options,
        context: response.context,
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

  const handleSelectClarificationOption = async (option: any, prevContext?: any) => {
    if (loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: option.name
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await searchService.search("", prevContext, option.id);
      
      let botText = "";
      if (response.is_clarification) {
        botText = response.clarification_question || `Please choose a ${option.attribute_name}:`;
      } else if (response.count > 0) {
        const itemLabel = response.matched_variant || response.matched_product || option.name;
        botText = `Here are the available **"${itemLabel}"** across campus shops:`;
      } else {
        botText = response.message || `⚠️ **"${option.name}" is currently out of stock.**`;
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: botText,
        isClarification: response.is_clarification,
        clarificationQuestion: response.clarification_question,
        clarificationOptions: response.clarification_options,
        context: response.context,
        searchResults: response.results
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "Apologies, error processing your option. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReserveModal = (item: SearchResultItem) => {
    setActiveReservationModalItem(item);
    setCheckoutStep('SUMMARY');
    setCurrentReservation(null);
    setUpiTransactionRef('');
    setCopiedUpi(false);
  };

  const handleProceedToPayment = async () => {
    if (!activeReservationModalItem || reserving) return;
    setReserving(true);

    try {
      const newReservation = await reservationService.create(
        activeReservationModalItem.shop_id,
        [{ 
          product_id: activeReservationModalItem.product_id,
          variant_id: activeReservationModalItem.variant_id || null,
          quantity: 1 
        }],
        selectedEta
      );

      setCurrentReservation(newReservation);
      setCheckoutStep('PAYMENT');
      await loadMyReservations();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.[0] || 'Failed to initiate order. Stock might be reserved.');
    } finally {
      setReserving(false);
    }
  };

  const handleConfirmUpiPayment = async () => {
    if (!currentReservation || submittingPayment) return;
    setSubmittingPayment(true);

    try {
      const updatedReservation = await reservationService.submitPayment(
        currentReservation.id,
        upiTransactionRef || 'UPI_PAID',
        'UPI_QR'
      );

      setCurrentReservation(updatedReservation);
      setCheckoutStep('SUCCESS');

      // Post success message in chat stream
      const confirmMsg: ChatMessage = {
        id: `conf-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `✓ **Payment Submitted & Order Placed!**\n\nYour order has been submitted with **Payment Confirmed** to:\n\n**${updatedReservation.shop_name}**\n\n🛒 ${activeReservationModalItem?.product || 'Item'} × 1\n💳 Payment: UPI (UTR: ${upiTransactionRef || 'Verified'})\n⏱ Pickup Within: ${updatedReservation.pickup_eta_minutes || 20} minutes\n\nThe shopkeeper has received the order with payment details.`,
        reservationConfirmed: updatedReservation
      };

      setMessages(prev => [...prev, confirmMsg]);
      await loadMyReservations();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit payment confirmation.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCopyUpi = (upiId: string) => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
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

                  {/* Interactive Clarification Option Chips */}
                  {msg.isClarification && msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2.5 max-w-2xl bg-[#191E29]/80 p-3.5 rounded-2xl border border-[#01C38D]/40 shadow-md">
                      <div className="w-full text-[11px] font-tt-demibold text-[#01C38D] mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#01C38D]" />
                        <span>Select an option:</span>
                      </div>
                      {msg.clarificationOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectClarificationOption(opt, msg.context)}
                          className="px-4 py-2 bg-[#132D46] hover:bg-[#01C38D] text-[#FFFFFF] hover:text-[#191E29] border border-[#696E79]/40 hover:border-[#01C38D] rounded-xl text-xs font-tt-demibold transition-all duration-150 shadow-sm hover:shadow-[0_4px_12px_rgba(1,195,141,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#01C38D]" />
                          <span>{opt.name}</span>
                        </button>
                      ))}
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
                            onClick={() => handleOpenReserveModal(item)}
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
                            {msg.reservationConfirmed.status === 'PAYMENT_SUBMITTED' ? 'Payment Submitted ✓' : msg.reservationConfirmed.status === 'PENDING' ? 'Order Initiated' : 'Order Confirmed ✓'}
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
                        {msg.reservationConfirmed.payment_reference && (
                          <div className="flex justify-between text-[11px] text-[#01C38D] pt-1">
                            <span>💳 Payment Reference:</span>
                            <span className="font-mono">{msg.reservationConfirmed.payment_reference}</span>
                          </div>
                        )}
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

      {/* Multi-Step Checkout & UPI QR Payment Modal */}
      <Modal
        isOpen={!!activeReservationModalItem}
        onClose={() => {
          setActiveReservationModalItem(null);
          setCheckoutStep('SUMMARY');
        }}
        title={
          checkoutStep === 'SUMMARY' ? "Order Summary & Pickup Details" :
          checkoutStep === 'PAYMENT' ? "UPI Payment & QR Code" :
          "Order Confirmation"
        }
        subtitle={
          checkoutStep === 'SUMMARY' ? "Review your requested item, campus outlet, and pickup ETA." :
          checkoutStep === 'PAYMENT' ? "Scan the shopkeeper's QR code or pay via any UPI app." :
          "Your pickup order has been recorded with Payment Submitted status."
        }
      >
        {activeReservationModalItem && (
          <div className="space-y-5 font-tt text-xs">
            {/* Step 1: Order Summary */}
            {checkoutStep === 'SUMMARY' && (
              <div className="space-y-4">
                <div className="bg-[#191E29] p-4 rounded-card border border-[#696E79]/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="emerald" size="sm">
                        {activeReservationModalItem.category}
                      </Badge>
                      <h4 className="font-tt-demibold text-[#FFFFFF] text-base mt-1">
                        {activeReservationModalItem.product}
                      </h4>
                      {activeReservationModalItem.brand && (
                        <div className="text-[#696E79] text-xs">Brand: {activeReservationModalItem.brand}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-tt-demibold text-[#01C38D]">₹{activeReservationModalItem.price}</span>
                      <div className="text-[11px] text-[#696E79]">per {activeReservationModalItem.unit}</div>
                    </div>
                  </div>

                  <div className="bg-[#132D46] p-3 rounded-xl border border-[#696E79]/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-tt-demibold text-[#FFFFFF]">
                      <Store className="w-3.5 h-3.5 text-[#01C38D]" />
                      <span>{activeReservationModalItem.shop}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#696E79]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#01C38D]" />
                        {activeReservationModalItem.location_name}
                      </span>
                      <span className="text-[#01C38D] font-tt-demibold">{activeReservationModalItem.approx_distance_m}m away</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-tt-demibold text-[#FFFFFF] mb-2">
                    Estimated Pickup Timeframe:
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
                        Within {mins} mins
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#191E29] p-3.5 rounded-xl border border-[#696E79]/30 space-y-1.5">
                  <div className="flex justify-between text-[#696E79]">
                    <span>Item Subtotal:</span>
                    <span>₹{activeReservationModalItem.price}</span>
                  </div>
                  <div className="flex justify-between text-[#696E79]">
                    <span>Campus Convenience Fee:</span>
                    <span className="text-[#01C38D]">₹0 (Free)</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#696E79]/30 font-tt-demibold text-sm text-[#FFFFFF]">
                    <span>Total Amount Payable:</span>
                    <span className="text-[#01C38D] text-base">₹{activeReservationModalItem.price}</span>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToPayment}
                  disabled={reserving}
                  loading={reserving}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={<CreditCard className="w-4 h-4" />}
                >
                  <span>Proceed to UPI Payment &rarr;</span>
                </Button>
              </div>
            )}

            {/* Step 2: Payment Page & QR Code */}
            {checkoutStep === 'PAYMENT' && currentReservation && (
              <div className="space-y-4">
                {/* Total amount header */}
                <div className="bg-[#01C38D]/10 border border-[#01C38D]/40 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#01C38D]" />
                    <span className="font-tt-demibold text-[#FFFFFF] text-sm">Scan & Pay via UPI</span>
                  </div>
                  <span className="text-xl font-tt-demibold text-[#01C38D]">₹{currentReservation.total_amount}</span>
                </div>

                {/* QR Code Container */}
                <div className="bg-[#FFFFFF] p-4 rounded-2xl flex flex-col items-center justify-center text-[#191E29] shadow-lg border border-[#01C38D]/30 max-w-[260px] mx-auto">
                  {/* Custom Uploaded QR or Dynamic UPI QR Code */}
                  <img
                    src={
                      currentReservation.shop_qr_code_image ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        currentReservation.upi_payment_uri ||
                        `upi://pay?pa=${currentReservation.shop_upi_id || '9853000001@paytm'}&pn=${encodeURIComponent(currentReservation.shop_name)}&am=${currentReservation.total_amount}&cu=INR&tn=Order_${currentReservation.reservation_code}`
                      )}&margin=4`
                    }
                    alt="Shopkeeper UPI QR Code"
                    className="w-48 h-48 rounded-lg shadow-sm object-contain"
                  />
                  <div className="flex items-center gap-2 mt-2.5 opacity-80">
                    <span className="text-[10px] font-bold tracking-widest text-[#191E29] uppercase">GPay • PhonePe • Paytm • BHIM</span>
                  </div>
                </div>

                {/* Shopkeeper UPI details */}
                <div className="bg-[#191E29] p-3.5 rounded-xl border border-[#696E79]/30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#696E79]">Shop Payee:</span>
                    <strong className="text-[#FFFFFF] font-tt-demibold">{currentReservation.shop_upi_name || currentReservation.shop_name}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#696E79]">Shopkeeper UPI ID:</span>
                    <div className="flex items-center gap-1.5">
                      <code className="bg-[#132D46] px-2 py-1 rounded text-[#01C38D] font-mono text-[11px] font-bold">
                        {currentReservation.shop_upi_id || `${currentReservation.shop_phone}@upi`}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyUpi(currentReservation.shop_upi_id || `${currentReservation.shop_phone}@upi`)}
                        className="p-1 rounded bg-[#132D46] hover:bg-[#01C38D] text-[#696E79] hover:text-[#191E29] transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-[#01C38D]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {copiedUpi && (
                    <div className="text-[11px] text-[#01C38D] text-right font-tt-demibold">✓ UPI ID copied to clipboard!</div>
                  )}
                </div>

                {/* Mobile Pay Link */}
                {currentReservation.upi_payment_uri && (
                  <a
                    href={currentReservation.upi_payment_uri}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#132D46] hover:bg-[#1A3B5C] text-[#01C38D] border border-[#01C38D]/40 rounded-input font-tt-demibold text-xs transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Installed UPI App on Mobile</span>
                  </a>
                )}

                {/* UPI Reference / UTR Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-tt-demibold text-[#FFFFFF]">
                    Enter 12-Digit UPI Transaction ID / UTR (Optional):
                  </label>
                  <input
                    type="text"
                    value={upiTransactionRef}
                    onChange={(e) => setUpiTransactionRef(e.target.value)}
                    placeholder="e.g. 423871928341 or leave empty"
                    className="w-full px-3 py-2.5 bg-[#191E29] text-[#FFFFFF] placeholder-[#696E79] border border-[#696E79]/40 focus:border-[#01C38D] focus:ring-2 focus:ring-[#01C38D]/30 rounded-input text-xs font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-[#696E79]">Found in your UPI app receipt under Transaction Details.</p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <Button
                    onClick={() => setCheckoutStep('SUMMARY')}
                    variant="secondary"
                    size="md"
                    className="w-1/3"
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={handleConfirmUpiPayment}
                    disabled={submittingPayment}
                    loading={submittingPayment}
                    variant="primary"
                    size="md"
                    className="w-2/3"
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    <span>I Have Paid • Confirm Order</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Success State */}
            {checkoutStep === 'SUCCESS' && currentReservation && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-2xl bg-[#01C38D]/20 border-2 border-[#01C38D] flex items-center justify-center text-[#01C38D] mx-auto shadow-[0_0_25px_rgba(1,195,141,0.4)]">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div>
                  <Badge variant="emerald" size="sm">
                    STATUS: PAYMENT SUBMITTED
                  </Badge>
                  <h3 className="font-tt-demibold text-[#FFFFFF] text-xl tracking-tight mt-2">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-[#696E79] mt-1">
                    Your pickup request code: <strong className="text-[#01C38D] font-mono text-sm">{currentReservation.reservation_code}</strong>
                  </p>
                </div>

                <div className="bg-[#191E29] p-4 rounded-xl border border-[#696E79]/30 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#696E79]">Outlet:</span>
                    <span className="font-tt-demibold text-[#FFFFFF]">{currentReservation.shop_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#696E79]">Amount Paid:</span>
                    <span className="font-tt-demibold text-[#01C38D]">₹{currentReservation.total_amount}</span>
                  </div>
                  {upiTransactionRef && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#696E79]">UPI UTR:</span>
                      <span className="font-mono text-[#FFFFFF]">{upiTransactionRef}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-1 border-t border-[#696E79]/20">
                    <span className="text-[#696E79]">Pickup ETA:</span>
                    <span className="font-tt-demibold text-[#FFFFFF]">Within {currentReservation.pickup_eta_minutes || 20} mins</span>
                  </div>
                </div>

                {currentReservation.whatsapp_link && (
                  <a
                    href={currentReservation.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#01C38D] hover:bg-[#00AB7B] text-[#191E29] font-tt-demibold font-bold rounded-input text-sm transition-all shadow-[0_4px_16px_rgba(1,195,141,0.35)]"
                  >
                    <span>💬 Open WhatsApp Alert to Shopkeeper</span>
                  </a>
                )}

                <Button
                  onClick={() => {
                    setActiveReservationModalItem(null);
                    setCheckoutStep('SUMMARY');
                  }}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  <span>Done & Return to Chat</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
