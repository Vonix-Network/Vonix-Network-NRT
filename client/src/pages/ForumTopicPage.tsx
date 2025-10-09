import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserDisplay from '../components/UserDisplay';
import { getDonationRankByAmount } from '../types/donationRanks';
import './ForumTopicPage.css';

interface Post {
  id: number;
  content: string;
  content_html: string;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  role: string;
  user_post_count: number;
  bio?: string;
  created_at: string;
  edited_at?: string;
  edited_by_username?: string;
  user_id: number;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
  total_donated?: number;
  donation_rank_id?: string;
  donation_rank?: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    icon: string;
    badge: string;
    glow: boolean;
  };
}

interface Poll {
  id: number;
  question: string;
  options: PollOption[];
  userVoted: boolean;
  userVote?: number;
}

interface PollOption {
  id: number;
  option_text: string;
  votes: number;
}

interface Topic {
  id: number;
  title: string;
  slug: string;
  views: number;
  replies: number;
  locked: number;
  pinned: number;
  forum_name: string;
  forum_id: number;
  category_name: string;
  author_username: string;
  user_id: number;
  isSubscribed?: boolean;
  isBookmarked?: boolean;
}

const ForumTopicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchTopic = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/forum/topic/${slug}?page=1`);
        setTopic(response.data.topic);
        setPosts(response.data.posts);
        setPoll(response.data.poll);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load topic');
        setLoading(false);
      }
    };

    fetchTopic();
  }, [slug]);

  const handleDeleteTopic = async () => {
    if (!topic || !window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) return;
    try {
      await api.delete(`/forum/topic/${topic.id}`);
      alert('Topic deleted successfully');
      window.location.href = `/forum/${topic.forum_id}`;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete topic');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !topic) return;
    try {
      setReplying(true);
      await api.post(`/forum/topic/${topic.id}/reply`, { content: replyContent });
      setReplyContent('');
      // Refresh
      if (slug) {
        const resp = await api.get(`/forum/topic/${slug}?page=1`);
        setTopic(resp.data.topic);
        setPosts(resp.data.posts);
        setPoll(resp.data.poll);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post reply');
    } finally {
      setReplying(false);
    }
  };

  const handleEditPost = async (postId: number) => {
    if (!editContent.trim()) return;

    try {
      await api.put(`/forum/post/${postId}`, { content: editContent });
      setEditingPost(null);
      setEditContent('');
      if (slug) {
        const resp = await api.get(`/forum/topic/${slug}?page=1`);
        setTopic(resp.data.topic);
        setPosts(resp.data.posts);
        setPoll(resp.data.poll);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to edit post');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    // Save original state for rollback
    const originalPosts = [...posts];
    const originalTopic = topic ? { ...topic } : null;

    try {
      // Optimistically update UI immediately
      setPosts(posts.filter(p => p.id !== postId));
      if (topic) {
        setTopic({
          ...topic,
          replies: Math.max(0, topic.replies - 1)
        });
      }

      // Then send delete request to backend
      await api.delete(`/forum/post/${postId}`);
    } catch (err: any) {
      // Revert optimistic update on error
      setPosts(originalPosts);
      if (originalTopic) setTopic(originalTopic);
      alert(err.response?.data?.error || 'Failed to delete post');
    }
  };

  const handleVotePoll = async (optionId: number) => {
    if (!poll) return;

    try {
      const response = await api.post(`/forum-actions/poll/${poll.id}/vote`, { optionId });
      setPoll({ ...poll, options: response.data.results, userVoted: true, userVote: optionId });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to vote');
    }
  };

  const toggleSubscribe = async () => {
    if (!topic) return;

    try {
      const response = await api.post(`/forum-actions/subscribe/topic/${topic.id}`);
      setTopic({ ...topic, isSubscribed: response.data.subscribed });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle subscription');
    }
  };

  const toggleBookmark = async () => {
    if (!topic) return;

    try {
      const response = await api.post(`/forum-actions/bookmark/${topic.id}`);
      setTopic({ ...topic, isBookmarked: response.data.bookmarked });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle bookmark');
    }
  };

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await api.post(`/forum/post/${postId}/vote`, { voteType });
      
      // Update the post in the posts array
      setPosts(posts.map(post => 
        post.id === postId 
          ? {
              ...post,
              upvotes: response.data.upvotes,
              downvotes: response.data.downvotes,
              user_vote: response.data.user_vote
            }
          : post
      ));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to vote');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="forum-topic-page">
        <div className="container">
          <div className="loading">Loading topic...</div>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="forum-topic-page">
        <div className="container">
          <div className="error">{error || 'Topic not found'}</div>
          <Link to="/forum" className="btn-back">← Back to Forums</Link>
        </div>
      </div>
    );
  }

  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0;

  return (
    <div className="forum-topic-page">
      <div className="container">
        <div className="topic-breadcrumb">
          <Link to="/forum">Forums</Link>
          <span className="separator">/</span>
          <span>{topic.category_name}</span>
          <span className="separator">/</span>
          <Link to={`/forum/${topic.forum_id}`}>{topic.forum_name}</Link>
          <span className="separator">/</span>
          <span className="current">{topic.title}</span>
        </div>

        <div className="topic-header">
          <div className="topic-info">
            <div className="topic-badges">
              {topic.pinned === 1 && <span className="badge badge-pinned">📌 Pinned</span>}
              {topic.locked === 1 && <span className="badge badge-locked">🔒 Locked</span>}
            </div>
            <h1>{topic.title}</h1>
            <div className="topic-meta">
              <span>{topic.replies} replies</span>
              <span>•</span>
              <span>{topic.views} views</span>
            </div>
          </div>
          {user && (
            <div className="topic-actions">
              <button 
                onClick={toggleSubscribe}
                className={`btn-action ${topic.isSubscribed ? 'active' : ''}`}
                title={topic.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              >
                {topic.isSubscribed ? '🔔' : '🔕'}
              </button>
              <button 
                onClick={toggleBookmark}
                className={`btn-action ${topic.isBookmarked ? 'active' : ''}`}
                title={topic.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                {topic.isBookmarked ? '⭐' : '☆'}
              </button>
              {(user.id === topic.user_id || user.role === 'admin') && (
                <button 
                  onClick={handleDeleteTopic}
                  className="btn-action btn-danger"
                  title="Delete Topic"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {poll && (
          <div className="poll-container">
            <h3>{poll.question}</h3>
            {poll.userVoted ? (
              <div className="poll-results">
                {poll.options.map(option => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(1) : 0;
                  return (
                    <div key={option.id} className={`poll-option ${poll.userVote === option.id ? 'user-voted' : ''}`}>
                      <div className="option-text">{option.option_text}</div>
                      <div className="option-bar">
                        <div className="option-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <div className="option-stats">
                        {option.votes} votes ({percentage}%)
                      </div>
                    </div>
                  );
                })}
                <div className="poll-total">Total votes: {totalVotes}</div>
              </div>
            ) : (
              <div className="poll-voting">
                {poll.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleVotePoll(option.id)}
                    className="poll-vote-btn"
                  >
                    {option.option_text}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="posts-list">
          {posts.map((post, index) => (
            <div key={post.id} className="post-card">
              {/* Left Sidebar - Author Info */}
              <div className="post-sidebar">
                <div className="post-author-info">
                  <img 
                    src={`https://mc-heads.net/head/${post.username === 'admin' ? 'maid' : post.username}`}
                    alt={post.username}
                    className="author-avatar"
                  />
                  <div className="author-name">
                    <UserDisplay
                      username={post.username}
                      minecraftUsername={post.minecraft_username}
                      totalDonated={post.total_donated}
                      donationRank={post.donation_rank}
                      size="small"
                      showIcon={false}
                      showBadge={true}
                    />
                  </div>
                  <div className="author-meta">
                    <div>Posts: {post.user_post_count}</div>
                    <div>Joined: Oct 2025</div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="post-main">
                {/* Compact Header */}
                <div className="post-header">
                  <div className="post-meta">
                    <span className="post-number">#{index + 1}</span>
                    <span className="post-separator">•</span>
                    <span className="post-date">{formatDate(post.created_at)}</span>
                  </div>
                  
                  {user && (user.id === post.user_id || user.role === 'admin') && (
                    <div className="post-actions">
                      {editingPost === post.id ? (
                        <>
                          <button onClick={() => handleEditPost(post.id)} className="action-btn save-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                              <polyline points="17,21 17,13 7,13 7,21"></polyline>
                              <polyline points="7,3 7,8 15,8"></polyline>
                            </svg>
                          </button>
                          <button onClick={() => setEditingPost(null)} className="action-btn cancel-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => {
                            setEditingPost(post.id);
                            setEditContent(post.content);
                          }} className="action-btn edit-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button onClick={() => handleDeletePost(post.id)} className="action-btn delete-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="post-content">
                  {editingPost === post.id ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="edit-textarea"
                      rows={10}
                    />
                  ) : (
                    <div 
                      className="post-body"
                      dangerouslySetInnerHTML={{ __html: post.content_html }}
                    />
                  )}

                  {post.edited_at && (
                    <div className="post-edited">
                      <svg className="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Last edited by {post.edited_by_username || 'Unknown'} on {formatDate(post.edited_at)}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="post-footer">
                  <div className="post-reactions">
                    <button 
                      className={`reaction-btn upvote-btn ${post.user_vote === 'up' ? 'active' : ''}`}
                      onClick={() => handleVote(post.id, 'up')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M7 10l5-5 5 5"></path>
                        <path d="M12 5v14"></path>
                      </svg>
                      <span>{post.upvotes || 0}</span>
                    </button>
                    <button 
                      className={`reaction-btn downvote-btn ${post.user_vote === 'down' ? 'active' : ''}`}
                      onClick={() => handleVote(post.id, 'down')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 14l-5 5-5-5"></path>
                        <path d="M12 19V5"></path>
                      </svg>
                      <span>{post.downvotes || 0}</span>
                    </button>
                  </div>
                  
                  <div className="post-engagement">
                    <button className="engagement-btn like-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                    <button className="engagement-btn reply-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {user && topic.locked === 0 ? (
          <div className="reply-form">
            <h3>Post a Reply</h3>
            <form onSubmit={handleReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply... (BBCode supported: [b], [i], [url], [img], [quote], [code])"
                rows={8}
                required
              />
              <div className="bbcode-help">
                BBCode: <code>[b]bold[/b]</code> <code>[i]italic[/i]</code> <code>[url=link]text[/url]</code> <code>[img]url[/img]</code> <code>[quote]text[/quote]</code> <code>[code]code[/code]</code>
              </div>
              <button type="submit" disabled={replying} className="btn-primary">
                {replying ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          </div>
        ) : !user ? (
          <div className="login-prompt">
            <p>Please <Link to="/login">log in</Link> to reply to this topic.</p>
          </div>
        ) : (
          <div className="locked-notice">
            🔒 This topic is locked. No new replies can be posted.
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumTopicPage;
