import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ForumTopicPage.css';

interface Post {
  id: number;
  content: string;
  content_html: string;
  username: string;
  minecraft_uuid?: string;
  role: string;
  user_post_count: number;
  bio?: string;
  created_at: string;
  edited_at?: string;
  edited_by_username?: string;
  user_id: number;
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

    try {
      await api.delete(`/forum/post/${postId}`);
      if (slug) {
        const resp = await api.get(`/forum/topic/${slug}?page=1`);
        setTopic(resp.data.topic);
        setPosts(resp.data.posts);
        setPoll(resp.data.poll);
      }
    } catch (err: any) {
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
            <div key={post.id} className="post-item">
              <div className="post-sidebar">
                <div className="post-author">
                  {post.minecraft_uuid ? (
                    <img 
                      src={`https://crafatar.com/avatars/${post.minecraft_uuid}?size=80&overlay`}
                      alt={post.username}
                      className="author-avatar"
                    />
                  ) : (
                    <div className="author-avatar-placeholder">{post.username[0].toUpperCase()}</div>
                  )}
                  <h4>{post.username}</h4>
                  <span className={`user-role role-${post.role}`}>{post.role}</span>
                </div>
                <div className="author-stats">
                  <div className="stat">Posts: {post.user_post_count}</div>
                </div>
              </div>

              <div className="post-content">
                <div className="post-header">
                  <span className="post-number">#{index + 1}</span>
                  <span className="post-date">{formatDate(post.created_at)}</span>
                  {user && (user.id === post.user_id || user.role === 'admin') && (
                    <div className="post-actions">
                      {editingPost === post.id ? (
                        <>
                          <button onClick={() => handleEditPost(post.id)} className="btn-save">Save</button>
                          <button onClick={() => setEditingPost(null)} className="btn-cancel">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => {
                            setEditingPost(post.id);
                            setEditContent(post.content);
                          }} className="btn-edit">Edit</button>
                          <button onClick={() => handleDeletePost(post.id)} className="btn-delete">Delete</button>
                        </>
                      )}
                    </div>
                  )}
                </div>

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
                    Last edited by {post.edited_by_username || 'Unknown'} on {formatDate(post.edited_at)}
                  </div>
                )}
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
