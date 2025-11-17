// client/src/App.js
import React, { useState, useRef, useEffect } from "react";
import "./App.css"; // We'll create this CSS file next
import ReactMarkdown from "react-markdown";
import "leaflet/dist/leaflet.css";
import MapComponent from "./MapComponent";
import "./UserManualModal.css";
import UserManualModal from "./UserManualModal";
import { motion } from "framer-motion";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! How can I help you with campus information today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const mapCompRef = useRef();

  const openMapModal = () => setIsMapModalOpen(true);
  const closeMapModal = () => {
    setIsMapModalOpen(false);
    // Stop navigation if the map component is running
    mapCompRef.current?.stopNavigation();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatBotResponse = (response) => {
    if (!response || !response.type) {
      return "Received an invalid response from the server.";
    }
    if (response.type === "unknown") {
      return response.response; // Directly return the 'I didn't understand' message
    }
    // client/src/App.js

    if (response.type === "simple_message") {
      return response.response ? (
        // Use ReactMarkdown to render the content
        <div className="markdown-message">
          <ReactMarkdown>{response.response}</ReactMarkdown>
        </div>
      ) : (
        "Sorry, received an empty message."
      );
    }

    if (response.type === "subject_info" && response.data) {
      const item = response.data;
      return (
        <div className="subject-card">
          <h3 className="subject-name">
            {item.subjectCode} - {item.name}
          </h3>
          <div className="subject-details">
            <p>
              <strong>Credits:</strong> {item.credit}
            </p>
            <p>
              <strong>is core?:</strong> {item.isCore}
            </p>
          </div>
        </div>
      );
    }
    if (response.type === "dispensary_info" && response.data) {
      const info = response.data;
      return (
        <div className="info-card">
          <h3 className="info-card-title">{info.name}</h3>

          <div className="info-card-item">
            {/* Location Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 10A7 7 0 103 10c0 2.493 1.698 4.988 3.35 6.586.829.799 1.654 1.381 2.274 1.765.31.193.57.337.757.433.096.05.192.099.281.14l.018.008.006.003zM10 11.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <strong>Location:</strong>
              <span>{info.location}</span>
            </div>
          </div>

          <div className="info-card-item">
            {/* Clock Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5H10V5z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <strong>Hours:</strong>
              {info.hours.map((h, i) => (
                <span key={i} className="hours-row">
                  {h.days}: {h.times}
                </span>
              ))}
            </div>
          </div>

          <div className="info-card-item">
            {/* Phone Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.23.115a.75.75 0 00-.417.82V12.5c0 .621.504 1.125 1.125 1.125H9.75v-2.125c0-.621.504-1.125 1.125-1.125h2.625c.621 0 1.125.504 1.125 1.125V12.5h.125c.621 0 1.125-.504 1.125-1.125v-1.379a.75.75 0 00-.417-.82l-.23-.115a1.5 1.5 0 01-1.052-1.767l.716-3.223A1.5 1.5 0 0115.352 2H16.5A1.5 1.5 0 0118 3.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 16.5v-13z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <strong>Phone:</strong>
              <span>{info.phone}</span>
            </div>
          </div>
        </div>
      );
    }
    if (response.type === "cafeteria_info" && response.data) {
      const info = response.data;
      return (
        <div className="cafeteria-card">
          <h4 className="cafeteria-title">{info.name}</h4>
          <div className="cafe-images">
            <div className="image-wrapper">
              <h5>Menu</h5>
              <img
                src={info.menuImageUrl}
                alt={`${info.name} Menu`}
                className="chat-image"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.insertAdjacentHTML(
                    "beforeend",
                    '<p class="image-error">Menu image not available.</p>'
                  );
                }}
              />
            </div>
            <div className="image-wrapper">
              <h5>Scan to Pay</h5>
              <img
                src={info.scannerImageUrl}
                alt={`${info.name} Scanner`}
                className="scanner-image"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.insertAdjacentHTML(
                    "beforeend",
                    '<p class="image-error">Scanner not available.</p>'
                  );
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    if (response.type === "timetable_display" && response.data) {
      const { title, schedule } = response.data;
      return (
        <div className="timetable-container">
          {/* Use ReactMarkdown to render bold text in the title */}
          <h4 className="timetable-title">
            <ReactMarkdown>{title}</ReactMarkdown>
          </h4>
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.time}</td>
                  <td>{item.subject}</td>
                  <td>{item.type}</td>
                  <td>{item.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (response.data && Array.isArray(response.data)) {
      // Handle array of data
      if (response.data.length === 0) {
        // Handle empty results
        if (
          response.type === "faculty" ||
          response.type === "clarification_needed"
        ) {
          return "I couldn't find any faculty members matching that name.";
        }
        if (response.type === "mess_menu") {
          return "No mess menu information found.";
        }
        return `No details found for ${response.type}.`;
      }
      switch (response.type) {
        // Inside formatBotResponse -> switch statement

        case "faculty_info": // Handles both single and multiple results now
          // Handle no results found by backend
          if (!response.data || response.data.length === 0) {
            return "I couldn't find any faculty members matching that name.";
          }

          // --- Display SINGLE faculty result as a detailed card ---
          if (response.data.length === 1) {
            const item = response.data[0];
            return (
              // Use classes assuming you added faculty card CSS
              <div className="faculty-card">
                <h3 className="faculty-name">{item.Name}</h3>
                {/* Use Specialization if available, else Department */}
                <p className="faculty-department">
                  {item.Specialization || item.Department || "N/A"}
                </p>
                <div className="faculty-contact-info">
                  {/* FIX: Use item.Office */}
                  {item.Office && (
                    <p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        width="16"
                        height="16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a1 1 0 01.293-.707l7-7zM12 11a1 1 0 11-2 0 1 1 0 012 0z"
                          clipRule="evenodd"
                        />
                      </svg>{" "}
                      <span>{item.Office}</span>
                    </p>
                  )}
                  {/* ADD Email */}
                  {item.Email && (
                    <p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        width="16"
                        height="16"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>{" "}
                      <span>{item.Email}</span>
                    </p>
                  )}
                </div>
                {item.link && (
                  <a
                    href={item.link}
                    className="faculty-profile-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {" "}
                    View Profile{" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width="14"
                      height="14"
                    >
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>{" "}
                  </a>
                )}
              </div>
            );
          }
          // --- Display MULTIPLE faculty results (or clarification_needed/faculty_list) ---
          // else {
          //      return (
          //         <div>
          //           {/* Message depends on whether backend asked for clarification */}
          //           <p>{response.type === 'faculty' ? "Here are some faculty members I found:" : "I found a few people matching that name. Please choose a department or provide more details:"}</p>
          //           {/* You might want clarification buttons here if type is 'clarification_needed' */}
          //           <ul className="faculty-clarification-list">
          //             {response.data.map((item, idx) => (
          //               <li key={idx}>
          //                 <strong>{item.Name}</strong> ({item.Department || item.Specialization || "N/A"})
          //               </li>
          //             ))}
          //           </ul>
          //            {response.type === 'faculty' && <p>Try refining your search!</p>}
          //         </div>
          //       );
          // }
          else {
            // Handles faculty_list, clarification_needed, or faculty with >1 result
            return (
              <div>
                {/* Updated message */}
                <p className="response-title">
                  I found multiple faculty members matching your query:
                </p>
                {/* Use the faculty-grid to display multiple cards */}
                <div className="faculty-grid">
                  {response.data.map((item) => (
                    // Render the full faculty card for each item
                    <div key={item.FacultyID} className="faculty-card">
                      <h3 className="faculty-name">{item.Name}</h3>
                      <p className="faculty-department">
                        {item.Specialization || item.Department || "N/A"}
                      </p>
                      <div className="faculty-contact-info">
                        {item.Office && (
                          <p>
                            <svg /* Office Icon */></svg>{" "}
                            <span>{item.Office}</span>
                          </p>
                        )}
                        {item.Email && (
                          <p>
                            <svg /* Email Icon */></svg>{" "}
                            <span>{item.Email}</span>
                          </p>
                        )}
                      </div>
                      {item.link && (
                        <a
                          href={item.link}
                          className="faculty-profile-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {" "}
                          View Profile <svg /* Link Icon */></svg>{" "}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        // Note: break; is not needed here since we always return
        case "timetable":
          return (
            <div>
              <p>Here's some timetable information:</p>
              <ul>
                {response.data.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.course_name || "N/A"}</strong> -{" "}
                    {item.day_of_week || "N/A"}, {item.start_time || "N/A"} in{" "}
                    {item.location || "N/A"}
                  </li>
                ))}
              </ul>
              <p>
                Please specify a course or faculty for more detailed timetable!
              </p>
            </div>
          );
        case "mess_menu":
          return (
            <div>
              <p>Here's what I found for the mess menu:</p>
              <ul>
                {response.data.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.meal_type || "N/A"}:</strong>{" "}
                    {item.items || "No items listed"} (Date:{" "}
                    {new Date(item.menu_date).toLocaleDateString() || "N/A"})
                  </li>
                ))}
              </ul>
              <p>Please specify a meal type or date for precise info.</p>
            </div>
          );
        // Add cases for other types like 'cafeteria', 'navigation'
        case "faculty_list":
          // return (
          //   <div>
          //     <p>
          //       I found a few people with that name. Who are you looking for?
          //     </p>
          //     <ul>
          //       {response.data.map((item, idx) => (
          //         <li key={idx}>
          //           <strong>{item.Name}</strong>
          //         </li>
          //       ))}
          //     </ul>
          //   </div>
          // );
          return (
            <div>
              {/* Updated message */}
              <p className="response-title">
                I found multiple faculty members matching your query:
              </p>
              {/* Use the faculty-grid to display multiple cards */}
              <div className="faculty-grid">
                {response.data.map((item) => (
                  // Render the full faculty card for each item
                  <div key={item.FacultyID} className="faculty-card">
                    <h3 className="faculty-name">{item.Name}</h3>
                    <p className="faculty-department">
                      {item.Specialization || item.Department || "N/A"}
                    </p>
                    <div className="faculty-contact-info">
                      {item.Office && (
                        <p>
                          <svg /* Office Icon */></svg>{" "}
                          <span>{item.Office}</span>
                        </p>
                      )}
                      {item.Email && (
                        <p>
                          <svg /* Email Icon */></svg> <span>{item.Email}</span>
                        </p>
                      )}
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        className="faculty-profile-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {" "}
                        View Profile <svg /* Link Icon */></svg>{" "}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        default:
          return JSON.stringify(response.data); // Fallback for other data types
      }
    } else {
      // If no specific data is returned, or data is empty, provide a generic message
      return `I found information related to ${response.type}, but no specific details could be displayed at this moment, or my database for this is empty.`;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setInput(""); // Clear input immediately
    const API_URL = process.env.REACT_APP_API_URL;

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        // <-- This line changed  method: "POST",
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }), // Use userMessage.text here
      });

      const data = await res.json();

      console.log("Data received from backend:", data);

      const formattedResponse = formatBotResponse(data);
      const botMessage = { from: "bot", text: formattedResponse };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (err) {
      console.error("Error contacting backend:", err);
      const errorMessage = {
        from: "bot",
        text: "Sorry, I couldn't connect to the campus server. Please try again later.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>CampusGPT</h1>
        <p>Your AI Campus Assistant</p>
      </header>
      <div className="chat-window">
        <div className="message-list">
          {messages.map((msg, index) => (
            
            <div key={index} className={`message ${msg.from}`}>
              <div className="message-bubble">
                {typeof msg.text === "string" ? <p>{msg.text}</p> : msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="input-bar">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Bot is typing..." : "Ask something..."}
            disabled={isLoading}
          />
          <button
            className="user-manual-button"
            onClick={() => setIsModalOpen(true)}
            type="button" // Good practice to prevent form submission if it's inside a form
          >
            ℹ️ Guide
          </button>
          <button
            type="button" // Important: not 'submit'
            onClick={openMapModal} // Open the modal
            className="nav-button"
            title="Open Campus Map"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button type="submit" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
      {isMapModalOpen && (
        <div className="map-modal-overlay" onClick={closeMapModal}>
          <div
            className="map-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Render the Map Component */}
            <MapComponent isVisible={isMapModalOpen} ref={mapCompRef} />
            <button
              onClick={closeMapModal}
              className="close-modal-button"
              aria-label="Close map"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      {isModalOpen && <UserManualModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default App;
