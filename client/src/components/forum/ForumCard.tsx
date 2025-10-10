import React from 'react';
import { Link } from 'react-router-dom';
import UserDisplay from '../UserDisplay';
import './ForumCard.css';

interface LastPost {
  last_post_username?: string;
  last_post_minecraft_username?: string;
  last_post_user_uuid?: string;
  last_post_topic_title?: string;
  last_post_topic_slug?: string;
  last_post_time?: string;
  last_post_total_donated?: number;
  last_post_donation_rank?: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    icon: string;
    badge: string;
    glow: boolean;
  };
}

interface Forum extends LastPost {
  id: number;
  name: string;
  description: string;
  icon?: string;
  locked: number;
  topics_count?: number;
  posts_count?: number;
  topic_count?: number;
  post_count?: number;
}

interface ForumCardProps {
  forum: Forum;
  showStats?: boolean;
  showLastPost?: boolean;
}

const ForumCard: React.FC<ForumCardProps> = ({
  forum,
  showStats = true,
  showLastPost = true
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
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

  const topicsCount = forum.topics_count || forum.topic_count || 0;
  const postsCount = forum.posts_count || forum.post_count || 0;

  return (
    <div className="forum-card">
      <div className="forum-card__content-wrapper">
        <div className="forum-card__main">
          <div className="forum-card__icon-container">
            <div className="forum-card__avatar">
              <span className="forum-card__letter">
                {forum.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="forum-card__content">
            <Link to={`/forum/${forum.id}`} className="forum-card__link">
              <h3 className="forum-card__name">
                {forum.name}
                {forum.locked === 1 && (
                  <span className="forum-card__locked" title="This forum is locked">🔒</span>
                )}
              </h3>
            </Link>
            <p className="forum-card__description">
              {forum.description || 'Join the discussion and share your thoughts'}
            </p>
            {showLastPost && (
              <div className="forum-card__meta">
                <span className="forum-card__author">
                  by{' '}
                  {forum.last_post_username ? (
                    <UserDisplay
                      username={forum.last_post_username}
                      minecraftUsername={forum.last_post_minecraft_username}
                      totalDonated={forum.last_post_total_donated}
                      donationRank={forum.last_post_donation_rank}
                      size="small"
                      showIcon={false}
                      showBadge={true}
                    />
                  ) : (
                    'Admin'
                  )}
                </span>
                <span className="forum-card__time">
                  Last reply {formatDate(forum.last_post_time)}
                </span>
              </div>
            )}
          </div>
        </div>

        {showStats && (
          <div className="forum-card__stats-container">
            <div className="forum-card__engagement">
              <div className="forum-card__engagement-item">
                <span className="forum-card__engagement-count">{topicsCount}</span>
                <span className="forum-card__engagement-label">Topics</span>
              </div>
              <div className="forum-card__engagement-item">
                <span className="forum-card__engagement-count">{postsCount}</span>
                <span className="forum-card__engagement-label">Posts</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumCard;
