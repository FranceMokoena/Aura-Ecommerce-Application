import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react';
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/utils/format';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  images: string[];
  location: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  sellerId: {
    _id: string;
    name: string;
  };
  ratings: Array<{
    customerId: string;
    stars: number;
    review: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      // Mock data - replace with actual API call
      const mockProducts: Product[] = [
        {
          _id: '1',
          name: 'iPhone 13 Pro',
          description: 'Latest iPhone with advanced camera system',
          price: 999.99,
          quantity: 50,
          category: 'Electronics',
          images: ['https://via.placeholder.com/150'],
          location: 'New York',
          status: 'active',
          sellerId: { _id: '1', name: 'Tech Store' },
          ratings: [
            { customerId: '1', stars: 5, review: 'Great product!', createdAt: new Date().toISOString() }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'MacBook Pro 16"',
          description: 'Professional laptop for developers',
          price: 2499.99,
          quantity: 25,
          category: 'Electronics',
          images: ['https://via.placeholder.com/150'],
          location: 'Los Angeles',
          status: 'active',
          sellerId: { _id: '2', name: 'Apple Store' },
          ratings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '3',
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones',
          price: 199.99,
          quantity: 0,
          category: 'Electronics',
          images: ['https://via.placeholder.com/150'],
          location: 'Chicago',
          status: 'out_of_stock',
          sellerId: { _id: '3', name: 'Audio Shop' },
          ratings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setProducts(mockProducts);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || product.status === statusFilter;
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleApproveProduct = async (productId: string) => {
    try {
      // API call to approve product
      console.log('Approving product:', productId);
    } catch (error) {
      console.error('Error approving product:', error);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        // API call to reject product
        console.log('Rejecting product:', productId, 'Reason:', reason);
      } catch (error) {
        console.error('Error rejecting product:', error);
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        // API call to delete product
        console.log('Deleting product:', productId);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getAverageRating = (ratings: Product['ratings']) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-gray-500" />
            <span className="text-gray-600">{products.length} total products</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Home">Home</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product._id} className="card hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={product.images[0] || 'https://via.placeholder.com/300x200'}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div className="absolute top-2 right-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                  {formatStatus(product.status)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{getAverageRating(product.ratings)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Stock: {product.quantity}</span>
                <span>{product.category}</span>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Seller: {product.sellerId.name}</p>
                <p>Location: {product.location}</p>
                <p>Added: {formatDate(product.createdAt)}</p>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveProduct(product._id)}
                    className="text-green-600 hover:text-green-900"
                    title="Approve Product"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRejectProduct(product._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Reject Product"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
