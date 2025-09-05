import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Star,
  Clock,
  MapPin
} from 'lucide-react';
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/utils/format';

interface Service {
  _id: string;
  title: string;
  description: string;
  rate: number;
  rateType: 'hourly' | 'daily' | 'fixed';
  availability: boolean;
  location: string;
  category: string;
  skills: string[];
  status: 'active' | 'inactive';
  seekerId: {
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchServices();
  }, [currentPage, statusFilter, categoryFilter]);

  const fetchServices = async () => {
    try {
      // Mock data - replace with actual API call
      const mockServices: Service[] = [
        {
          _id: '1',
          title: 'Professional Plumbing Services',
          description: 'Expert plumbing repair and installation services for residential and commercial properties',
          rate: 75,
          rateType: 'hourly',
          availability: true,
          location: 'New York',
          category: 'Home Services',
          skills: ['Pipe Repair', 'Installation', 'Maintenance'],
          status: 'active',
          seekerId: { _id: '1', name: 'John Plumber' },
          ratings: [
            { customerId: '1', stars: 5, review: 'Excellent service!', createdAt: new Date().toISOString() }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '2',
          title: 'Web Development',
          description: 'Full-stack web development services using modern technologies',
          rate: 100,
          rateType: 'hourly',
          availability: true,
          location: 'Los Angeles',
          category: 'Technology',
          skills: ['React', 'Node.js', 'MongoDB'],
          status: 'active',
          seekerId: { _id: '2', name: 'Sarah Developer' },
          ratings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '3',
          title: 'House Cleaning',
          description: 'Professional house cleaning services for homes and apartments',
          rate: 50,
          rateType: 'hourly',
          availability: false,
          location: 'Chicago',
          category: 'Home Services',
          skills: ['Deep Cleaning', 'Regular Maintenance'],
          status: 'inactive',
          seekerId: { _id: '3', name: 'Maria Cleaner' },
          ratings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setServices(mockServices);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || service.status === statusFilter;
    const matchesCategory = !categoryFilter || service.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleApproveService = async (serviceId: string) => {
    try {
      // API call to approve service
      console.log('Approving service:', serviceId);
    } catch (error) {
      console.error('Error approving service:', error);
    }
  };

  const handleRejectService = async (serviceId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        // API call to reject service
        console.log('Rejecting service:', serviceId, 'Reason:', reason);
      } catch (error) {
        console.error('Error rejecting service:', error);
      }
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        // API call to delete service
        console.log('Deleting service:', serviceId);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const getAverageRating = (ratings: Service['ratings']) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const formatRate = (rate: number, rateType: string) => {
    return `${formatCurrency(rate)}/${rateType}`;
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
        <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-gray-500" />
            <span className="text-gray-600">{services.length} total services</span>
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
                placeholder="Search services..."
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
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              <option value="Home Services">Home Services</option>
              <option value="Technology">Technology</option>
              <option value="Health">Health</option>
              <option value="Education">Education</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service._id} className="card hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{service.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{service.description}</p>
                </div>
                <div className="ml-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                    {formatStatus(service.status)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">{formatRate(service.rate, service.rateType)}</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{getAverageRating(service.ratings)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{service.availability ? 'Available' : 'Unavailable'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{service.location}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  <p><strong>Category:</strong> {service.category}</p>
                  <p><strong>Provider:</strong> {service.seekerId.name}</p>
                  <p><strong>Added:</strong> {formatDate(service.createdAt)}</p>
                </div>
                
                {service.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveService(service._id)}
                    className="text-green-600 hover:text-green-900"
                    title="Approve Service"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRejectService(service._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Reject Service"
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
                    onClick={() => handleDeleteService(service._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Service"
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
