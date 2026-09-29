import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function DashboardHome() {
  const { user } = useAuth();

  // Helper to read initial cache for instant 0ms load
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem('ft_dashboard_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const initialCache = getCachedData();
  const [loading, setLoading] = useState(!initialCache);
  const [syncing, setSyncing] = useState(false);

  const [stats, setStats] = useState(initialCache?.stats || [
    { label: 'Total Receivable', val: '₨ 0', icon: 'fa-arrow-down', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Money to Receive' },
    { label: 'Total Payable', val: '₨ 0', icon: 'fa-arrow-up', color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Money to Pay' },
    { label: 'Net Balance', val: '₨ 0', icon: 'fa-wallet', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Receivable - Payable' },
    { label: 'Stock Alerts', val: '0 Items', icon: 'fa-bell', color: 'text-violet-600', bg: 'bg-violet-50', desc: 'All Levels Healthy' }
  ]);

  const [topCustomers, setTopCustomers] = useState(initialCache?.topCustomers || []);
  const [topSuppliers, setTopSuppliers] = useState(initialCache?.topSuppliers || []);
  const [lowStock, setLowStock] = useState(initialCache?.lowStock || []);
  const [outOfStock, setOutOfStock] = useState(initialCache?.outOfStock || []);

  const fetchData = async () => {
    try {
      setSyncing(true);

      // Only 3 consolidated parallel queries instead of 7
      const [
        { data: customers, error: cErr },
        { data: suppliers, error: sErr },
        { data: items, error: iErr }
      ] = await Promise.all([
        supabase.from('customers').select('id, name, city, current_balance'),
        supabase.from('suppliers').select('id, name, city, current_balance'),
        supabase.from('items').select('id, name, category, unit, current_stock, min_stock_alert')
      ]);

      if (cErr) console.warn('Customer query:', cErr.message);
      if (sErr) console.warn('Supplier query:', sErr.message);
      if (iErr) console.warn('Items query:', iErr.message);

      const custList = customers || [];
      const suppList = suppliers || [];
      const itemList = items || [];

      // Calculate totals in-memory
      const totalRec = custList.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0);
      const totalPay = suppList.reduce((sum, s) => sum + parseFloat(s.current_balance || 0), 0);

      // In-memory stock calculations
      const low = itemList.filter(item => {
        const stock = parseFloat(item.current_stock || 0);
        const minAlert = parseFloat(item.min_stock_alert || 10);
        return stock > 0 && stock <= minAlert;
      }).slice(0, 5);

      const out = itemList.filter(item => parseFloat(item.current_stock || 0) <= 0).slice(0, 5);
      const lowStockCount = low.length + out.length;

      const newStats = [
        { label: 'Total Receivable', val: `₨ ${totalRec.toLocaleString()}`, icon: 'fa-arrow-down', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Money to Receive' },
        { label: 'Total Payable', val: `₨ ${totalPay.toLocaleString()}`, icon: 'fa-arrow-up', color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Money to Pay' },
        { label: 'Net Balance', val: `₨ ${(totalRec - totalPay).toLocaleString()}`, icon: 'fa-wallet', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Receivable - Payable' },
        { label: 'Stock Alerts', val: `${lowStockCount} Items`, icon: 'fa-bell', color: lowStockCount > 0 ? 'text-rose-600' : 'text-violet-600', bg: lowStockCount > 0 ? 'bg-rose-50' : 'bg-violet-50', desc: lowStockCount > 0 ? 'Urgent Action Needed' : 'All Levels Healthy' }
      ];

      // In-memory top party sorting
      const topCust = custList
        .filter(c => parseFloat(c.current_balance || 0) > 0)
        .sort((a, b) => parseFloat(b.current_balance || 0) - parseFloat(a.current_balance || 0))
        .slice(0, 1);

      const topSupp = suppList
        .filter(s => parseFloat(s.current_balance || 0) > 0)
        .sort((a, b) => parseFloat(b.current_balance || 0) - parseFloat(a.current_balance || 0))
        .slice(0, 1);

      setStats(newStats);
      setTopCustomers(topCust);
      setTopSuppliers(topSupp);
      setLowStock(low);
      setOutOfStock(out);

      // Save to cache for instant future loads
      try {
        localStorage.setItem(
          'ft_dashboard_cache',
          JSON.stringify({
            stats: newStats,
            topCustomers: topCust,
            topSuppliers: topSupp,
            lowStock: low,
            outOfStock: out,
            timestamp: Date.now()
          })
        );
      } catch (cacheErr) {
        console.warn('Cache save error:', cacheErr);
      }
    } catch (error) {
      toast.error('Error loading dashboard: ' + error.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardLayout pageTitle="Dashboard">
      {/* Welcome Section */}
      <div className="mb-8 md:mb-10 text-center md:text-left px-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            Welcome back, <span className="text-indigo-600 underline decoration-indigo-100 underline-offset-8">{user?.user_metadata?.full_name || 'Admin'}</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-sm md:text-lg">Faran Traders Inventory Management System</p>
        </div>
        <button
          onClick={fetchData}
          className="bg-white border border-slate-100 p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm flex items-center justify-center cursor-pointer"
          title="Refresh Data"
        >
          <i className={`fas fa-sync-alt ${syncing ? 'animate-spin text-indigo-600' : ''}`}></i>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 px-2 sm:px-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 md:p-7 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-xl`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">Live</span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-3 truncate tracking-tighter">{stat.val}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text', 'bg')}`}></div>
              <p className={`text-[10px] md:text-xs font-bold ${stat.color}`}>{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 px-2 sm:px-0 mb-10">
        {/* Top Customers */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
          <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-base md:text-lg uppercase tracking-tight">
              <i className="fas fa-user-star text-indigo-600"></i> Top Customer
            </h3>
            <Link to="/customers" className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-50 transition-all uppercase tracking-widest shadow-sm">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-8 py-4">Location</th>
                  <th className="px-8 py-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50 flex flex-col md:table-row-group">
                {topCustomers.length === 0 ? (
                  <tr><td colSpan="3" className="px-8 py-10 text-center text-slate-400 font-medium italic">No customer data found</td></tr>
                ) : (
                  topCustomers.map((row, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors flex flex-col md:table-row p-4 md:p-0">
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</span>
                        <div className="font-black text-slate-900">{row.name}</div>
                      </td>
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                        <div className="text-slate-500 font-bold">{row.city || 'N/A'}</div>
                      </td>
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell md:text-right border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                        <span className="text-rose-600 font-black bg-rose-50 px-3 py-1 rounded-full text-[10px] md:text-xs">₨ {parseFloat(row.current_balance).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
          <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-base md:text-lg uppercase tracking-tight">
              <i className="fas fa-truck-loading text-emerald-600"></i> Top Supplier
            </h3>
            <Link to="/suppliers" className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-emerald-600 hover:bg-emerald-50 transition-all uppercase tracking-widest shadow-sm">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Supplier</th>
                  <th className="px-8 py-4">Location</th>
                  <th className="px-8 py-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50 flex flex-col md:table-row-group">
                {topSuppliers.length === 0 ? (
                  <tr><td colSpan="3" className="px-8 py-10 text-center text-slate-400 font-medium italic">No supplier data found</td></tr>
                ) : (
                  topSuppliers.map((row, i) => (
                    <tr key={i} className="hover:bg-emerald-50/30 transition-colors flex flex-col md:table-row p-4 md:p-0">
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</span>
                        <div className="font-black text-slate-900">{row.name}</div>
                      </td>
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                        <div className="text-slate-500 font-bold">{row.city || 'N/A'}</div>
                      </td>
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell md:text-right border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                        <span className="text-rose-600 font-black bg-rose-50 px-3 py-1 rounded-full text-[10px] md:text-xs">₨ {parseFloat(row.current_balance).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
          <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-base md:text-lg uppercase tracking-tight">
              <i className="fas fa-exclamation-triangle text-amber-500"></i> Low Stock
            </h3>
            <Link to="/items" className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-amber-600 hover:bg-amber-50 transition-all uppercase tracking-widest shadow-sm">Manage</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Item Name</th>
                  <th className="px-8 py-4 text-right">In Stock</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50 flex flex-col md:table-row-group">
                {lowStock.length === 0 ? (
                  <tr><td colSpan="2" className="px-8 py-10 text-center text-slate-400 font-medium italic">No low stock items</td></tr>
                ) : (
                  lowStock.map((row, i) => (
                    <tr key={i} className="hover:bg-amber-50/30 transition-colors flex flex-col md:table-row p-4 md:p-0">
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</span>
                        <div className="font-black text-slate-900">{row.name}</div>
                      </td>
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell md:text-right border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</span>
                        <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] md:text-xs font-black">{row.current_stock} {row.unit}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Out of Stock Items */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
          <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-base md:text-lg uppercase tracking-tight">
              <i className="fas fa-times-circle text-rose-600"></i> Out of Stock
            </h3>
            <Link to="/items" className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-rose-600 hover:bg-rose-50 transition-all uppercase tracking-widest shadow-sm">Restock</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Item Name</th>
                  <th className="px-8 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50 flex flex-col md:table-row-group">
                {outOfStock.length === 0 ? (
                  <tr><td colSpan="2" className="px-8 py-10 text-center text-slate-400 font-medium italic">No items out of stock</td></tr>
                ) : (
                  outOfStock.map((row, i) => (
                    <tr key={i} className="hover:bg-rose-50/30 transition-colors flex flex-col md:table-row p-4 md:p-0">
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</span>
                        <div className="font-black text-slate-900">{row.name}</div>
                      </td>
                      <td className="px-0 md:px-8 py-1 md:py-5 flex justify-between items-center md:table-cell md:text-right border-none">
                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">Empty</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DashboardHome;


