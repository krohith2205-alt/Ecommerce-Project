import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { broadcastSupportMessage, subscribeToSupportChat } from "../utils/supportChatChannel";
import api from "../services/api";

function AdminSupportInbox() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [adminReply, setAdminReply] = useState("");

  useEffect(() => {
    fetchChats();

    const unsubscribe = subscribeToSupportChat((userId, updatedChat) => {
      setChats((prev) => {
        const exists = prev.some((c) => c.id === updatedChat.id);
        if (exists) {
          return prev.map((c) => (c.id === updatedChat.id ? updatedChat : c));
        } else {
          return [updatedChat, ...prev];
        }
      });
      if (selectedChat?.userId === userId) {
        setSelectedChat(updatedChat);
      }
    });

    return () => unsubscribe();
  }, [selectedChat]);

  async function fetchChats() {
    try {
      const res = await api.get("/supportChats");
      setChats(res.data);
      if (res.data.length > 0 && !selectedChat) {
        setSelectedChat(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendAdminReply(e) {
    e.preventDefault();
    if (!adminReply.trim() || !selectedChat) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { sender: "admin", text: adminReply.trim(), time: currentTime };
    const updatedMessages = [...(selectedChat.messages || []), newMsg];

    try {
      const res = await api.patch(`/supportChats/${selectedChat.id}`, {
        messages: updatedMessages
      });

      setSelectedChat(res.data);
      setChats((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)));
      setAdminReply("");
      broadcastSupportMessage(selectedChat.userId, res.data);
      toast.success("Reply sent to customer!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reply.");
    }
  }

  return (
    <div className="admin-support-container">
      <h2>🎧 Live Customer Support Desk</h2>
      
      <div className="support-inbox-grid">
        {/* Chat Sessions Sidebar */}
        <div className="chats-sidebar">
          <h3>Customer Conversations</h3>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-sidebar-item ${selectedChat?.id === chat.id ? "active" : ""}`}
              onClick={() => setSelectedChat(chat)}
            >
              <strong>{chat.userName}</strong>
              <p>{chat.messages?.[chat.messages.length - 1]?.text || "No messages yet"}</p>
            </div>
          ))}
        </div>

        {/* Active Chat Conversation Panel */}
        <div className="chat-conversation-panel">
          {selectedChat ? (
            <>
              <div className="panel-chat-header">
                <h3>Chat with {selectedChat.userName}</h3>
              </div>
              <div className="panel-messages-list">
                {selectedChat.messages.map((m, i) => (
                  <div key={i} className={`admin-bubble-row ${m.sender === "admin" ? "admin-sent" : "user-sent"}`}>
                    <div className="bubble-content">
                      <span className="sender-tag">{m.sender === "admin" ? "You (Admin)" : selectedChat.userName}</span>
                      <p>{m.text}</p>
                      <small>{m.time}</small>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendAdminReply} className="admin-reply-form">
                <input
                  type="text"
                  placeholder="Type support reply..."
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                />
                <button type="submit">Send Reply</button>
              </form>
            </>
          ) : (
            <p className="no-chat-selected">Select a conversation from the left.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSupportInbox;