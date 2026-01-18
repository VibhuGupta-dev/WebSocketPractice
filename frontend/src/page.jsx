import { useLocation } from "react-router-dom";
import "./index.css";
import { useState } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hello!", sender: "other", time: new Date() },
    { text: "How are you?", sender: "other", time: new Date() },
  ]); 
 const [totalmembers , setTotalmembers] = useState([])
  const location = useLocation();
 const recivestate= location.state || {};
const username  = recivestate.userName || 'guest'

  const handleSend = () => {
    if (!message.trim()) return;

    const now = new Date();
    const newMessage = {
      text: message,
      sender: "you",
      time: now,
    };
    setMessages([...messages, newMessage]);
    setMessage("");
  };

  const formatTime = (date) => {
    const hour = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    return `${hour}:${min}`;
  };

  return (
    <>
      <div className="chat-app-container">
        <div className="userinfo">
          <div className="username">Joined As: {username}</div>
          <div className="totaljoin">Total Members : {totalmembers.length}</div>
        </div>
        <div className="chatbox">
          <div className="messageside">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender === "you" ? "you" : ""}`}
              >
                <p>
                  {msg.text}  <br></br>
                  <span className="time">{username}{" "}{formatTime(msg.time)}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="inputside">
            <input
              className="input2"
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="button2" type="button" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}