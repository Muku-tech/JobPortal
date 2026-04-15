import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import '../styles/Messages.css';  // Create this CSS next

function Messages() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');  // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      const data = response.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  if (loading) return <div className="messages-loading"><RefreshCw className="spin" /></div>;

  return (
    <div className="messages-page">
      <header className="messages-header">
        <div className="header-left">
          <Bell size={28} />
          <div>
            <h1>Messages & Notifications</h1>
            <p>{unreadCount} unread</p>
          </div>
        </div>
        <button onClick={markAllRead} className="mark-all-btn" disabled={unreadCount === 0}>
          Mark All Read
        </button>
      </header>

      <div className="filter-tabs">
        <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({notifications.length})
        </button>
        <button className={`tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
          Unread ({unreadCount})
        </button>
        <button className={`tab ${filter === 'read' ? 'active' : ''}`} onClick={() => setFilter('read')}>
          Read
        </button>
      </div>

      <div className="messages-list">
        {filteredNotifs.length === 0 ? (
          <div className="empty-state">
            <Bell size={64} />
            <h3>No messages yet</h3>
            <p>Status updates and important notices will appear here.</p>
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div key={notif.id} className={`message-card ${notif.read ? 'read' : 'unread'}`}>
              <div className="message-header">
                <h4>{notif.title}</h4>
                <div className="actions">
                  {!notif.read && (
                    <button onClick={() => markAsRead(notif.id)} className="read-btn">
                      <Check size={16} /> Read
                    </button>
                  )}
                </div>
              </div>
              <p className="message-body">{notif.message}</p>
              <div className="message-meta">
                <span>{new Date(notif.createdAt).toLocaleString()}</span>
                {notif.type === 'status_update' && <span className="type-badge">Application Update</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Messages;

