import { useLocation } from "react-router-dom";
import "./index.css";
import { useState, useRef, useEffect } from "react";
import { connectWS } from "./ws";

export default function Chat() {
  const socket = useRef(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);        // text messages
  const [photos, setPhotos] = useState([]);            // renamed for clarity
  const [totalUsers, setTotalUsers] = useState(0);
  const location = useLocation();
  const username = location.state?.userName || "guest";

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!input.trim()) return;

    socket.current.emit("sendMessage", {
      text: input,
      sender: username,
      timestamp: Date.now(),
    });

    setInput("");
  };

  const handleImageSend = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result; // data:image/jpeg;base64,...

      socket.current.emit("sendPhoto", {
        image: base64data,
        sender: username,
        timestamp: Date.now(),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset input
  };

  useEffect(() => {
    socket.current = connectWS();

    socket.current.on("user:joined", (data) => {
      console.log("User connected:", data.username);
    });

    socket.current.on("totalperson", (count) => {
      setTotalUsers(count);
    });

    socket.current.on("message", (msg) => {
      if (!msg || typeof msg !== "object") return;
      setMessages((prev) => [...prev, { ...msg, type: "text" }]);
    });

    socket.current.on("photo", (pho) => {
      if (!pho || typeof pho !== "object") return;
      setPhotos((prev) => [...prev, { ...pho, type: "image" }]);
    });

    socket.current.emit("user:join", username);

    return () => {
      socket.current.off("message");
      socket.current.off("photo");
      socket.current.disconnect();
    };
  }, [username]);

  // Combine messages + photos and sort by timestamp
  const allMessages = [...messages, ...photos].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  return (
    <div className="chat-app-container">
      <div className="userinfo">
        <div className="user-info-left">
          <span className="joined-as">
            Joined as: <strong>{username}</strong>
          </span>
        </div>
        <div className="user-info-right">
          Total members: <strong>{totalUsers}</strong>
        </div>
      </div>

      <div className="chatbox">
        <div className="messageside">
          {allMessages.map((item, index) => {
            const isOwnMessage = item.sender === username;
            const time = new Date(item.timestamp || Date.now());
            const hour = time.getHours().toString().padStart(2, "0");
            const min = time.getMinutes().toString().padStart(2, "0");

            return (
              <div
                key={index}
                className={`message-wrapper ${isOwnMessage ? "own" : "other"}`}
              >
                <div className="message-bubble">
                  {!isOwnMessage && (
                    <span className="message-sender">{item.sender}</span>
                  )}

                  {item.type === "text" ? (
                    <div className="message-content">{item.text}</div>
                  ) : (
                    <img
                      src={item.image}
                      alt="shared"
                      className="shared-image"
                    />
                  )}

                  <span className="message-time">
                    {hour}:{min}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="inputside">
          <input
            placeholder="Type a message..."
            className="input2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="button2" onClick={handleSend}>
            Send
          </button>

          <div className="upload">
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              hidden
              onChange={handleImageSend}
            />
            <label htmlFor="fileInput" className="upload-btn">
              📎
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}