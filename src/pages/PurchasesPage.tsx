import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Eye, X, FileText } from 'lucide-react';
import { simpleInvoiceGenerator } from '../utils/simpleInvoiceGenerator';
import type { Database } from '../lib/database.types';

type Purchase = Database['public']['Tables']['purchases']['Row'];
type PurchaseItem = Database['public']['Tables']['purchase_items']['Row'];
type Farmer = Database['public']['Tables']['farmers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface PurchaseWithDetails extends Purchase {
  farmers?: Farmer;
  purchase_items?: (PurchaseItem & { products?: Product })[];
}

interface ItemForm {
  product_id: string;
  quantity: string;
  rate: string;
}

export function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseWithDetails[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithDetails | null>(null);

  const [formData, setFormData] = useState({
    farmer_id: '',
    payment_type: 'Credit',
    date: new Date().toISOString().split('T')[0],
  });

  const [items, setItems] = useState<ItemForm[]>([
    { product_id: '', quantity: '', rate: '' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = purchases.filter((purchase) =>
      purchase.farmers?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPurchases(filtered);
  }, [searchTerm, purchases]);

  const fetchData = async () => {
    setLoading(true);
    const [purchasesRes, farmersRes, productsRes] = await Promise.all([
      supabase
        .from('purchases')
        .select('*, farmers(*), purchase_items(*, products(*))')
        .order('date', { ascending: false }),
      supabase.from('farmers').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
    ]);

    if (purchasesRes.error) {
      console.error('Error fetching purchases:', purchasesRes.error);
      alert('Error loading purchases. Please try again.');
    } else if (purchasesRes.data) {
      setPurchases(purchasesRes.data);
      setFilteredPurchases(purchasesRes.data);
    }

    if (farmersRes.error) {
      console.error('Error fetching farmers:', farmersRes.error);
    } else if (farmersRes.data) {
      setFarmers(farmersRes.data);
    }

    if (productsRes.error) {
      console.error('Error fetching products:', productsRes.error);
    } else if (productsRes.data) {
      setProducts(productsRes.data);
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: '', rate: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'product_id') {
      const product = products.find(p => p.id.toString() === value);
      if (product && product.rate) {
        newItems[index].rate = product.rate.toString();
      }
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = calculateTotal();

    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .insert([{
        farmer_id: parseInt(formData.farmer_id),
        payment_type: formData.payment_type,
        total_amount: total,
        date: formData.date,
        user_id: user!.id,
      }])
      .select()
      .single();

    if (purchaseError || !purchaseData) {
      alert('Error creating purchase');
      return;
    }

    const purchaseItems = items.map(item => ({
      purchase_id: purchaseData.id,
      product_id: parseInt(item.product_id),
      quantity: parseFloat(item.quantity),
      rate: parseFloat(item.rate),
    }));

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems);

    if (!itemsError) {
      // Record transaction: You owe the farmer (Credit)
      const { error: txError } = await supabase.from('transactions').insert({
        farmer_id: parseInt(formData.farmer_id),
        type: 'Credit',
        amount: total,
        description: `Purchase #${purchaseData.id}`,
        date: formData.date,
        related_purchase: purchaseData.id,
      });

      if (txError) {
        console.error('Error inserting transaction for purchase:', txError);
      }

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'INSERT',
        table_name: 'purchases',
        record_id: purchaseData.id,
        description: `Created purchase for farmer ID ${formData.farmer_id} - Rs. ${total}`,
      });

      resetForm();
      fetchData();
    }
  };

  const viewDetails = (purchase: PurchaseWithDetails) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };

  const generateInvoice = (purchase: PurchaseWithDetails) => {
    try {
      simpleInvoiceGenerator.generatePurchaseInvoice(purchase);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      farmer_id: '',
      payment_type: 'Credit',
      date: new Date().toISOString().split('T')[0],
    });
    setItems([{ product_id: '', quantity: '', rate: '' }]);
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-600 mt-1">Record and manage crop purchases</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by farmer name..."
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
                    Payment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {purchase.date ? new Date(purchase.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {purchase.farmers?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          purchase.payment_type === 'Cash'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {purchase.payment_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        Rs. {Number(purchase.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => viewDetails(purchase)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 inline-flex items-center"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => generateInvoice(purchase)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 inline-flex items-center ml-2"
                          title="Generate PDF Invoice"
                        >
                          <FileText size={16} />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">New Purchase</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
                    <select
                      value={formData.payment_type}
                      onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>

                  <div>
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

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                    <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />

                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateItem(index, 'rate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            Rs. {((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">Rs. {calculateTotal().toFixed(2)}</span>
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
                    Create Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Purchase Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateInvoice(selectedPurchase)}
                    className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 inline-flex items-center gap-2"
                    title="Generate PDF Invoice"
                  >
                    <FileText size={16} />
                    <span className="text-sm font-medium">PDF Invoice</span>
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Farmer</p>
                    <p className="font-medium text-gray-900">{selectedPurchase.farmers?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedPurchase.date ? new Date(selectedPurchase.date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Type</p>
                    <p className="font-medium text-gray-900">{selectedPurchase.payment_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium text-gray-900">Rs. {Number(selectedPurchase.total_amount || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPurchase.purchase_items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.products?.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">Rs. {Number(item.rate).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">Rs. {Number(item.total || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
