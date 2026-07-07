import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History as HistoryIcon, Activity, AlertTriangle, CheckCircle, 
  Trash2, Download, Eye, FileText, ChevronLeft, ChevronRight, Search 
} from 'lucide-react';
import api, { classifyError } from '../utils/api';
import { TableSkeleton } from '../components/Skeletons';
import NotificationToast from '../components/NotificationToast';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  // Search, sorting, filtering and pagination state
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Modal / drawer detail inspection state
  const [activeRecord, setActiveRecord] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const skipValue = (page - 1) * limit;
      const res = await api.get('/history', {
        params: {
          skip: skipValue,
          limit: limit,
          risk_level: riskFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          search: search || undefined
        }
      });
      setHistory(res.data);
    } catch (err) {
      setError(classifyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, riskFilter, sortBy, sortOrder]);

  const triggerSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDownloadPDF = async (predId) => {
    try {
      const response = await api.get(`/prediction/${predId}/report/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `cardio_report_${predId}.pdf`;
      link.click();
      setToast({ message: `Report PDF NH-REF-${predId} downloaded.`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to download report PDF.', type: 'error' });
    }
  };

  const handleDownloadCSV = (record) => {
    const headers = ['Telemetry Parameter', 'Value'];
    const rows = Object.entries(record.input_data).map(([k, v]) => [k, v]);
    rows.push(['Risk Probability', `${(record.probability * 100).toFixed(1)}%`]);
    rows.push(['Risk Category', record.risk_level || (record.prediction === 1 ? 'High Risk' : 'Low Risk')]);
    rows.push(['Clinical Severity', record.clinical_severity || 'N/A']);
    rows.push(['Diagnostic Date', new Date(record.timestamp).toLocaleString()]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patient_cardio_data_${record.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: `Telemetry exported for record ID: ${record.id}`, type: 'success' });
  };

  const handleDeleteRecord = async (id) => {
    try {
      await api.delete(`/prediction/${id}`);
      setHistory(history.filter(r => r.id !== id));
      setConfirmDeleteId(null);
      if (activeRecord?.id === id) {
        setActiveRecord(null);
      }
      setToast({ message: 'Diagnostic record deleted.', type: 'success' });
      
      // Re-fetch current page if deleted last item
      if (history.length <= 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchHistory();
      }
    } catch (err) {
      setToast({ message: 'Failed to purge diagnostic record.', type: 'error' });
    }
  };

  return (
    <div className="w-full max-w-6xl p-4 flex flex-col gap-6 relative">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <HistoryIcon className="text-[#00f0ff]" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Prediction History</h2>
          <p className="text-xs text-gray-500 font-medium">Browse, filter, and audit all clinical diagnostic compilation history</p>
        </div>
      </div>

      {/* Grid: Search, filter options */}
      <form onSubmit={triggerSearch} className="flex flex-wrap items-center gap-4 bg-black/40 border border-gray-900 rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-grow min-w-[200px]">
          <input
            type="text"
            placeholder="Search severity, risk level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-9 pr-4 py-2.5 rounded-lg text-xs"
          />
          <Search className="absolute left-3 top-3 text-gray-500" size={14} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            className="input-field px-3 py-2.5 rounded-lg text-xs bg-black text-white outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="High Risk">High Risk</option>
            <option value="Low Risk">Low Risk</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="input-field px-3 py-2.5 rounded-lg text-xs bg-black text-white outline-none cursor-pointer"
          >
            <option value="timestamp">Sort by Date</option>
            <option value="probability">Sort by Risk %</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
            className="input-field px-3 py-2.5 rounded-lg text-xs bg-black text-white outline-none cursor-pointer"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button
            type="submit"
            className="neon-button px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
          >
            Apply Query
          </button>
        </div>
      </form>

      {/* Main content table area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {error && <div className="text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs">{error}</div>}

          {loading ? (
            <TableSkeleton />
          ) : history.length === 0 ? (
            <div className="glass-panel p-12 flex flex-col justify-center items-center text-gray-500 h-96 gap-4">
              <HistoryIcon size={48} className="opacity-20 text-[#7000ff]" />
              <p className="text-sm font-medium">No diagnostic history match found.</p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden border border-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-mono tracking-widest uppercase">
                      <th className="py-3 px-4 font-bold">Reference ID</th>
                      <th className="py-3 px-4 font-bold">Diagnostic Date</th>
                      <th className="py-3 px-4 font-bold">Risk Score</th>
                      <th className="py-3 px-4 font-bold">Severity</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => {
                      const isHigh = record.risk_level === 'High Risk' || record.prediction === 1;
                      return (
                        <motion.tr 
                          key={record.id}
                          className="border-b border-gray-900/50 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setActiveRecord(record)}
                        >
                          <td className="py-3.5 px-4 font-mono text-white">NH-{String(record.id).padStart(5, '0')}</td>
                          <td className="py-3.5 px-4 text-gray-400">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span 
                              className={`flex items-center gap-1.5 font-bold ${isHigh ? 'text-red-400' : 'text-green-400'}`}
                            >
                              {isHigh ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                              {(record.probability * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-gray-300 font-semibold">{record.clinical_severity || (isHigh ? 'Severe' : 'None')}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => setActiveRecord(record)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                                title="Inspect details"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                onClick={() => handleDownloadPDF(record.id)}
                                className="p-1.5 text-gray-400 hover:text-[#00f0ff] rounded-md hover:bg-[#00f0ff]/10 transition-colors"
                                title="Download PDF Report"
                              >
                                <Download size={14} />
                              </button>
                              <button 
                                onClick={() => handleDownloadCSV(record)}
                                className="p-1.5 text-gray-400 hover:text-green-400 rounded-md hover:bg-green-500/10 transition-colors"
                                title="Download CSV Telemetry"
                              >
                                <FileText size={14} />
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(record.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
                                title="Purge record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls */}
              <div className="flex justify-between items-center bg-black/40 border-t border-gray-900 px-4 py-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="input-field px-4 py-2 rounded-lg text-xs flex items-center gap-1 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <span className="text-[10px] text-gray-500 font-mono">PAGE {page}</span>
                <button
                  disabled={history.length < limit}
                  onClick={() => setPage(page + 1)}
                  className="input-field px-4 py-2 rounded-lg text-xs flex items-center gap-1 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Telemetry Inspector Drawer */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeRecord ? (
              <motion.div
                key={activeRecord.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-panel p-5 flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Record Detail</span>
                    <span className="text-sm text-white font-mono">NH-REF-{String(activeRecord.id).padStart(5, '0')}</span>
                  </div>
                  <button 
                    onClick={() => setActiveRecord(null)}
                    className="text-xs text-gray-500 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-col gap-3 font-sans">
                  {/* Status Box */}
                  <div className={`p-3 rounded-lg border flex items-center gap-2.5 ${activeRecord.prediction === 1 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    {activeRecord.prediction === 1 ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider">{activeRecord.risk_level || (activeRecord.prediction === 1 ? 'High Risk' : 'Low Risk')}</span>
                      <span className="text-[10px] text-gray-300 font-mono">PROBABILITY: {(activeRecord.probability * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Telemetry data list */}
                  <div className="flex flex-col gap-2 bg-black/40 border border-gray-900 rounded-xl p-3 max-h-[300px] overflow-y-auto">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest font-bold mb-1 border-b border-gray-950 pb-1">Vitals snapshot</span>
                    {Object.entries(activeRecord.input_data).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs py-0.5 border-b border-gray-900/30">
                        <span className="text-gray-400 uppercase text-[10px] tracking-wider">{key}</span>
                        <span className="text-white font-mono font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel p-8 flex flex-col justify-center items-center text-gray-500 text-center h-48">
                <Eye size={28} className="opacity-20 mb-2 text-[#00f0ff]" />
                <p className="text-xs font-medium">Select a patient row to inspect telemetry data parameters.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel max-w-sm w-full p-6 border-red-500/20 bg-[#0c0c0f]"
            >
              <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={18} /> Confirm Record Purge
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">
                Are you sure you want to permanently delete diagnostic record NH-REF-{String(confirmDeleteId).padStart(5, '0')}? This operation is irreversible and will delete all associated PDF caching files.
              </p>
              <div className="flex gap-3 justify-end text-xs font-bold uppercase tracking-wider">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="input-field px-4 py-2.5 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteRecord(confirmDeleteId)}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast && (
        <NotificationToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default History;
