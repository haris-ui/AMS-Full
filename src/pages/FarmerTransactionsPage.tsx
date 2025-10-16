import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, FileText, TrendingUp, TrendingDown, DollarSign, Calendar, Search, Filter } from 'lucide-react';
import { simpleInvoiceGenerator } from '../utils/simpleInvoiceGenerator';
import type { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Farmer = Database['public']['Tables']['farmers']['Row'];
type Purchase = Database['public']['Tables']['purchases']['Row'];
type CropSale = Database['public']['Tables']['crop_sales']['Row'];

interface TransactionWithDetails extends Transaction {
  purchases?: Purchase;
  crop_sales?: CropSale;
}

interface FarmerBalance {
  farmer_id: number;
  farmer_name: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

interface Props {
  farmerId?: number;
  onBack?: () => void;
}

export function FarmerTransactionsPage({ farmerId, onBack }: Props) {
  const { user } = useAuth();
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(() => {
    if (farmerId) return farmerId;
    const stored = sessionStorage.getItem('selectedFarmerId');
    return stored ? parseInt(stored, 10) : null;
  });
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithDetails[]>([]);
  const [farmerBalance, setFarmerBalance] = useState<FarmerBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Credit' | 'Debit'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchFarmers();
    
    // Clean up session storage when component mounts
    return () => {
      sessionStorage.removeItem('selectedFarmerId');
    };
  }, []);

  useEffect(() => {
    if (selectedFarmerId) {
      fetchTransactions();
      fetchFarmerBalance();
    }
  }, [selectedFarmerId]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, dateRange]);

  const fetchFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching farmers:', error);
      } else if (data) {
        setFarmers(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedFarmerId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, purchases(*), crop_sales(*)')
        .eq('farmer_id', selectedFarmerId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
      } else if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmerBalance = async () => {
    if (!selectedFarmerId) return;
    
    try {
      const { data, error } = await supabase
        .from('farmer_balances')
        .select('*')
        .eq('farmer_id', selectedFarmerId)
        .single();
      
      if (error) {
        console.error('Error fetching balance:', error);
      } else if (data) {
        setFarmerBalance(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search term (description)
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by transaction type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(t => 
        t.date && new Date(t.date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => 
        t.date && new Date(t.date) <= new Date(dateRange.end)
      );
    }

    setFilteredTransactions(filtered);
  };

  const generateTransactionReport = async () => {
    if (!selectedFarmerId || !farmerBalance) {
      alert('Please select a farmer first.');
      return;
    }

    const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);
    if (!selectedFarmer) {
      alert('Farmer not found.');
      return;
    }

    try {
      await generateFarmerTransactionPDF(selectedFarmer, farmerBalance, filteredTransactions);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating transaction report. Please try again.');
    }
  };

  const generateFarmerTransactionPDF = async (
    farmer: Farmer, 
    balance: FarmerBalance, 
    transactionsList: TransactionWithDetails[]
  ) => {
    const { generateFarmerTransactionReport } = await import('../utils/transactionReportGenerator');
    await generateFarmerTransactionReport(farmer, balance, transactionsList);
  };

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);

  if (loading && !selectedFarmerId) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedFarmer ? `${selectedFarmer.name} - Transaction History` : 'Farmer Transaction History'}
            </h1>
            <p className="text-gray-600 mt-1">View detailed transaction records and account balance</p>
          </div>
        </div>
        
        {selectedFarmerId && (
          <button
            onClick={generateTransactionReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FileText size={20} />
            Generate Report PDF
          </button>
        )}
      </div>

      {/* Farmer Selection */}
      {!farmerId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Farmer</h3>
          <select
            value={selectedFarmerId || ''}
            onChange={(e) => setSelectedFarmerId(Number(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a farmer...</option>
            {farmers.map(farmer => (
              <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedFarmerId && farmerBalance && (
        <>
          {/* Balance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Credit</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    Rs. {Number(farmerBalance.total_credit).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Debit</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    Rs. {Number(farmerBalance.total_debit).toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Balance</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    Number(farmerBalance.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Rs. {Math.abs(Number(farmerBalance.balance)).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Number(farmerBalance.balance) >= 0 ? 'You owe farmer' : 'Farmer owes you'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  Number(farmerBalance.balance) >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <DollarSign className={
                    Number(farmerBalance.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                  } size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {transactions.length}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Calendar className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'Credit' | 'Debit')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Transactions</option>
                  <option value="Credit">Credit Only</option>
                  <option value="Debit">Debit Only</option>
                </select>
              </div>

              <input
                type="date"
                placeholder="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <input
                type="date"
                placeholder="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction History ({filteredTransactions.length} records)
              </h3>
            </div>
            
            {loading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Related
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.type === 'Credit'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            <span className={
                              transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                            }>
                              Rs. {Number(transaction.amount || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {transaction.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.related_purchase ? `Purchase #${transaction.related_purchase}` :
                             transaction.related_sale ? `Sale #${transaction.related_sale}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
