import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { broadcastSupportMessage, subscribeToSupportChat } from "../utils/supportChatChannel";
import api from "../services/api";

function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatBottomRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) return;

    // Fetch existing chat session for user
    api.get("/supportChats", { params: { userId: user.id } }).then((res) => {
      if (res.data.length > 0) {
        setMessages(res.data[0].messages || []);
      }
    });

    // Listen for real-time incoming admin messages
    const unsubscribe = subscribeToSupportChat((targetUserId, updatedChat) => {
      if (targetUserId === user.id) {
        setMessages(updatedChat.messages);
        toast.info("💬 New message from ShopSphere Support!");
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!user) {
      toast.warn("Please login to use live support chat.");
      return;
    }
    if (!inputMessage.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessage = { sender: "user", text: inputMessage.trim(), time: currentTime };
    const updatedMessages = [...messages, newMessage];

    try {
      const res = await api.get("/supportChats", { params: { userId: user.id } });
      let chatObj;

      if (res.data.length > 0) {
        const chatId = res.data[0].id;
        const patchRes = await api.patch(`/supportChats/${chatId}`, {
          messages: updatedMessages
        });
        chatObj = patchRes.data;
      } else {
        const postRes = await api.post("/supportChats", {
          userId: user.id,
          userName: user.name,
          messages: updatedMessages,
          status: "active"
        });
        chatObj = postRes.data;
      }

      setMessages(updatedMessages);
      setInputMessage("");
      broadcastSupportMessage(user.id, chatObj);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
    }
  }

  if (!user) return null; // Only show widget for logged-in users

  return (
    <div className="live-support-wrapper">
      {!isOpen ? (
        <button className="support-launcher-btn" onClick={() => setIsOpen(true)}>
          💬 Live Support
        </button>
      ) : (
        <div className="support-chat-window">
          <div className="support-chat-header">
            <div>
              <strong>ShopSphere Support Desk</strong>
              <span className="support-online-dot">● Online</span>
            </div>
            <button className="close-chat-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="support-messages-body">
            {messages.length === 0 ? (
              <p className="support-welcome-text">👋 Hello! How can our support team help you today?</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`support-bubble ${msg.sender === "user" ? "user-bubble" : "admin-bubble"}`}>
                  <p>{msg.text}</p>
                  <span className="msg-time">{msg.time}</span>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="support-input-form">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default LiveSupportWidget;