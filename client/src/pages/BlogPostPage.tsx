import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './BlogPostPage.css';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  author_name: string;
  featured_image: string | null;
  created_at: string;
  updated_at: string;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      const response = await api.get(`/blog/slug/${slug}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error loading blog post:', error);
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
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Blog Post Not Found</h3>
          <Link to="/blog" className="btn btn-primary">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-page">
      <div className="container-narrow">
        <Link to="/blog" className="back-link">
          ← Back to Blog
        </Link>

        <article className="blog-post animate-fadeIn">
          {post.featured_image && (
            <div className="post-featured-image">
              <img src={post.featured_image} alt={post.title} />
            </div>
          )}

          <header className="post-header">
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              <span className="post-author">By {post.author_name}</span>
              <span className="post-date">{formatDate(post.created_at)}</span>
            </div>
          </header>

          <div 
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.updated_at !== post.created_at && (
            <div className="post-footer">
              <em>Last updated: {formatDate(post.updated_at)}</em>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default BlogPostPage;
