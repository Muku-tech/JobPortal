import { useState, useEffect, useCallback } from 'react';

import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import '../styles/Messages.css';

function Messages() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');  
  const [expandedMessageId, setExpandedMessageId] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching messages from API...');
      const response = await api.get('/messages');
      const data = response.data || [];
      console.log(`📊 Received ${data.length} messages`);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
      // Close all expanded on refresh
      setExpandedMessageId(null);
    } catch (error) {
      console.error('❌ Error fetching messages:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/messages/${id}/read`);
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
      await api.put('/messages/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setExpandedMessageId(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleMessage = async (id, isRead) => {
    if (!isRead) {
      await markAsRead(id);
      setExpandedMessageId(id);
    } else {
      setExpandedMessageId(prev => prev === id ? null : id);
    }
  };

  const getTopic = (notif) => {
    return notif.sender?.name || 'System';
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
        <div className="header-right">
          <button onClick={fetchMessages} className="refresh-btn" title="Refresh" disabled={loading}>
            <RefreshCw size={20} />
          </button>
          <button onClick={markAllRead} className="mark-all-btn markallread" disabled={unreadCount === 0}>
            Mark All Read
          </button>
        </div>
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
            <h3>No messages ({filter})</h3>
            <p>Check browser console for API response. Try refresh button.</p>
            <details>
              <summary>Debug Info</summary>
              <pre>Total notifications: {notifications.length}</pre>
              <pre>Unread count: {unreadCount}</pre>
            </details>
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div 
              key={notif.id} 
              className={`message-card ${notif.read ? 'read' : 'unread'} ${expandedMessageId === notif.id ? 'expanded' : ''}`}
              onClick={() => toggleMessage(notif.id, notif.read)}
            >
              <div className="message-preview">
                <h4>{getTopic(notif)}</h4>
                <span className="preview-time">{new Date(notif.createdAt).toLocaleDateString()}</span>
              </div>
              
              {expandedMessageId === notif.id && (
                <div className="message-content">
                  <div className="message-header">
                    <h4>{getTopic(notif)}</h4>
                  </div>
                  <p className="message-body">{notif.message}</p>
                  <div className="message-meta">
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    {notif.type === 'status_update' && <span className="type-badge">Application Update</span>}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Messages;

