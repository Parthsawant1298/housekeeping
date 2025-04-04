// app/products/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Share, Search, Filter, X, ChevronDown, Tag, Package, ArrowUpRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Category Icons mapping
  const categoryIcons = {
    "Housekeeping Materials": "🧹",
    "Office Stationeries": "📝",
    "Pantry/Grocery Materials": "☕",
    "IT Accessories": "🖱️",
    "Packaging Materials": "📦",
    "COVID Items": "😷"
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/available');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch products');
        }

        setProducts(data.products);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.products.map(product => product.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Fetch products error:', error);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }

      alert('Product added to cart!');
    } catch (error) {
      console.error('Add to cart error:', error);
      alert(error.message || 'Failed to add to cart');
    }
  };

  const handleShare = (product) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this ${product.name}!`,
        url: window.location.origin + `/products/${product._id}`
      })
      .catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      const shareUrl = `${window.location.origin}/products/${product._id}`;
      prompt('Copy this link to share:', shareUrl);
    }
  };
  
  // Filter functions
  const filterProducts = useCallback(() => {
    if (!products.length) return [];
    
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !product.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Price filter
      if (product.price < priceRange.min || product.price > priceRange.max) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort products
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.ratings - a.ratings;
        case 'popularity':
          return b.numReviews - a.numReviews;
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);
  
  const filteredProducts = filterProducts();
  
  // Group products by category for the category view
  const groupedProducts = useCallback(() => {
    const grouped = {};
    
    if (selectedCategory !== 'all') {
      // If a category is selected, don't group
      return { [selectedCategory]: filteredProducts };
    }
    
    filteredProducts.forEach(product => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });
    
    return grouped;
  }, [filteredProducts, selectedCategory]);
  
  const productsByCategory = groupedProducts();
  
  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceRange({ min: 0, max: 10000 });
    setSortBy('newest');
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-gray-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
     
        {/* Search and filter bar */}
        <div className="mb-8 bg-white p-4 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter toggle (mobile) */}
            <button
              className="md:hidden flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            
            {/* Category dropdown */}
            <div className="hidden md:block relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </div>
            
            {/* Sort dropdown */}
            <div className="hidden md:block relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popularity">Most Popular</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Mobile filters panel */}
          <div className={`md:hidden mt-4 ${isFilterOpen ? 'block' : 'hidden'}`}>
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 10000 })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
              
              <div className="pt-2 flex justify-between">
                <button
                  onClick={resetFilters}
                  className="text-teal-600 font-medium"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory !== 'all' && (
            <div className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm flex items-center">
              Category: {selectedCategory}
              <button 
                onClick={() => setSelectedCategory('all')}
                className="ml-2 focus:outline-none"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {searchQuery && (
            <div className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm flex items-center">
              Search: {searchQuery}
              <button 
                onClick={() => setSearchQuery('')}
                className="ml-2 focus:outline-none"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {(priceRange.min > 0 || priceRange.max < 10000) && (
            <div className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm flex items-center">
              Price: ₹{priceRange.min} - ₹{priceRange.max}
              <button 
                onClick={() => setPriceRange({ min: 0, max: 10000 })}
                className="ml-2 focus:outline-none"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {(selectedCategory !== 'all' || searchQuery || priceRange.min > 0 || priceRange.max < 10000) && (
            <button
              onClick={resetFilters}
              className="text-teal-600 underline text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
        
        {/* Results count */}
        {filteredProducts.length > 0 && (selectedCategory !== 'all' || searchQuery || priceRange.min > 0 || priceRange.max < 10000) && (
         <div className="mb-6">
          <p className="text-gray-600">
           Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        )}
        
        {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        {products.length === 0 ? (
          // No products at all
        <>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No products available</h2>
          <p className="text-gray-500">Check back later for new products.</p>
        </>
        ) : (
          // Products exist but none match filters
        <>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No products found</h2>
        <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
        <button
          onClick={resetFilters}
          className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700"
        >
          Reset Filters
        </button>
        </>
        )}
        </div>
        ) : (
            /* Products by category */
          <div className="space-y-10">
            {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <div key={category} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Category header */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{categoryIcons[category] || '📦'}</span>
                    <h2 className="text-xl font-bold">{category}</h2>
                  </div>
                  {selectedCategory === 'all' && (
                    <button 
                      onClick={() => setSelectedCategory(category)}
                      className="flex items-center text-sm bg-white text-teal-700 px-3 py-1 rounded-full hover:bg-gray-100"
                    >
                      View All
                      <ArrowUpRight size={14} className="ml-1" />
                    </button>
                  )}
                </div>
                
                {/* Products grid */}
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categoryProducts.map(product => (
                      <div key={product._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                        <div 
                          className="h-48 bg-gray-100 relative cursor-pointer overflow-hidden"
                          onClick={() => router.push(`/products/${product._id}`)}
                        >
                          <img 
                            src={product.mainImage} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          {product.discount > 0 && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                              -{product.discount}%
                            </div>
                          )}
                          
                          {product.availableQuantity <= 5 && product.availableQuantity > 0 && (
                            <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded">
                              Only {product.availableQuantity} left
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h2 
                            className="text-lg font-semibold text-gray-900 mb-1 truncate cursor-pointer group-hover:text-teal-600 transition-colors"
                            onClick={() => router.push(`/products/${product._id}`)}
                          >
                            {product.name}
                          </h2>
                          
                          <div className="flex items-center mb-2">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={16} 
                                  fill={i < Math.floor(product.ratings) ? "currentColor" : "none"} 
                                  stroke="currentColor" 
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-1">({product.numReviews || 0})</span>
                          </div>
                          
                          <div className="flex items-center mb-3">
                            <span className="text-xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-sm text-gray-500 line-through ml-2">₹{product.originalPrice.toLocaleString()}</span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {product.description}
                          </p>
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleAddToCart(product._id)}
                              disabled={product.availableQuantity <= 0}
                              className={`flex-1 text-sm py-2 px-3 rounded-md flex items-center justify-center ${
                                product.availableQuantity > 0
                                  ? 'bg-teal-600 text-white hover:bg-teal-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <ShoppingCart size={16} className="mr-1" />
                              {product.availableQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                            
                            <button 
                              onClick={() => handleShare(product)}
                              className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                              <Share size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}