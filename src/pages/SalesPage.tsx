import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Eye, X } from 'lucide-react';
import type { Database } from '../lib/database.types';

type CropSale = Database['public']['Tables']['crop_sales']['Row'];
type Farmer = Database['public']['Tables']['farmers']['Row'];

interface SaleWithFarmer extends CropSale {
  farmers?: Farmer;
}

export function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleWithFarmer[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleWithFarmer[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleWithFarmer | null>(null);

  const [formData, setFormData] = useState({
    farmer_id: '',
    sold_to: '',
    total_value: '',
    commission_percent: '2',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = sales.filter((sale) =>
      sale.farmers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.sold_to?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSales(filtered);
  }, [searchTerm, sales]);

  const fetchData = async () => {
    setLoading(true);
    const [salesRes, farmersRes] = await Promise.all([
      supabase
        .from('crop_sales')
        .select('*, farmers(*)')
        .order('date', { ascending: false }),
      supabase.from('farmers').select('*').order('name'),
    ]);

    if (salesRes.data) {
      setSales(salesRes.data);
      setFilteredSales(salesRes.data);
    }
    if (farmersRes.data) setFarmers(farmersRes.data);
    setLoading(false);
  };

  const calculateCommission = (totalValue: number, percent: number) => {
    return (totalValue * percent) / 100;
  };

  const calculateNetPayable = (totalValue: number, percent: number) => {
    return totalValue - calculateCommission(totalValue, percent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalValue = parseFloat(formData.total_value);
    const commissionPercent = parseFloat(formData.commission_percent);

    const { data: saleData, error: saleError } = await supabase
      .from('crop_sales')
      .insert([{
        farmer_id: parseInt(formData.farmer_id),
        sold_to: formData.sold_to,
        total_value: totalValue,
        commission_percent: commissionPercent,
        date: formData.date,
        created_by: user?.id,
      }])
      .select()
      .single();

    if (saleError || !saleData) {
      alert('Error creating sale');
      return;
    }

    const commissionAmount = calculateCommission(totalValue, commissionPercent);

    await supabase.from('commissions').insert({
      sale_id: saleData.id,
      percent: commissionPercent,
      amount: commissionAmount,
    });

    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action: 'INSERT',
      table_name: 'crop_sales',
      record_id: saleData.id,
      description: `Created sale for farmer ID ${formData.farmer_id} - Rs. ${totalValue}`,
    });

    resetForm();
    fetchData();
  };

  const viewDetails = (sale: SaleWithFarmer) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      farmer_id: '',
      sold_to: '',
      total_value: '',
      commission_percent: '2',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(false);
  };

  const currentTotalValue = parseFloat(formData.total_value) || 0;
  const currentCommissionPercent = parseFloat(formData.commission_percent) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crop Sales</h1>
          <p className="text-gray-600 mt-1">Record and manage crop sales with commission tracking</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          New Sale
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by farmer or buyer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farmer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Payable
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No sales found
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {sale.date ? new Date(sale.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {sale.farmers?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {sale.sold_to || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        Rs. {Number(sale.total_value || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {sale.commission_percent}% (Rs. {Number(sale.commission_amount || 0).toLocaleString()})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                        Rs. {Number(sale.net_payable || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => viewDetails(sale)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 inline-flex items-center"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">New Crop Sale</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farmer *</label>
                    <select
                      value={formData.farmer_id}
                      onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Farmer</option>
                      {farmers.map(farmer => (
                        <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sold To *</label>
                    <input
                      type="text"
                      value={formData.sold_to}
                      onChange={(e) => setFormData({ ...formData, sold_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Buyer name or company"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Value (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_value}
                      onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.commission_percent}
                      onChange={(e) => setFormData({ ...formData, commission_percent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">Total Value:</span>
                    <span className="font-semibold text-gray-900">Rs. {currentTotalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">Commission ({currentCommissionPercent}%):</span>
                    <span className="font-semibold text-red-600">
                      - Rs. {calculateCommission(currentTotalValue, currentCommissionPercent).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Net Payable:</span>
                    <span className="text-2xl font-bold text-green-600">
                      Rs. {calculateNetPayable(currentTotalValue, currentCommissionPercent).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Sale Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Farmer</p>
                    <p className="font-medium text-gray-900">{selectedSale.farmers?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sold To</p>
                    <p className="font-medium text-gray-900">{selectedSale.sold_to}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedSale.date ? new Date(selectedSale.date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission Rate</p>
                    <p className="font-medium text-gray-900">{selectedSale.commission_percent}%</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Value:</span>
                    <span className="font-semibold text-gray-900">
                      Rs. {Number(selectedSale.total_value || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Commission Amount:</span>
                    <span className="font-semibold text-red-600">
                      - Rs. {Number(selectedSale.commission_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Net Payable:</span>
                    <span className="text-2xl font-bold text-green-600">
                      Rs. {Number(selectedSale.net_payable || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
