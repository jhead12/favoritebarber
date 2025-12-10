/**
 * web/components/ReviewsList.tsx
 * Display barber or shop reviews with helpfulness voting
 */

import React, { useEffect, useState } from 'react';
import { ReviewHelpfulness } from './ReviewHelpfulness';

interface Review {
  id: number;
  title: string;
  text: string;
  rating: number;
  hairstyle_requested?: string;
  price_paid?: string;
  would_return: boolean;
  helpful_count: number;
  unhelpful_count: number;
  username: string;
  profile_image_url?: string;
  review_score: string;
  created_at: string;
}

interface ReviewsListProps {
  barberId?: number;
  shopId?: number;
  userId: string;
  token: string;
  entityName?: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  barberId,
  shopId,
  userId,
  token,
  entityName = 'Entity',
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [barberId, shopId, token]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Use explicit API base; when running inside compose set NEXT_PUBLIC_API_URL to 'http://api:3000'
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = barberId
        ? new URL(`/api/users/${barberId}/user-reviews`, apiBase).toString()
        : new URL(`/api/shops/${shopId}/user-reviews`, apiBase).toString();

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewUpdate = (updatedReview: Review) => {
    setReviews(reviews.map(r => r.id === updatedReview.id ? updatedReview : r));
  };

  if (loading) {
    return <div className="reviews-list">Loading reviews...</div>;
  }

  if (error) {
    return <div className="reviews-list error">{error}</div>;
  }

  if (reviews.length === 0) {
    return <div className="reviews-list empty">No reviews yet. Be the first to review!</div>;
  }

  return (
    <div className="reviews-list">
      <h2>Reviews ({reviews.length})</h2>
      <div className="reviews-container">
        {reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="review-meta">
                <div className="user-info">
                  {review.profile_image_url && (
                    <img src={review.profile_image_url} alt={review.username} className="avatar" />
                  )}
                  <div>
                    <strong>{review.username}</strong>
                    <div className="timestamp">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rating-badge">
                <span className="rating-value">{review.rating}</span>
                <span className="rating-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < review.rating ? 'filled' : ''}>★</span>
                  ))}
                </span>
              </div>
            </div>

            <div className="review-title">{review.title}</div>

            <div className="review-text">{review.text}</div>

            <div className="review-details">
              {review.hairstyle_requested && (
                <span className="detail">💇 {review.hairstyle_requested}</span>
              )}
              {review.price_paid && (
                <span className="detail">💰 ${parseFloat(review.price_paid).toFixed(2)}</span>
              )}
              {review.would_return && (
                <span className="detail">✅ Would return</span>
              )}
            </div>

            <div className="review-score">
              Credibility Score: <strong>{parseFloat(review.review_score).toFixed(1)}/100</strong>
            </div>

            <ReviewHelpfulness
              reviewId={review.id}
              barberId={barberId || shopId || 0}
              userId={userId}
              token={token}
              initialHelpful={review.helpful_count}
              initialUnhelpful={review.unhelpful_count}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        .reviews-list {
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .reviews-list.empty {
          text-align: center;
          color: #999;
          font-style: italic;
        }

        .reviews-list.error {
          color: #d32f2f;
          background: #ffebee;
          border-radius: 4px;
        }

        h2 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #333;
        }

        .reviews-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .review-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s;
        }

        .review-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .review-meta {
          flex: 1;
        }

        .user-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-info strong {
          display: block;
          color: #333;
          margin-bottom: 4px;
        }

        .timestamp {
          font-size: 12px;
          color: #999;
        }

        .rating-badge {
          text-align: right;
        }

        .rating-value {
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }

        .rating-stars {
          display: block;
          font-size: 14px;
          color: #ffc107;
        }

        .rating-stars span.filled {
          color: #ffc107;
        }

        .rating-stars span {
          color: #ddd;
        }

        .review-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .review-text {
          font-size: 14px;
          line-height: 1.6;
          color: #666;
          margin-bottom: 12px;
        }

        .review-details {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 12px;
        }

        .detail {
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 3px;
          color: #666;
        }

        .review-score {
          font-size: 12px;
          color: #999;
          margin-bottom: 12px;
        }

        .review-score strong {
          color: #1976d2;
        }
      `}</style>
    </div>
  );
};
