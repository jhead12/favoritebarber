/**
 * web/components/ReviewForm.tsx
 * Form to submit a new barber review
 */

import React, { useState } from 'react';

interface ReviewFormProps {
  userId: string;
  shopId: number;
  barberId?: number | null;
  barberName?: string;
  shopName?: string;
  token: string;
  onSubmit?: (review: any) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  userId,
  shopId,
  barberId,
  barberName = 'Barber',
  shopName = 'Shop',
  token,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    rating: 5,
    hairstyleRequested: '',
    pricePaid: '',
    wouldReturn: true,
    title: '',
    text: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.title.trim()) {
        throw new Error('Review title is required');
      }

      if (!formData.text.trim()) {
        throw new Error('Review text is required');
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(new URL(`/api/users/${userId}/reviews`, apiBase).toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          barberId: barberId || null,
          rating: formData.rating,
          hairstyleRequested: formData.hairstyleRequested || null,
          pricePaid: formData.pricePaid ? parseFloat(formData.pricePaid) : null,
          wouldReturn: formData.wouldReturn,
          title: formData.title,
          text: formData.text,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      const result = await res.json();
      setSuccess(true);
      onSubmit?.(result.review);

      // Reset form
      setFormData({
        rating: 5,
        hairstyleRequested: '',
        pricePaid: '',
        wouldReturn: true,
        title: '',
        text: '',
      });

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-container">
      <h2>Write a Review</h2>
      <p className="subtitle">Share your experience at {shopName} {barberName && `with ${barberName}`}</p>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">Review submitted successfully!</div>}

      <form onSubmit={handleSubmit} className="review-form">
        {/* Rating */}
        <div className="form-group">
          <label htmlFor="rating">Rating *</label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                type="button"
                className={`star ${formData.rating >= num ? 'filled' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, rating: num }))}
                title={`${num} star${num > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
            <span className="rating-value">{formData.rating} / 5</span>
          </div>
        </div>

        {/* Hairstyle */}
        <div className="form-group">
          <label htmlFor="hairstyleRequested">Hairstyle</label>
          <input
            type="text"
            id="hairstyleRequested"
            name="hairstyleRequested"
            placeholder="e.g., fade, undercut, shag"
            value={formData.hairstyleRequested}
            onChange={handleChange}
          />
        </div>

        {/* Price */}
        <div className="form-group">
          <label htmlFor="pricePaid">Price Paid ($)</label>
          <input
            type="number"
            id="pricePaid"
            name="pricePaid"
            placeholder="25.00"
            step="0.01"
            min="0"
            value={formData.pricePaid}
            onChange={handleChange}
          />
        </div>

        {/* Would Return */}
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="wouldReturn"
            name="wouldReturn"
            checked={formData.wouldReturn}
            onChange={handleChange}
          />
          <label htmlFor="wouldReturn">I would return to this barber</label>
        </div>

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Review Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="e.g., Great haircut, highly recommended"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Review Text */}
        <div className="form-group">
          <label htmlFor="text">Review *</label>
          <textarea
            id="text"
            name="text"
            placeholder="Share your experience... What did they do well? Any tips for other clients?"
            rows={5}
            value={formData.text}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      <style jsx>{`
        .review-form-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          color: #333;
        }

        .subtitle {
          margin: 0 0 20px 0;
          color: #999;
          font-size: 14px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert.error {
          background: #ffebee;
          color: #d32f2f;
          border: 1px solid #ef5350;
        }

        .alert.success {
          background: #e8f5e9;
          color: #388e3c;
          border: 1px solid #81c784;
        }

        .review-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.checkbox {
          flex-direction: row;
          align-items: center;
        }

        .form-group.checkbox input {
          width: auto;
          margin: 0;
        }

        .form-group.checkbox label {
          margin: 0;
        }

        label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        input[type="text"],
        input[type="number"],
        textarea {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        textarea:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
        }

        textarea {
          resize: vertical;
          min-height: 120px;
        }

        .rating-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .star {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #ddd;
          transition: color 0.2s;
          padding: 0;
          line-height: 1;
        }

        .star:hover {
          color: #ffc107;
        }

        .star.filled {
          color: #ffc107;
        }

        .rating-value {
          margin-left: 8px;
          font-size: 14px;
          color: #666;
          font-weight: 600;
        }

        .submit-btn {
          padding: 12px 24px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1565c0;
        }

        .submit-btn:disabled {
          background: #bdbdbd;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
