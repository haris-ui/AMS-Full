import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, X, Receipt } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Farmer = Database['public']['Tables']['farmers']['Row'];

export function FarmersPage() {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    address: '',
    phone_number: '',
  });

  useEffect(() => {
    fetchFarmers();
  }, []);

  useEffect(() => {
    const filtered = farmers.filter(
      (farmer) =>
        farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFarmers(filtered);
  }, [searchTerm, farmers]);

  const fetchFarmers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farmers:', error);
      alert('Error loading farmers. Please try again.');
    } else if (data) {
      setFarmers(data);
      setFilteredFarmers(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFarmer) {
        const { error } = await supabase
          .from('farmers')
          .update(formData)
          .eq('id', editingFarmer.id);

        if (error) {
          console.error('Error updating farmer:', error);
          alert('Error updating farmer. Please try again.');
          return;
        }
        await logAudit('UPDATE', 'farmers', editingFarmer.id, `Updated farmer: ${formData.name}`);
      } else {
        const { data, error } = await supabase
          .from('farmers')
          .insert([{ ...formData, user_id: user!.id }])
          .select()
          .single();

        if (error) {
          console.error('Error creating farmer:', error);
          alert('Error creating farmer. Please try again.');
          return;
        }
        if (data) {
          await logAudit('INSERT', 'farmers', data.id, `Created farmer: ${formData.name}`);
        }
      }

      resetForm();
      fetchFarmers();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleDelete = async (farmer: Farmer) => {
    if (window.confirm(`Are you sure you want to delete ${farmer.name}?`)) {
      try {
        const { error } = await supabase.from('farmers').delete().eq('id', farmer.id);

        if (error) {
          console.error('Error deleting farmer:', error);
          alert('Error deleting farmer. Please try again.');
          return;
        }
        await logAudit('DELETE', 'farmers', farmer.id, `Deleted farmer: ${farmer.name}`);
        fetchFarmers();
      } catch (error) {
        console.error('Unexpected error:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  const logAudit = async (action: string, table: string, recordId: number, description: string) => {
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action,
      table_name: table,
      record_id: recordId,
      description,
    });
  };

  const openEditModal = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      father_name: farmer.father_name || '',
      address: farmer.address || '',
      phone_number: farmer.phone_number || '',
    });
    setShowModal(true);
  };

  const viewTransactions = (farmer: Farmer) => {
    // Navigate to transactions page with farmer ID
    const event = new CustomEvent('navigate', { detail: 'transactions' });
    window.dispatchEvent(event);
    
    // Store farmer ID for the transactions page
    sessionStorage.setItem('selectedFarmerId', farmer.id.toString());
  };

  const resetForm = () => {
    setFormData({
      name: '',
      father_name: '',
      address: '',
      phone_number: '',
    });
    setEditingFarmer(null);
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmers</h1>
          <p className="text-gray-600 mt-1">Manage farmer information and contacts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Farmer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search farmers by name or phone..."
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Father's Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No farmers found
                    </td>
                  </tr>
                ) : (
                  filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{farmer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {farmer.father_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {farmer.phone_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {farmer.address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => viewTransactions(farmer)}
                          className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 inline-flex items-center"
                          title="View Transactions"
                        >
                          <Receipt size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(farmer)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 inline-flex items-center ml-2"
                          title="Edit Farmer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(farmer)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 inline-flex items-center ml-2"
                          title="Delete Farmer"
                        >
                          <Trash2 size={16} />
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingFarmer ? 'Edit Farmer' : 'Add Farmer'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
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
                    {editingFarmer ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
