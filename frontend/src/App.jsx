import React, { useState, useRef, useEffect } from 'react';


// Main App component
const App = () => {
    const [messages, setMessages] = useState([]); // Stores chat messages
    const [input, setInput] = useState(''); // Stores current input field value
    const [loading, setLoading] = useState(false); // Loading state for API calls
    const messagesEndRef = useRef(null); // Ref for auto-scrolling to bottom

    // Function to scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll to bottom whenever messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Function to send user message to the backend
    const sendMessage = async () => {
        if (input.trim() === '') return; // Don't send empty messages

        const userMessage = { sender: 'user', text: input };
        setMessages((prevMessages) => [...prevMessages, userMessage]); // Add user message
        setInput(''); // Clear input field
        setLoading(true); // Set loading state

        try {
            // Make API call to your Node.js backend
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: input }),
            });

            const data = await response.json();

            if (response.ok) {
                // Add bot response to messages
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: 'bot', text: data.response },
                ]);
            } else {
                // Handle errors from the backend
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: 'bot', text: `Error: ${data.error || 'Something went wrong.'}` },
                ]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'bot', text: 'Network error. Please try again later.' },
            ]);
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            sendMessage();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col h-[80vh] overflow-hidden">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-xl shadow-md">
                    <h1 className="text-2xl font-bold text-center">Sales Chatbot</h1>
                </div>

                {/* Messages Display Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-10">
                            Type a question to get started, e.g., "What was the total sales yesterday?"
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                                    msg.sender === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="max-w-[70%] p-3 rounded-lg shadow-md bg-gray-200 text-gray-800 rounded-bl-none">
                                <div className="flex items-center">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></span>
                                    Thinking...
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} /> {/* Scroll target */}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 flex items-center bg-white rounded-b-xl">
                    <input
                        type="text"
                        className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                        placeholder="Ask about sales data..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || input.trim() === ''}
                        className={`ml-3 px-6 py-3 rounded-full font-semibold text-white transition duration-300 ease-in-out
                            ${loading || input.trim() === ''
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                            } shadow-lg`}
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;