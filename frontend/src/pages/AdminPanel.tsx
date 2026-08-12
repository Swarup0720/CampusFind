import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Store, Package, Layers, Users, ShoppingBag, 
  Bell, BarChart3, LogOut, Plus, RefreshCw, CheckCircle, AlertTriangle, X, Search 
} from 'lucide-react';
import { adminService, authService } from '../services/api';
import { Shop, Product, InventoryItem, User, Reservation, NotificationLog } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shops' | 'products' | 'inventory' | 'users' | 'reservations' | 'notifications'>('dashboard');

  const [stats, setStats] = useState<any>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Form states for adding new shop & product
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopLocation, setNewShopLocation] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('piece');

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfigStatus | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [st, sh, pr, inv, us, res, notif, waConfig] = await Promise.all([
        adminService.getStats(),
        adminService.getShops(),
        adminService.getProducts(),
        adminService.getInventory(),
        adminService.getUsers(),
        adminService.getReservations(),
        adminService.getNotifications(),
        adminService.getWhatsAppConfigStatus()
      ]);
      setStats(st);
      setShops(sh);
      setProducts(pr);
      setInventory(inv);
      setUsers(us);
      setReservations(res);
      setNotifications(notif);
      setWhatsappConfig(waConfig);
    } catch (e) {
      console.error("Admin Panel data loading error", e);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createShop({
        name: newShopName,
        location_name: newShopLocation,
        phone: newShopPhone,
        college: 1
      });
      setShowAddShopModal(false);
      setNewShopName('');
      setNewShopLocation('');
      setNewShopPhone('');
      await loadAdminData();
    } catch (err) {
      alert("Failed to create shop.");
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createProduct({
        name: newProductName,
        brand: newProductBrand,
        unit: newProductUnit,
        category: 1
      });
      setShowAddProductModal(false);
      setNewProductName('');
      setNewProductBrand('');
      await loadAdminData();
    } catch (err) {
      alert("Failed to create product.");
    }
  };

  const handleAdminLogout = () => {
    logout();
    navigate('/admin-panel/login');
  };

  const filteredUsers = users.filter(u => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Isolated Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-purple-900/50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">CAMPUSFIND ADMIN</span>
            <span className="text-xs text-purple-400 ml-2 font-mono">v1.0 • Control Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">
            Admin: <span className="font-bold text-white">{user?.username}</span>
          </div>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Isolated Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Management</div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'dashboard' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('shops')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'shops' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shops ({shops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'products' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'inventory' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Inventory ({inventory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'users' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Students ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'reservations' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Reservations ({reservations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'notifications' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>WhatsApp Logs ({notifications.length})</span>
          </button>
        </aside>

        {/* Main Admin Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">Platform Analytics & Metrics</h1>
                <button onClick={loadAdminData} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Shops</div>
                  <div className="text-3xl font-extrabold text-white mt-1">{stats?.total_shops || shops.length}</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Products</div>
                  <div className="text-3xl font-extrabold text-purple-400 mt-1">{stats?.total_products || products.length}</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Registered Users</div>
                  <div className="text-3xl font-extrabold text-indigo-400 mt-1">{users.length}</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Completed Revenue</div>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-1">₹{stats?.total_revenue?.toFixed(2) || '0.00'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h2 className="font-bold text-white text-sm">Recent Reservations</h2>
                  {reservations.slice(0, 5).map(r => (
                    <div key={r.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
                      <div>
                        <span className="font-mono font-bold text-indigo-300">{r.reservation_code}</span>
                        <div className="text-slate-400">{r.student_username} @ {r.shop_name}</div>
                      </div>
                      <div className="text-right font-extrabold text-emerald-400">₹{r.total_amount}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h2 className="font-bold text-white text-sm">Recent Notification History</h2>
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono text-indigo-400 font-bold">{n.channel}</span>
                        <span className="text-emerald-400 font-bold text-[10px] uppercase">{n.status}</span>
                      </div>
                      <div className="text-slate-300 font-mono text-[11px] truncate">{n.message.split('\n')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shops Tab */}
          {activeTab === 'shops' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Campus Shops ({shops.length})</h1>
                <button
                  onClick={() => setShowAddShopModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Campus Shop</span>
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Shop Name</th>
                      <th className="p-3.5">Campus Location</th>
                      <th className="p-3.5">WhatsApp Phone</th>
                      <th className="p-3.5">Owner</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {shops.map(s => (
                      <tr key={s.id} className="hover:bg-slate-950/50">
                        <td className="p-3.5 font-mono text-slate-500">#{s.id}</td>
                        <td className="p-3.5 font-bold text-white">{s.name}</td>
                        <td className="p-3.5">{s.location_name}</td>
                        <td className="p-3.5 font-mono text-emerald-400">{s.phone}</td>
                        <td className="p-3.5 text-indigo-300 font-medium">{s.owner_username || 'Assigned'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.is_open ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                            {s.is_open ? 'OPEN' : 'CLOSED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Products Catalog ({products.length})</h1>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 uppercase bg-purple-950 px-2 py-0.5 rounded border border-purple-900">
                        {p.category_name || 'General'}
                      </span>
                      <h3 className="font-bold text-white text-sm mt-1">{p.name}</h3>
                      <div className="text-slate-400 mt-0.5">Brand: {p.brand || 'Generic'}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-slate-500 text-[11px]">
                      <span>Unit: {p.unit}</span>
                      <span className="text-emerald-400 font-semibold">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold text-white">All Campus Inventory ({inventory.length})</h1>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Shop</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Total Stock</th>
                      <th className="p-3.5">Reserved Stock</th>
                      <th className="p-3.5">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {inventory.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-950/50">
                        <td className="p-3.5 font-bold text-white">{inv.product_details?.name || `Product #${inv.product}`}</td>
                        <td className="p-3.5">{inv.shop_name}</td>
                        <td className="p-3.5 font-extrabold text-emerald-400">₹{inv.price}</td>
                        <td className="p-3.5 font-mono">{inv.quantity}</td>
                        <td className="p-3.5 font-mono text-amber-400">{inv.reserved_quantity}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-400">{inv.available_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Roster Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white">Registered Student Roster ({filteredUsers.length})</h1>
                  <p className="text-xs text-slate-400">View and inspect student database records</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search name, email, phone..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Student Full Name</th>
                      <th className="p-3.5">Email Address</th>
                      <th className="p-3.5">Phone Number</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Registered Date</th>
                      <th className="p-3.5">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-950/50">
                        <td className="p-3.5 font-mono text-slate-500">#{u.id}</td>
                        <td className="p-3.5 font-bold text-white">{u.full_name || u.username}</td>
                        <td className="p-3.5 text-slate-300">{u.email || '-'}</td>
                        <td className="p-3.5 font-mono text-emerald-400">{u.phone ? `+91 ${u.phone}` : '-'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                            u.role === 'SHOPKEEPER' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            'bg-indigo-950 text-indigo-400 border border-indigo-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                          {u.last_login ? new Date(u.last_login).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold text-white">All Platform Reservations ({reservations.length})</h1>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Code</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Shop</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {reservations.map(r => (
                      <tr key={r.id} className="hover:bg-slate-950/50">
                        <td className="p-3.5 font-mono font-bold text-indigo-300">{r.reservation_code}</td>
                        <td className="p-3.5 font-semibold text-white">{r.student_username}</td>
                        <td className="p-3.5">{r.shop_name}</td>
                        <td className="p-3.5 font-extrabold text-emerald-400">₹{r.total_amount}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            r.status === 'CANCELLED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-white">WhatsApp Business Integration & Audit Log</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Server-side delivery log via official WhatsApp Business API.
                </p>
              </div>

              {/* WhatsApp Config Banner */}
              <div className={`p-4 rounded-2xl border text-xs ${
                whatsappConfig?.configured
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">CampusFind WhatsApp Business Sender:</span>
                      <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-white font-bold">
                        +{whatsappConfig?.sender_number || '917657094157'}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      {whatsappConfig?.message || 'Checking WhatsApp configuration status...'}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full font-bold uppercase text-[11px] border ${
                    whatsappConfig?.configured
                      ? 'bg-emerald-900 text-emerald-200 border-emerald-700'
                      : 'bg-rose-900 text-rose-200 border-rose-700'
                  }`}>
                    WhatsApp Status: {whatsappConfig?.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                  </span>
                </div>

                {!whatsappConfig?.configured && whatsappConfig?.missing_credentials && whatsappConfig.missing_credentials.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-rose-800/40 text-[11px] space-y-1 font-mono text-rose-200">
                    <p className="font-bold">Missing Environment Credentials in backend/.env:</p>
                    <ul className="list-disc list-inside space-y-0.5 opacity-90">
                      {whatsappConfig.missing_credentials.map((cred) => (
                        <li key={cred}>{cred}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400 text-sm">
                  No notification logs recorded yet. Place an order as a student to trigger a WhatsApp notification.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n.id} className={`bg-slate-900 p-4 rounded-xl border text-xs space-y-3 ${
                      n.status === 'FAILED' ? 'border-rose-800/60' :
                      n.status === 'NOT_CONFIGURED' ? 'border-rose-800/40' :
                      n.status === 'SENT' ? 'border-emerald-800/40' :
                      n.status === 'MOCK' ? 'border-amber-800/40' :
                      'border-slate-800'
                    }`}>
                      {/* Header row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {n.reservation_code && (
                            <span className="font-mono font-bold text-indigo-300 text-sm">{n.reservation_code}</span>
                          )}
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300 font-semibold">{n.shop_name || 'Unknown Shop'}</span>
                          <span className="text-slate-500">•</span>
                          <span className="font-semibold text-slate-400">{n.channel}</span>
                        </div>

                        {/* Status badge */}
                        <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[10px] border ${
                          n.status === 'SENT'           ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                          n.status === 'MOCK'           ? 'bg-amber-950 text-amber-300 border-amber-700' :
                          n.status === 'NOT_CONFIGURED' ? 'bg-rose-950 text-rose-300 border-rose-700' :
                          n.status === 'FAILED'         ? 'bg-rose-950 text-rose-300 border-rose-700' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {n.status === 'SENT' ? '✅ SENT (Delivered)' :
                           n.status === 'NOT_CONFIGURED' ? '⚠️ NOT CONFIGURED' :
                           n.status === 'MOCK' ? '📱 MOCK (Dev Mode)' :
                           n.status === 'FAILED' ? '❌ FAILED' :
                           n.status}
                        </span>
                      </div>

                      {/* Sender + Recipient + timestamps */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                        <span>
                          <span className="text-slate-500">Sender: </span>
                          <span className="font-mono text-purple-300 font-semibold">CampusFind (+91 7657094157)</span>
                        </span>
                        <span>
                          <span className="text-slate-500">Recipient: </span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {n.recipient_phone ? `+${n.recipient_phone}` : 'N/A'}
                          </span>
                        </span>
                        {n.provider_message_id && (
                          <span>
                            <span className="text-slate-500">Provider ID: </span>
                            <span className="font-mono text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {n.provider_message_id}
                            </span>
                          </span>
                        )}
                        <span>
                          <span className="text-slate-500">Created: </span>
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Error or Not Configured Message */}
                      {(n.status === 'FAILED' || n.status === 'NOT_CONFIGURED') && n.error_message && (
                        <div className="bg-rose-950/40 border border-rose-800/50 rounded-lg p-2.5 text-rose-300 font-mono text-[11px]">
                          <span className="text-rose-400 font-bold">Details: </span>{n.error_message}
                        </div>
                      )}

                      {/* Mock notice */}
                      {n.status === 'MOCK' && (
                        <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg p-2 text-amber-300 text-[11px]">
                          ⚠️ Dev mode: No real WhatsApp was sent. Configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env for real delivery.
                        </div>
                      )}

                      {/* Message preview */}
                      <details className="group">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-300 transition-colors select-none text-[11px]">
                          View message content ▾
                        </summary>
                        <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 font-mono whitespace-pre-line leading-relaxed text-[11px]">
                          {n.message}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      {/* Add Shop Modal */}
      {showAddShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Add New Campus Shop</h3>
              <button onClick={() => setShowAddShopModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateShop} className="space-y-3">
              <input type="text" placeholder="Shop Name" value={newShopName} onChange={e=>setNewShopName(e.target.value)} required className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <input type="text" placeholder="Location (e.g. Block 2 Ground Floor)" value={newShopLocation} onChange={e=>setNewShopLocation(e.target.value)} required className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <input type="text" placeholder="WhatsApp Phone (e.g. 9853000021)" value={newShopPhone} onChange={e=>setNewShopPhone(e.target.value)} required className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl text-xs shadow-md">Save Shop</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Add New Catalog Product</h3>
              <button onClick={() => setShowAddProductModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <input type="text" placeholder="Product Name (e.g. Blue Gel Pen)" value={newProductName} onChange={e=>setNewProductName(e.target.value)} required className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <input type="text" placeholder="Brand (e.g. Pilot)" value={newProductBrand} onChange={e=>setNewProductBrand(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl text-xs shadow-md">Save Product</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
