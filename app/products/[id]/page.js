// app/products/[id]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Share, ChevronLeft, ChevronRight, ArrowLeft, User } from 'lucide-react';
import { use } from 'react';

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  // Use React.use() to unwrap params
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState('');
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}/available`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch product');
        }

        setProduct(data.product);
        setIsLoading(false);
      } catch (error) {
        console.error('Fetch product error:', error);
        setError('Failed to load product. Please try again.');
        setIsLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true);
        const response = await fetch(`/api/products/${id}/reviews`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch reviews');
        }

        setReviews(data.reviews);
        
        // Check if current user has already reviewed this product
        const response2 = await fetch('/api/auth/user');
        if (response2.ok) {
          const userData = await response2.json();
          if (userData.user) {
            const userReview = data.reviews.find(review => 
              review.user._id === userData.user._id
            );
            setHasUserReviewed(!!userReview);
          }
        }
      } catch (error) {
        console.error('Fetch reviews error:', error);
        setReviewsError('Failed to load reviews. Please try again.');
      } finally {
        setIsLoadingReviews(false);
      }
    };

    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product._id,
          quantity
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.comment.trim()) {
      setReviewSubmitError('Please enter a review comment');
      return;
    }
    
    setIsSubmittingReview(true);
    setReviewSubmitError('');
    setReviewSubmitSuccess('');
    
    try {
      const response = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Add the new review to the reviews list
      setReviews(prevReviews => [data.review, ...prevReviews]);
      
      // Update product rating
      setProduct(prevProduct => ({
        ...prevProduct,
        ratings: (prevProduct.ratings * prevProduct.numReviews + Number(reviewForm.rating)) / (prevProduct.numReviews + 1),
        numReviews: prevProduct.numReviews + 1
      }));
      
      // Reset form and show success message
      setReviewForm({ rating: 5, comment: '' });
      setReviewSubmitSuccess('Your review has been submitted successfully!');
      setHasUserReviewed(true);
    } catch (error) {
      console.error('Submit review error:', error);
      setReviewSubmitError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this ${product.name}!`,
        url: window.location.href
      })
      .catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      prompt('Copy this link to share:', window.location.href);
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Product not found'}</p>
          <button 
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-gray-50 to-white py-8">
      <div className="container mx-auto px-4">
        <button 
          onClick={() => router.push('/products')}
          className="mb-6 flex items-center text-teal-600 hover:text-teal-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Products</span>
        </button>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            {/* Left: Product Images */}
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-full bg-gray-100">
                {/* Main image */}
                <img 
                  src={product.images[selectedImage].url} 
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
                
                {/* Image navigation arrows */}
                {product.images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                
                {/* Discount badge */}
                {product.discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded">
                    -{product.discount}% OFF
                  </div>
                )}
              </div>
              
              {/* Thumbnail images */}
              {product.images.length > 1 && (
                <div className="flex overflow-x-auto p-2 space-x-2">
                  {product.images.map((image, index) => (
                    <div 
                      key={index} 
                      className={`w-16 h-16 flex-shrink-0 border-2 rounded cursor-pointer ${
                        index === selectedImage ? 'border-teal-500' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img 
                        src={image.url} 
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right: Product Details */}
            <div className="md:w-1/2 p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      fill={i < Math.floor(product.ratings || 0) ? "currentColor" : "none"} 
                      stroke="currentColor" 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">{product.ratings?.toFixed(1) || '0.0'} ({product.numReviews || 0} reviews)</span>
              </div>
              
              <div className="flex items-end mb-6">
                <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="ml-3">
                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="text-sm text-green-600 ml-2 font-medium">Save ₹{(product.originalPrice - product.price).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600">{product.description}</p>
              </div>
              
              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index} className="text-gray-600">{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Availability */}
              <div className="mb-6">
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">Availability:</span>
                  {product.availableQuantity > 0 ? (
                    <span className="text-green-600">In Stock ({product.availableQuantity} available)</span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </div>
              </div>
              
              {/* Quantity selector */}
              {product.availableQuantity > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="px-2 py-1 border border-gray-300 rounded-l"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min="1" 
                      max={product.availableQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(product.availableQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 text-center border-t border-b border-gray-300"
                    />
                    <button 
                      onClick={() => setQuantity(prev => Math.min(product.availableQuantity, prev + 1))}
                      className="px-2 py-1 border border-gray-300 rounded-r"
                      disabled={quantity >= product.availableQuantity}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex space-x-3">
                <button 
                  onClick={handleAddToCart}
                  disabled={product.availableQuantity < 1}
                  className={`flex-1 py-3 px-6 rounded-md flex items-center justify-center ${
                    product.availableQuantity > 0 
                      ? 'bg-teal-600 text-white hover:bg-teal-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={18} className="mr-2" />
                  {product.availableQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                <button 
                  onClick={handleShare}
                  className="py-3 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  <Share size={18} />
                </button>
              </div>
              
              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          
          {/* Review Form */}
          {!hasUserReviewed ? (
            <div className="mb-8 border-b border-gray-200 pb-8">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        className="p-1 focus:outline-none"
                      >
                        <Star 
                          size={24} 
                          className="text-yellow-400"
                          fill={star <= reviewForm.rating ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-gray-600">({reviewForm.rating}/5)</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                  <textarea
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Share your experience with this product..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    required
                  ></textarea>
                </div>
                
                {reviewSubmitError && (
                  <div className="p-3 mb-4 bg-red-50 text-red-700 text-sm rounded-md">
                    {reviewSubmitError}
                  </div>
                )}
                
                {reviewSubmitSuccess && (
                  <div className="p-3 mb-4 bg-green-50 text-green-700 text-sm rounded-md">
                    {reviewSubmitSuccess}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-70"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          ) : (
            <div className="mb-8 pb-8 border-b border-gray-200">
              <p className="text-teal-600">You have already reviewed this product.</p>
            </div>
          )}
          
          {/* Reviews List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {reviews.length === 0 ? 'No Reviews Yet' : `${reviews.length} Reviews`}
            </h3>
            
            {isLoadingReviews ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : reviewsError ? (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                {reviewsError}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Be the first to review this product!
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mr-3">
                        {review.user.profilePicture ? (
                          <img 
                            src={review.user.profilePicture} 
                            alt={review.user.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{review.user.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          className="text-yellow-400"
                          fill={i < review.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}