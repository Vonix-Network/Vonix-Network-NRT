import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './EventPage.css';

interface EventAttendee {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  status: string;
  joined_at: string;
}

interface EventDetails {
  id: number;
  title: string;
  description: string;
  date: string;
  location?: string;
  created_at: string;
  created_by_username: string;
  attendee_count: number;
  is_attending: boolean;
  is_creator: boolean;
  attendees: EventAttendee[];
}

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (eventId) {
      loadEvent();
    }
  }, [user, eventId, navigate]);

  const loadEvent = async () => {
    try {
      const response = await api.get(`/social/events/${eventId}`);
      setEvent(response.data);
    } catch (error: any) {
      console.error('Error loading event:', error);
      if (error.response?.status === 404) {
        navigate('/social?tab=events');
      }
    } finally {
      setLoading(false);
    }
  };

  const attendEvent = async () => {
    if (!event) return;
    try {
      await api.post(`/social/events/${event.id}/attend`);
      await loadEvent(); // Reload to get updated attendee list
    } catch (error: any) {
      console.error('Error attending event:', error);
      alert(error.response?.data?.error || 'Failed to attend event');
    }
  };

  const unattendEvent = async () => {
    if (!event) return;
    if (!window.confirm('Are you sure you want to stop attending this event?')) return;
    
    try {
      await api.post(`/social/events/${event.id}/unattend`);
      await loadEvent(); // Reload to get updated attendee list
    } catch (error: any) {
      console.error('Error unattending event:', error);
      alert(error.response?.data?.error || 'Failed to unattend event');
    }
  };

  const getUserAvatar = (attendee: EventAttendee) => {
    const username = attendee.minecraft_username || attendee.username;
    const displayUsername = username === 'admin' ? 'maid' : username;
    return `https://mc-heads.net/head/${displayUsername}`;
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isEventPast = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  if (loading) {
    return (
      <div className="event-loading">
        <div className="spinner"></div>
        <p>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-not-found">
        <h2>Event not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/social?tab=events')}>
          Back to Events
        </button>
      </div>
    );
  }

  const eventPast = isEventPast(event.date);

  return (
    <div className="event-page minecraft-theme">
      <div className="event-container">
        {/* Event Header */}
        <div className="event-header">
          <div className="event-info">
            <h1 className="event-title">{event.title}</h1>
            <div className="event-meta">
              <div className="event-date">
                <span className="date-icon">📅</span>
                <span className={eventPast ? 'past-event' : 'upcoming-event'}>
                  {formatDateTime(event.date)}
                  {eventPast && <span className="past-label"> (Past Event)</span>}
                </span>
              </div>
              {event.location && (
                <div className="event-location">
                  <span className="location-icon">📍</span>
                  <span>{event.location}</span>
                </div>
              )}
              <div className="event-creator">
                <span>Created by {event.created_by_username}</span>
              </div>
              <div className="attendee-count">
                <span>{event.attendee_count} attending</span>
              </div>
            </div>
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}
          </div>

          <div className="event-actions">
            {!eventPast && (
              <>
                {event.is_attending ? (
                  <div className="attending-controls">
                    <span className="attending-status">Attending</span>
                    {!event.is_creator && (
                      <button className="btn btn-secondary" onClick={unattendEvent}>
                        Can't Attend
                      </button>
                    )}
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={attendEvent}>
                    Attend Event
                  </button>
                )}
              </>
            )}
            {eventPast && event.is_attending && (
              <span className="attended-status">You attended this event</span>
            )}
          </div>
        </div>

        {/* Event Attendees */}
        <div className="event-attendees-section">
          <h2>
            {eventPast ? 'Attendees' : 'Who\'s Attending'} ({event.attendee_count})
          </h2>
          <div className="attendees-grid">
            {event.attendees.map((attendee) => (
              <div key={attendee.id} className="attendee-card">
                <img 
                  src={getUserAvatar(attendee)} 
                  alt={attendee.username} 
                  className="attendee-avatar"
                />
                <div className="attendee-info">
                  <span className="attendee-name">
                    {attendee.minecraft_username || attendee.username}
                  </span>
                  <span className="attendee-joined">
                    {eventPast ? 'Attended' : `Joined ${formatDate(attendee.joined_at)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {event.attendees.length === 0 && (
            <div className="no-attendees">
              <p>No one is attending this event yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPage;
