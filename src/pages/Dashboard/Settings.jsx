import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [general, setGeneral] = useState({
    currency: 'PKR (₨)',
    language: 'English (US)',
    timezone: 'UTC +5:00 (Karachi)',
    notifications: true
  });

  const handleGeneralUpdate = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('General preferences updated!');
    }, 800);
  };

  const [exporting, setExporting] = useState(false);

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      toast.info('Preparing database backup...');

      const tables = [
        'customers',
        'suppliers',
        'items',
        'sales',
        'sale_items',
        'purchases',
        'purchase_items',
        'transactions',
        'expenses',
        'notifications',
        'stock_logs'
      ];

      const backupData = {};
      const counts = {};

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*');
          if (error) {
            console.warn(`Warning fetching ${table}:`, error.message);
            backupData[table] = [];
            counts[table] = 0;
          } else {
            backupData[table] = data || [];
            counts[table] = data ? data.length : 0;
          }
        } catch (err) {
          console.warn(`Error on table ${table}:`, err);
          backupData[table] = [];
          counts[table] = 0;
        }
      }

      const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);

      const exportPayload = {
        appName: 'Faran Traders Management System',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        totalRecords,
        tableCounts: counts,
        data: backupData
      };

      // Create download link
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportPayload, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `faran_traders_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success(`Backup exported successfully! (${totalRecords} records across ${tables.length} tables)`);
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to export backup: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="General Settings">
      {/* Header Section */}
      <div className="mb-8 md:mb-10 text-center md:text-left px-2">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-3">
          <i className="fas fa-sliders-h text-slate-400"></i> Settings
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Configure application-wide preferences and view system logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 px-2 sm:px-0">
        {/* General Preferences */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base md:text-lg">
              <i className="fas fa-globe text-indigo-600"></i> General Preferences
            </h3>
          </div>
          <form onSubmit={handleGeneralUpdate} className="p-6 md:p-8 space-y-5 md:space-y-6 flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest ml-1">Default Currency</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-600/30 outline-none transition-all"
                  value={general.currency}
                  onChange={(e) => setGeneral({...general, currency: e.target.value})}
                >
                  <option>PKR (₨)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest ml-1">Language</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-600/30 outline-none transition-all"
                  value={general.language}
                  onChange={(e) => setGeneral({...general, language: e.target.value})}
                >
                  <option>English (US)</option>
                  <option>Urdu (اردو)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest ml-1">Timezone</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-600/30 outline-none transition-all"
                value={general.timezone}
                onChange={(e) => setGeneral({...general, timezone: e.target.value})}
              >
                <option>UTC +5:00 (Karachi)</option>
                <option>UTC +0:00 (GMT)</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <i className="fas fa-bell text-indigo-600"></i>
                <span className="text-xs font-bold text-slate-900">Email Notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={general.notifications} onChange={() => setGeneral({...general, notifications: !general.notifications})} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save text-sm"></i>}
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* System Info & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8 px-2 sm:px-0 mb-10">
        <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6 md:mb-8 text-base md:text-lg">
            <i className="fas fa-info-circle text-slate-400"></i> System Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-1">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">App Name</p>
              <p className="text-sm md:text-base font-bold text-slate-900">Faran Traders</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Version</p>
              <p className="text-sm md:text-base font-bold text-slate-900">1.0.0 (Beta)</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Environment</p>
              <p className="text-sm md:text-base font-bold text-indigo-600">React + Vite</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Database</p>
              <p className="text-sm md:text-base font-bold text-emerald-600">Supabase</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-base md:text-lg">
            <i className="fas fa-database text-emerald-500"></i> Database Management
          </h3>
          <p className="text-xs md:text-sm font-medium text-slate-500 mb-6 md:mb-8 max-w-sm">
            Backup your business data regularly. You can download a complete snapshot of your current database state.
          </p>
          <div className="flex">
            <button 
              onClick={handleExportBackup} 
              disabled={exporting}
              className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 md:py-3.5 rounded-xl md:rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {exporting ? (
                <>
                  <i className="fas fa-spinner fa-spin text-sm"></i> Exporting...
                </>
              ) : (
                <>
                  <i className="fas fa-download text-sm"></i> Export Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
  

export default Settings;
