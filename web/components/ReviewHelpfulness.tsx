/**
 * web/components/ReviewHelpfulness.tsx
 * Voting buttons for review helpfulness
 */

import React, { useState } from 'react';

interface ReviewHelpfulnessProps {
  reviewId: number;
  barberId: number;
  userId: string;
  token: string;
  initialHelpful?: number;
  initialUnhelpful?: number;
}

export const ReviewHelpfulness: React.FC<ReviewHelpfulnessProps> = ({
  reviewId,
  barberId,
  userId,
  token,
  initialHelpful = 0,
  initialUnhelpful = 0,
}) => {
  const [helpful, setHelpful] = useState(initialHelpful);
  const [unhelpful, setUnhelpful] = useState(initialUnhelpful);
  const [userVote, setUserVote] = useState<'helpful' | 'unhelpful' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (isHelpful: boolean) => {
    if (userVote === (isHelpful ? 'helpful' : 'unhelpful')) {
      // User is un-voting
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        new URL(`/api/reviews/${reviewId}/helpful`, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').toString(),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isHelpful }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to update helpfulness vote');
      }

      const data = await res.json();

      // Update counts
      setHelpful(data.review.helpful_count || 0);
      setUnhelpful(data.review.unhelpful_count || 0);
      setUserVote(isHelpful ? 'helpful' : 'unhelpful');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error voting');
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = helpful + unhelpful;
  const helpfulPercent = totalVotes > 0 ? Math.round((helpful / totalVotes) * 100) : 0;

  return (
    <div className="review-helpfulness">
      <span className="label">Was this review helpful?</span>

      <div className="voting-buttons">
        <button
          onClick={() => handleVote(true)}
          disabled={loading}
          className={`vote-btn helpful ${userVote === 'helpful' ? 'voted' : ''}`}
          title="Mark as helpful"
        >
          👍 Helpful ({helpful})
        </button>

        <button
          onClick={() => handleVote(false)}
          disabled={loading}
          className={`vote-btn unhelpful ${userVote === 'unhelpful' ? 'voted' : ''}`}
          title="Mark as not helpful"
        >
          👎 Not Helpful ({unhelpful})
        </button>
      </div>

      {totalVotes > 0 && (
        <div className="helpfulness-bar">
          <div className="bar">
            <div className="helpful-portion" style={{ width: `${helpfulPercent}%` }}></div>
          </div>
          <span className="percent">{helpfulPercent}% found this helpful</span>
        </div>
      )}

      {error && <div className="error-text">{error}</div>}

      <style jsx>{`
        .review-helpfulness {
          padding: 12px;
          background: #f5f5f5;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          font-size: 12px;
          color: #999;
          font-weight: 600;
          text-transform: uppercase;
        }

        .voting-buttons {
          display: flex;
          gap: 8px;
        }

        .vote-btn {
          flex: 1;
          padding: 8px 12px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
        }

        .vote-btn:hover:not(:disabled) {
          border-color: #1976d2;
          color: #1976d2;
          background: #f0f7ff;
        }

        .vote-btn.voted {
          background: #e3f2fd;
          border-color: #1976d2;
          color: #1976d2;
          font-weight: 600;
        }

        .vote-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .helpfulness-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #999;
        }

        .bar {
          flex: 1;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
        }

        .helpful-portion {
          height: 100%;
          background: #4caf50;
          transition: width 0.3s;
        }

        .percent {
          min-width: 120px;
          text-align: right;
        }

        .error-text {
          color: #d32f2f;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};
