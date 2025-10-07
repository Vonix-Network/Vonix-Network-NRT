import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ForumNewTopicPage.css';

interface Forum {
  id: number;
  name: string;
  description: string;
  locked: number;
}

const ForumNewTopicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [forum, setForum] = useState<Forum | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createPoll, setCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    const run = async () => {
      try {
        const response = await api.get(`/forum/forum/${id}`);
        setForum(response.data.forum);
        if (response.data.forum.locked === 1 && user?.role !== 'admin') {
          setError('This forum is locked');
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load forum');
        setLoading(false);
      }
    };
    run();
  }, [id, user, navigate]);

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    if (createPoll) {
      if (!pollQuestion.trim()) {
        alert('Poll question is required');
        return;
      }
      
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('At least 2 poll options are required');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const topicData: any = {
        title: title.trim(),
        content: content.trim()
      };

      if (createPoll) {
        topicData.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.filter(opt => opt.trim()),
          maxVotes: 1,
          allowRevote: false
        };
      }

      const response = await api.post(`/forum/forum/${id}/topic`, topicData);
      
      // Navigate to the new topic
      navigate(`/forum/topic/${response.data.slug}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create topic');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="forum-new-topic-page">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !forum) {
    return (
      <div className="forum-new-topic-page">
        <div className="container">
          <div className="error">{error || 'Forum not found'}</div>
          <Link to="/forum" className="btn-back">← Back to Forums</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-new-topic-page">
      <div className="container">
        <div className="page-header">
          <h1>Create New Topic</h1>
          <p>in <strong>{forum.name}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="new-topic-form">
          <div className="form-group">
            <label htmlFor="title">Topic Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your topic"
              maxLength={200}
              required
            />
            <small>{title.length}/200 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content... (BBCode supported)"
              rows={15}
              required
            />
            <div className="bbcode-help">
              <strong>BBCode supported:</strong> 
              <code>[b]bold[/b]</code>
              <code>[i]italic[/i]</code>
              <code>[u]underline[/u]</code>
              <code>[url=link]text[/url]</code>
              <code>[img]url[/img]</code>
              <code>[quote]text[/quote]</code>
              <code>[code]code[/code]</code>
              <code>[color=red]text[/color]</code>
            </div>
          </div>

          <div className="form-group poll-section">
            <div className="poll-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={createPoll}
                  onChange={(e) => setCreatePoll(e.target.checked)}
                />
                Add a poll to this topic
              </label>
            </div>

            {createPoll && (
              <div className="poll-creator">
                <div className="form-group">
                  <label htmlFor="poll-question">Poll Question *</label>
                  <input
                    type="text"
                    id="poll-question"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="What question do you want to ask?"
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label>Poll Options * (minimum 2)</label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="poll-option-input">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        maxLength={100}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(index)}
                          className="btn-remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={addPollOption}
                      className="btn-add-option"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Topic'}
            </button>
          </div>
        </form>

        <div className="preview-section">
          <h3>Preview</h3>
          <div className="preview-content">
            {title ? <h4>{title}</h4> : <p className="preview-placeholder">Your title will appear here</p>}
            {content ? (
              <div className="preview-body">{content}</div>
            ) : (
              <p className="preview-placeholder">Your content will appear here</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumNewTopicPage;
