import React from 'react';

type Props = { score: number };

export default function TrustScoreBadge({ score }: Props) {
  const tone = score >= 85 ? '#38d996' : score >= 70 ? '#ffb74d' : '#f87272';
  return (
    <span className="trust">
      <span className="dot" />
      Trust {score}
      <style jsx>{`
        .trust {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e7eef7;
          font-weight: 700;
          font-size: 13px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: ${tone};
          box-shadow: 0 0 12px ${tone};
        }
      `}</style>
    </span>
  );
}
