import React from 'react';
import { Link } from 'react-router-dom';
import './TopicCard.css';

interface RecentTopic {
  id: number;
  title: string;
  slug: string;
  author: string;
  reply_count: number;
  created_at: string;
  forum_name: string;
}

interface TopicCardProps {
  topic: RecentTopic;
  showForum?: boolean;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  showForum = true
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="topic-card">
      <div className="topic-card__icon">
        <div className="topic-card__avatar">
          <span className="topic-card__letter">
            {topic.title.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="topic-card__content">
        <Link to={`/forum/topic/${topic.slug}`} className="topic-card__link">
          <h3 className="topic-card__title">{topic.title}</h3>
        </Link>
        <div className="topic-card__meta">
          {showForum && (
            <span className="topic-card__forum">{topic.forum_name}</span>
          )}
          <span className="topic-card__author">by {topic.author}</span>
          <span className="topic-card__time">{formatDate(topic.created_at)}</span>
        </div>
      </div>

      <div className="topic-card__stats">
        <div className="topic-card__engagement-item">
          <span className="topic-card__engagement-count">{topic.reply_count}</span>
          <span className="topic-card__engagement-label">Replies</span>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
