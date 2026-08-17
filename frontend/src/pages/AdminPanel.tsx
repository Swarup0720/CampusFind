import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Store, Package, Layers, Users, ShoppingBag, 
  Bell, BarChart3, LogOut, Plus, RefreshCw, Search 
} from 'lucide-react';
import { adminService } from '../services/api';
import { Shop, Product, InventoryItem, User, Reservation, NotificationLog, WhatsAppConfigStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

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
    <div className="min-h-screen bg-[#191E29] text-[#FFFFFF] flex flex-col font-sans">
      {/* Isolated Admin Header */}
      <header className="sticky top-0 z-40 bg-[#132D46]/95 backdrop-blur-md border-b border-[#696E79]/30 px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#01C38D]/20 border border-[#01C38D] flex items-center justify-center text-[#01C38D] shadow-[0_0_15px_rgba(1,195,141,0.3)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-tt-demibold text-lg text-[#FFFFFF] tracking-tight">CAMPUSFIND ADMIN</span>
            <span className="text-xs text-[#01C38D] ml-2 font-tt-demibold">v1.0 • Control Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[#696E79] font-tt">
            Admin: <span className="font-tt-demibold text-[#FFFFFF]">{user?.username}</span>
          </div>
          <Button
            onClick={handleAdminLogout}
            variant="danger"
            size="sm"
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-[#132D46]/60 border-r border-[#696E79]/30 p-4 space-y-1">
          <div className="text-[11px] font-tt-demibold text-[#696E79] uppercase tracking-wider px-3 mb-2">
            Operations Menu
          </div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-tt-demibold transition-all ${
              activeTab === 'dashboard' ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)] font-bold' : 'text-[#696E79] hover:bg-[#132D46] hover:text-[#FFFFFF]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('shops')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-tt-demibold transition-all ${
              activeTab === 'shops' ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)] font-bold' : 'text-[#696E79] hover:bg-[#132D46] hover:text-[#FFFFFF]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shops ({shops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-tt-demibold transition-all ${
              activeTab === 'products' ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)] font-bold' : 'text-[#696E79] hover:bg-[#132D46] hover:text-[#FFFFFF]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-tt-demibold transition-all ${
              activeTab === 'inventory' ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)] font-bold' : 'text-[#696E79] hover:bg-[#132D46] hover:text-[#FFFFFF]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Inventory ({inventory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-tt-demibold transition-all ${
              activeTab === 'users' ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)] font-bold' : 'text-[#696E79] hover:bg-[#132D46] hover:text-[#FFFFFF]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-tt-demibold transition-all ${
              activeTab === 'reservations' ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)] font-bold' : 'text-[#696E79] hover:bg-[#132D46] hover:text-[#FFFFFF]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Reservations ({reservations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-tt-demibold transition-all ${
              activeTab === 'notifications' ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)] font-bold' : 'text-[#696E79] hover:bg-[#132D46] hover:text-[#FFFFFF]'
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
                <div>
                  <h1 className="text-xl sm:text-2xl font-tt-demibold text-[#FFFFFF]">Platform Analytics & Telemetry</h1>
                  <p className="text-xs text-[#01C38D] font-tt-demibold mt-0.5">Real-time stats across 20 ITER College shops</p>
                </div>
                <button 
                  onClick={loadAdminData} 
                  className="p-2.5 rounded-xl bg-[#132D46] border border-[#696E79]/30 text-[#696E79] hover:text-[#FFFFFF] transition-colors"
                  title="Refresh Metrics"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Campus Shops"
                  value={stats?.total_shops || shops.length}
                  icon={<Store className="w-4 h-4" />}
                />

                <MetricCard
                  label="Total Catalog Items"
                  value={stats?.total_products || products.length}
                  icon={<Package className="w-4 h-4" />}
                />

                <MetricCard
                  label="Registered Students"
                  value={users.length}
                  icon={<Users className="w-4 h-4" />}
                />

                <MetricCard
                  label="Completed Revenue"
                  value={`₹${stats?.total_revenue?.toFixed(2) || '0.00'}`}
                  icon={<ShoppingBag className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card padding="md" className="space-y-3">
                  <h2 className="font-tt-demibold text-[#FFFFFF] text-sm flex items-center justify-between">
                    <span>Recent Reservations</span>
                    <span className="text-xs text-[#01C38D] font-tt font-medium">Live Feed</span>
                  </h2>
                  {reservations.slice(0, 5).map(r => (
                    <div key={r.id} className="p-3 bg-[#191E29] rounded-xl border border-[#696E79]/30 text-xs font-tt flex justify-between items-center">
                      <div>
                        <span className="font-mono font-tt-demibold text-[#01C38D]">{r.reservation_code}</span>
                        <div className="text-[#696E79] text-[11px] mt-0.5">{r.student_username} @ {r.shop_name}</div>
                      </div>
                      <div className="text-right font-tt-demibold text-[#01C38D] text-sm">₹{r.total_amount}</div>
                    </div>
                  ))}
                </Card>

                <Card padding="md" className="space-y-3">
                  <h2 className="font-tt-demibold text-[#FFFFFF] text-sm flex items-center justify-between">
                    <span>Recent WhatsApp Dispatch History</span>
                    <span className="text-xs text-[#01C38D] font-tt font-medium">Cloud Engine</span>
                  </h2>
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} className="p-3 bg-[#191E29] rounded-xl border border-[#696E79]/30 text-xs font-tt space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[#01C38D] font-tt-demibold">{n.channel}</span>
                        <Badge 
                          variant={n.status === 'SENT' ? 'emerald' : n.status === 'FAILED' ? 'rose' : 'amber'} 
                          size="sm"
                        >
                          {n.status}
                        </Badge>
                      </div>
                      <div className="text-[#696E79] font-mono text-[11px] truncate">{n.message.split('\n')[0]}</div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* Shops Tab */}
          {activeTab === 'shops' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-tt-demibold text-[#FFFFFF]">Campus Shops ({shops.length})</h1>
                  <p className="text-xs text-[#696E79] font-tt">Managed retail & stationery outlets on campus</p>
                </div>
                <Button
                  onClick={() => setShowAddShopModal(true)}
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>Add Campus Shop</span>
                </Button>
              </div>

              <div className="bg-[#132D46] rounded-card border border-[#696E79]/30 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                <table className="w-full text-left text-xs font-tt text-[#FFFFFF]">
                  <thead className="bg-[#191E29] border-b border-[#696E79]/30 text-[#696E79] uppercase font-tt-demibold">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Shop Name</th>
                      <th className="p-3.5">Campus Location</th>
                      <th className="p-3.5">WhatsApp Phone</th>
                      <th className="p-3.5">Owner</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#696E79]/20">
                    {shops.map(s => (
                      <tr key={s.id} className="hover:bg-[#191E29]/60 transition-colors">
                        <td className="p-3.5 font-mono text-[#696E79]">#{s.id}</td>
                        <td className="p-3.5 font-tt-demibold text-[#FFFFFF]">{s.name}</td>
                        <td className="p-3.5 text-[#696E79]">{s.location_name}</td>
                        <td className="p-3.5 font-mono text-[#01C38D] font-bold">{s.phone}</td>
                        <td className="p-3.5 text-[#696E79]">{s.owner_username || 'Assigned'}</td>
                        <td className="p-3.5">
                          <Badge variant={s.is_open ? 'emerald' : 'rose'} size="sm">
                            {s.is_open ? 'OPEN' : 'CLOSED'}
                          </Badge>
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
                <div>
                  <h1 className="text-xl font-tt-demibold text-[#FFFFFF]">Products Catalog ({products.length})</h1>
                  <p className="text-xs text-[#696E79] font-tt">Global SKU and inventory catalog</p>
                </div>
                <Button
                  onClick={() => setShowAddProductModal(true)}
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>Add Product</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <Card key={p.id} padding="md" className="text-xs font-tt flex flex-col justify-between shadow-md">
                    <div>
                      <Badge variant="navy" size="sm">
                        {p.category_name || 'General'}
                      </Badge>
                      <h3 className="font-tt-demibold text-[#FFFFFF] text-sm mt-1.5">{p.name}</h3>
                      <div className="text-[#696E79] mt-0.5">Brand: {p.brand || 'Generic'}</div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#696E79]/20 flex justify-between text-[#696E79] text-[11px]">
                      <span>Unit: {p.unit}</span>
                      <span className="text-[#01C38D] font-tt-demibold">Active</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-tt-demibold text-[#FFFFFF]">Campus Inventory Matrix ({inventory.length})</h1>
                <p className="text-xs text-[#696E79] font-tt">Live product stock balances across all 20 outlets</p>
              </div>
              <div className="bg-[#132D46] rounded-card border border-[#696E79]/30 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                <table className="w-full text-left text-xs font-tt text-[#FFFFFF]">
                  <thead className="bg-[#191E29] border-b border-[#696E79]/30 text-[#696E79] uppercase font-tt-demibold">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Shop</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Total Stock</th>
                      <th className="p-3.5">Reserved</th>
                      <th className="p-3.5">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#696E79]/20">
                    {inventory.map(inv => (
                      <tr key={inv.id} className="hover:bg-[#191E29]/60 transition-colors">
                        <td className="p-3.5 font-tt-demibold text-[#FFFFFF]">{inv.product_details?.name || `Product #${inv.product}`}</td>
                        <td className="p-3.5 text-[#696E79]">{inv.shop_name}</td>
                        <td className="p-3.5 font-tt-demibold text-[#01C38D]">₹{inv.price}</td>
                        <td className="p-3.5 font-mono">{inv.quantity}</td>
                        <td className="p-3.5 font-mono text-amber-400">{inv.reserved_quantity}</td>
                        <td className="p-3.5 font-mono font-tt-demibold text-[#01C38D]">{inv.available_quantity}</td>
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
                  <h1 className="text-xl font-tt-demibold text-[#FFFFFF]">Student Directory ({filteredUsers.length})</h1>
                  <p className="text-xs text-[#696E79] font-tt">Database records for registered campus users</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#01C38D] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search student records..."
                    className="w-full pl-10 pr-3 py-2.5 bg-[#191E29] text-[#FFFFFF] placeholder-[#696E79] border border-[#696E79]/40 focus:border-[#01C38D] focus:ring-2 focus:ring-[#01C38D]/30 rounded-input text-xs font-medium focus:outline-none"
                    style={{
                      backgroundColor: '#191E29',
                      color: '#FFFFFF',
                    }}
                  />
                </div>
              </div>

              <div className="bg-[#132D46] rounded-card border border-[#696E79]/30 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                <table className="w-full text-left text-xs font-tt text-[#FFFFFF]">
                  <thead className="bg-[#191E29] border-b border-[#696E79]/30 text-[#696E79] uppercase font-tt-demibold">
                    <tr>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Student Full Name</th>
                      <th className="p-3.5">Email Address</th>
                      <th className="p-3.5">Phone Number</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Registered</th>
                      <th className="p-3.5">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#696E79]/20">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-[#191E29]/60 transition-colors">
                        <td className="p-3.5 font-mono text-[#696E79]">#{u.id}</td>
                        <td className="p-3.5 font-tt-demibold text-[#FFFFFF]">{u.full_name || u.username}</td>
                        <td className="p-3.5 text-[#696E79]">{u.email || '-'}</td>
                        <td className="p-3.5 font-mono text-[#01C38D] font-bold">{u.phone ? `+91 ${u.phone}` : '-'}</td>
                        <td className="p-3.5">
                          <Badge 
                            variant={u.role === 'ADMIN' ? 'emerald' : u.role === 'SHOPKEEPER' ? 'amber' : 'navy'}
                            size="sm"
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-[#696E79]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="p-3.5 font-mono text-[#696E79] text-[11px]">
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
              <div>
                <h1 className="text-xl font-tt-demibold text-[#FFFFFF]">Platform Reservations ({reservations.length})</h1>
                <p className="text-xs text-[#696E79] font-tt">All active and completed student pickup orders</p>
              </div>
              <div className="bg-[#132D46] rounded-card border border-[#696E79]/30 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                <table className="w-full text-left text-xs font-tt text-[#FFFFFF]">
                  <thead className="bg-[#191E29] border-b border-[#696E79]/30 text-[#696E79] uppercase font-tt-demibold">
                    <tr>
                      <th className="p-3.5">Code</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Shop</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#696E79]/20">
                    {reservations.map(r => (
                      <tr key={r.id} className="hover:bg-[#191E29]/60 transition-colors">
                        <td className="p-3.5 font-mono font-tt-demibold text-[#01C38D]">{r.reservation_code}</td>
                        <td className="p-3.5 font-tt-demibold text-[#FFFFFF]">{r.student_username}</td>
                        <td className="p-3.5 text-[#696E79]">{r.shop_name}</td>
                        <td className="p-3.5 font-tt-demibold text-[#01C38D]">₹{r.total_amount}</td>
                        <td className="p-3.5">
                          <Badge 
                            variant={
                              r.status === 'COMPLETED' ? 'emerald' :
                              r.status === 'CANCELLED' ? 'rose' : 'amber'
                            }
                            size="sm"
                          >
                            {r.status}
                          </Badge>
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
                <h1 className="text-xl font-tt-demibold text-[#FFFFFF]">WhatsApp Business Audit Log</h1>
                <p className="text-xs text-[#01C38D] font-tt-demibold mt-0.5">
                  Official WhatsApp Business Cloud API transaction telemetry
                </p>
              </div>

              {/* WhatsApp Config Banner */}
              <div className={`p-5 rounded-card border text-xs font-tt shadow-md ${
                whatsappConfig?.configured
                  ? 'bg-[#132D46] border-[#01C38D] text-[#FFFFFF]'
                  : 'bg-[#132D46] border-rose-800/40 text-rose-300'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-tt-demibold text-sm text-[#FFFFFF]">CampusFind WhatsApp Business Sender:</span>
                      <span className="font-mono bg-[#191E29] px-2.5 py-1 rounded border border-[#696E79]/30 text-[#01C38D] font-tt-demibold">
                        +{whatsappConfig?.sender_number || '917657094157'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#696E79]">
                      {whatsappConfig?.message || 'Checking WhatsApp configuration status...'}
                    </p>
                  </div>

                  <Badge 
                    variant={whatsappConfig?.configured ? 'emerald' : 'rose'} 
                    size="md"
                  >
                    Status: {whatsappConfig?.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                  </Badge>
                </div>

                {!whatsappConfig?.configured && whatsappConfig?.missing_credentials && whatsappConfig.missing_credentials.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-rose-800/40 text-[11px] space-y-1 font-mono text-rose-300">
                    <p className="font-tt-demibold">Missing Credentials in backend/.env:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-rose-400">
                      {whatsappConfig.missing_credentials.map((cred) => (
                        <li key={cred}>{cred}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="bg-[#132D46] rounded-card border border-[#696E79]/30 p-12 text-center text-[#696E79] text-sm font-tt shadow-md">
                  No notification logs recorded yet. Place an order as a student to trigger a WhatsApp notification.
                </div>
              ) : (
                <div className="space-y-3 font-tt">
                  {notifications.map(n => (
                    <Card key={n.id} padding="md" className="space-y-3 text-xs shadow-md">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {n.reservation_code && (
                            <span className="font-mono font-tt-demibold text-[#01C38D] text-sm">{n.reservation_code}</span>
                          )}
                          <span className="text-[#696E79]">•</span>
                          <span className="text-[#FFFFFF] font-tt-demibold">{n.shop_name || 'Campus Outlet'}</span>
                          <span className="text-[#696E79]">•</span>
                          <span className="text-[#696E79]">{n.channel}</span>
                        </div>

                        <Badge 
                          variant={
                            n.status === 'SENT' ? 'emerald' :
                            n.status === 'MOCK' ? 'amber' :
                            n.status === 'NOT_CONFIGURED' ? 'rose' :
                            n.status === 'FAILED' ? 'rose' : 'navy'
                          }
                          size="sm"
                        >
                          {n.status === 'SENT' ? '✅ SENT (Delivered)' :
                           n.status === 'NOT_CONFIGURED' ? '⚠️ NOT CONFIGURED' :
                           n.status === 'MOCK' ? '📱 MOCK (Dev Mode)' :
                           n.status === 'FAILED' ? '❌ FAILED' :
                           n.status}
                        </Badge>
                      </div>

                      {/* Sender + Recipient */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#696E79]">
                        <span>
                          <span>Sender: </span>
                          <span className="font-mono text-[#01C38D] font-tt-demibold">CampusFind (+91 7657094157)</span>
                        </span>
                        <span>
                          <span>Recipient: </span>
                          <span className="font-mono text-[#FFFFFF] font-tt-demibold">
                            {n.recipient_phone ? `+${n.recipient_phone}` : 'N/A'}
                          </span>
                        </span>
                        {n.provider_message_id && (
                          <span>
                            <span>Provider ID: </span>
                            <span className="font-mono text-[#FFFFFF] bg-[#191E29] px-2 py-0.5 rounded border border-[#696E79]/30">
                              {n.provider_message_id}
                            </span>
                          </span>
                        )}
                        <span>
                          <span>Dispatched: </span>
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Message preview */}
                      <details className="group">
                        <summary className="cursor-pointer text-[#696E79] hover:text-[#FFFFFF] transition-colors select-none text-[11px]">
                          View message payload ▾
                        </summary>
                        <div className="mt-2 bg-[#191E29] p-3.5 rounded-lg border border-[#696E79]/30 text-[#FFFFFF] font-mono whitespace-pre-line leading-relaxed text-[11px]">
                          {n.message}
                        </div>
                      </details>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Shop Modal */}
      <Modal
        isOpen={showAddShopModal}
        onClose={() => setShowAddShopModal(false)}
        title="Add Campus Shop"
        subtitle="Register a new retail or stationery outlet on the ITER campus."
      >
        <form onSubmit={handleCreateShop} className="space-y-4 font-tt">
          <Input
            label="Shop Name"
            placeholder="e.g. Campus Stationery & Xerox"
            value={newShopName}
            onChange={e=>setNewShopName(e.target.value)}
            required
          />
          <Input
            label="Campus Location"
            placeholder="e.g. Block 2 Ground Floor"
            value={newShopLocation}
            onChange={e=>setNewShopLocation(e.target.value)}
            required
          />
          <Input
            label="WhatsApp Contact Number"
            placeholder="e.g. 7657094157"
            value={newShopPhone}
            onChange={e=>setNewShopPhone(e.target.value)}
            required
          />
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Register Shop Node
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        title="Add Catalog Product"
        subtitle="Introduce a new SKU to the global campus catalog."
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 font-tt">
          <Input
            label="Product Name"
            placeholder="e.g. Pilot V5 Hi-Tecpoint Blue"
            value={newProductName}
            onChange={e=>setNewProductName(e.target.value)}
            required
          />
          <Input
            label="Brand"
            placeholder="e.g. Pilot"
            value={newProductBrand}
            onChange={e=>setNewProductBrand(e.target.value)}
          />
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Save Product SKU
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
