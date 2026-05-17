import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
);

function ProfitLoss() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState({
    sales: 0,
    purchases: 0,
    expenses: 0,
    totalCost: 0,
    netProfit: 0
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Summary Data for selected period
      const [ {data: sData}, {data: pData}, {data: eData} ] = await Promise.all([
        supabase.from('sales').select('total_amount').gte('sale_date', startDate).lte('sale_date', endDate),
        supabase.from('purchases').select('total_amount').gte('purchase_date', startDate).lte('purchase_date', endDate),
        supabase.from('expenses').select('amount').gte('expense_date', startDate).lte('expense_date', endDate)
      ]);

      const totalSales = (sData || []).reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      const totalPurchases = (pData || []).reduce((sum, p) => sum + parseFloat(p.total_amount), 0);
      const totalExpenses = (eData || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalCost = totalPurchases + totalExpenses;

      setFinancials({
        sales: totalSales,
        purchases: totalPurchases,
        expenses: totalExpenses,
        totalCost: totalCost,
        netProfit: totalSales - totalCost
      });

      // 2. Fetch Last 6 Months for Chart
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const dateStr = sixMonthsAgo.toISOString().split('T')[0];

      const [ {data: chartSales}, {data: chartPurchases}, {data: chartExpenses} ] = await Promise.all([
        supabase.from('sales').select('total_amount, sale_date').gte('sale_date', dateStr),
        supabase.from('purchases').select('total_amount, purchase_date').gte('purchase_date', dateStr),
        supabase.from('expenses').select('amount, expense_date').gte('expense_date', dateStr)
      ]);

      // Process monthly data
      const months = [];
      const revenueData = [];
      const profitData = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthKey = d.toISOString().substring(0, 7); // YYYY-MM
        
        months.push(monthName);
        
        const mSales = (chartSales || []).filter(s => s.sale_date.startsWith(monthKey)).reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
        const mPurchases = (chartPurchases || []).filter(p => p.purchase_date.startsWith(monthKey)).reduce((sum, p) => sum + parseFloat(p.total_amount), 0);
        const mExpenses = (chartExpenses || []).filter(e => e.expense_date.startsWith(monthKey)).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        revenueData.push(mSales);
        profitData.push(mSales - (mPurchases + mExpenses));
      }

      setChartData({
        labels: months,
        datasets: [
          {
            type: 'bar',
            label: 'Revenue',
            data: revenueData,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 2,
            borderRadius: 12,
            barThickness: 30,
          },
          {
            type: 'line',
            label: 'Net Profit',
            data: profitData,
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 4,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 3,
          }
        ]
      });

    } catch (error) {
      toast.error('Error calculating financials');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'Outfit', weight: 'bold', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 16,
        titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 13 },
        cornerRadius: 16,
        displayColors: true
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: '#f1f5f9' }, border: { display: false } }
    }
  };

  return (
    <DashboardLayout pageTitle="Profit & Loss">
      {/* Print Header (Visible only during printing) */}
      <div className="hidden print-block mb-10 pb-6 border-b-2 border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Profit & Loss Statement</h1>
            <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest">
              Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Faran Traders</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase italic">Wazirabad Sohdra, Punjab</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10 no-print">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-3">
            <i className="fas fa-chart-line text-emerald-600"></i> Profit & Loss
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Detailed analysis of your business financial health</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-white text-slate-600 px-6 py-4 md:py-3 rounded-2xl font-bold border border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <i className="fas fa-print text-sm"></i> Print Report
        </button>
      </div>

      {/* Date Filter Card */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm mb-6 md:mb-8 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-2xl">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Analysis From</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl md:rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-600/30 focus:outline-none transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Analysis To</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl md:rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-600/30 focus:outline-none transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-b-8 border-indigo-500 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Revenue</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">₨ {financials.sales.toLocaleString()}</h2>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-[10px] bg-emerald-50 w-fit px-3 py-1 rounded-full">
            <i className="fas fa-caret-up"></i> Live Data
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-b-8 border-rose-500 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Cost</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">₨ {financials.totalCost.toLocaleString()}</h2>
          <p className="text-[9px] text-slate-400 font-bold mt-2 truncate">Stock: {financials.purchases.toLocaleString()} | Exp: {financials.expenses.toLocaleString()}</p>
        </div>
        <div className={`bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-b-8 shadow-sm sm:col-span-2 md:col-span-1 ${financials.netProfit >= 0 ? 'border-emerald-500' : 'border-rose-600'}`}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Net Profit</p>
          <h2 className={`text-2xl md:text-3xl font-black ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₨ {financials.netProfit.toLocaleString()}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium mt-2">{financials.netProfit >= 0 ? 'Profitable Period' : 'Loss Period'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        {/* Income Statement Table */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden order-2 lg:order-1 no-print">
          <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base md:text-lg">
              <i className="fas fa-file-invoice-dollar text-indigo-600"></i> Income Statement
            </h3>
          </div>
          <div className="p-4 md:p-8">
            <div className="flex flex-col space-y-2 md:space-y-0">
              {/* Revenue Section */}
              <div className="md:contents">
                <div className="py-3 md:py-4 font-black text-slate-900 uppercase tracking-widest text-[9px] md:text-[10px] border-b border-slate-50 md:border-none">Revenue</div>
                <div className="flex flex-col md:table-row">
                  <div className="flex justify-between items-center py-3 md:py-4 pl-0 md:pl-6 border-b border-slate-50 md:border-none">
                    <span className="text-slate-600 font-medium italic text-xs md:text-sm">Sales Income</span>
                    <span className="font-bold text-slate-900 text-sm md:text-sm">₨ {financials.sales.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 md:py-4 px-4 md:px-6 font-black bg-indigo-50/30 rounded-xl md:rounded-none text-[10px] md:text-xs text-indigo-900 mt-2 md:mt-0">
                  <span className="uppercase tracking-widest md:normal-case md:tracking-normal">Total Revenue</span>
                  <span className="text-indigo-600 md:text-indigo-900">₨ {financials.sales.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-4 md:h-8"></div>

              {/* Costs Section */}
              <div className="md:contents">
                <div className="py-3 md:py-4 font-black text-slate-900 uppercase tracking-widest text-[9px] md:text-[10px] border-b border-slate-50 md:border-none">Costs & Expenses</div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center py-3 md:py-4 pl-0 md:pl-6 border-b border-slate-50 md:border-none">
                    <span className="text-slate-600 font-medium italic text-xs md:text-sm">Purchases (COGS)</span>
                    <span className="font-bold text-slate-900 text-sm md:text-sm">₨ {financials.purchases.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 md:py-4 pl-0 md:pl-6 border-b border-slate-50 md:border-none">
                    <span className="text-slate-600 font-medium italic text-xs md:text-sm">Operating Expenses</span>
                    <span className="font-bold text-slate-900 text-sm md:text-sm">₨ {financials.expenses.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 md:py-4 px-4 md:px-6 font-black bg-rose-50/30 rounded-xl md:rounded-none text-[10px] md:text-xs text-rose-900 mt-2 md:mt-0">
                  <span className="uppercase tracking-widest md:normal-case md:tracking-normal">Total Costs</span>
                  <span className="text-rose-600 md:text-rose-900">₨ {financials.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-8 md:h-12"></div>

              {/* Final Result */}
              <div className={`flex justify-between items-center p-5 md:p-6 rounded-[20px] md:rounded-2xl ${financials.netProfit >= 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-rose-600 text-white shadow-lg shadow-rose-100'}`}>
                <div className="flex flex-col">
                  <span className="font-black text-base md:text-lg tracking-tight">NET RESULT</span>
                  <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Final Profit/Loss</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-2xl md:text-3xl block">₨ {financials.netProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col order-1 lg:order-2 no-print">
          <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base md:text-lg">
              <i className="fas fa-chart-area text-emerald-600"></i> Performance Trends
            </h3>
          </div>
          <div className="p-4 md:p-8 flex-grow min-h-[300px] md:min-h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <style>{`
        @page { size: A4; margin: 15mm; }
        @media print {
          /* Hide EVERYTHING that is not needed */
          .no-print, nav, aside, header, .sidebar, .top-navbar, [class*="Sidebar"], [class*="Navbar"], .no-print * { 
            display: none !important; 
          }
          
          /* Reset layout containers */
          body, html { background: white !important; padding: 0 !important; margin: 0 !important; }
          main, .main-content, .content-wrapper { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100% !important; 
            max-width: 100% !important;
            display: block !important;
          }

          .bg-white { box-shadow: none !important; border: none !important; }
          .rounded-[24px], .rounded-[32px] { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          
          .print-block { display: block !important; }
          
          .grid { display: block !important; }
          .mb-8, .mb-10 { margin-bottom: 2rem !important; }
          
          /* Profit/Loss specific print adjustments */
          .bg-emerald-600 { background-color: #059669 !important; color: white !important; }
          .bg-rose-600 { background-color: #e11d48 !important; color: white !important; }
          .text-emerald-600 { color: #059669 !important; }
          .text-rose-600 { color: #e11d48 !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default ProfitLoss;
