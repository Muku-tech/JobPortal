import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import '../styles/EmployerApplications.css' // Reuse ATS styles

const ApplicationMessages = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    const markMessagesRead = async () => {
      try {
        await api.put(`/applications/${id}/messages/read-all`)
        console.log('✅ Messages auto-marked as read for employer notification')
      } catch (error) {
        console.error('Mark read error:', error)
      }
    }
    markMessagesRead()
    fetchMessages()
  }, [id])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/applications/${id}/messages`)
      setMessages(response.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const messageText = formData.get('message').trim()
    
    if (!messageText) return

    try {
      setSendingMessage(true)
      // Note: Would need POST /applications/:id/messages endpoint
      // For now, simulate with optimistic update
      const newMessage = {
        id: Date.now(),
        application_id: id,
        sender_id: 'current_user',
        recipient_id: 'applicant',
        message: messageText,
        type: 'user',
        read: false,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, newMessage])
      e.target.reset()
      fetchMessages() // Sync with server
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return <div className="loading-state">Loading messages...</div>
  }

  return (
    <div className="messages-container">
      <header className="messages-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back to Applications
        </button>
        <h1>Messages</h1>
      </header>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet for this application
          </div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className={`message ${msg.type} ${msg.sender_id === 'current_user' ? 'own' : ''}`}
            >
              <div className="message-content">
                <p>{msg.message}</p>
                <span className="message-time">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <textarea
          name="message"
          placeholder="Type your message..."
          rows="3"
          disabled={sendingMessage}
        ></textarea>
        <button type="submit" disabled={sendingMessage}>
          {sendingMessage ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}

export default ApplicationMessages

