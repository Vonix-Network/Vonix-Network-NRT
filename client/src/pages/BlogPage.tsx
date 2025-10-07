import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './BlogPage.css';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author_name: string;
  featured_image: string | null;
  created_at: string;
}

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await api.get('/blog');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <div className="container">
        <div className="page-header animate-fadeIn">
          <h1 className="page-title">📝 Blog</h1>
          <p className="page-subtitle">
            Latest news, updates, and announcements from Vonix.Network
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Blog Posts Yet</h3>
            <p>Check back soon for updates!</p>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="blog-card animate-slideInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {post.featured_image && (
                  <div className="blog-image">
                    <img src={post.featured_image} alt={post.title} />
                  </div>
                )}
                <div className="blog-content">
                  <h2 className="blog-title">{post.title}</h2>
                  <div className="blog-meta">
                    <span className="blog-author">By {post.author_name}</span>
                    <span className="blog-date">{formatDate(post.created_at)}</span>
                  </div>
                  {post.excerpt && (
                    <p className="blog-excerpt">{post.excerpt}</p>
                  )}
                  <span className="read-more">Read More →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
