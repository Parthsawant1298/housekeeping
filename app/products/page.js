// app/products/page.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Share } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/available');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch products');
        }

        setProducts(data.products);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                <div 
                  className="h-48 bg-gray-200 relative cursor-pointer"
                  onClick={() => router.push(`/products/${product._id}`)}
                >
                  <img 
                    src={product.mainImage} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      -{product.discount}%
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h2 
                    className="text-lg font-semibold text-gray-900 mb-1 truncate cursor-pointer"
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
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {product.availableQuantity > 0 
                      ? `${product.availableQuantity} in stock` 
                      : 'Out of stock'}
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
        )}
      </div>
      <Footer />
    </div>
  );
}