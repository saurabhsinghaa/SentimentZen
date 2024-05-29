import React, { useState, useRef, useEffect } from 'react';
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";
import './DrZen.css';

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = "AIzaSyBIaNmMNRlrIFpVXmyuaNQ20-yE72-4OkE"; // Replace with your actual API key

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
    temperature: 0.7,
    topK: 50,
    topP: 0.95,
    maxOutputTokens: 6192,
};

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

const DrZen = () => {
    const [inputText, setInputText] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const chatHistoryRef = useRef([]);

    const saveChatHistory = (history) => {
        localStorage.setItem('chatHistory', JSON.stringify(history));
    };

    const loadChatHistory = () => {
        const savedHistory = localStorage.getItem('chatHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    };

    const clearChatHistory = () => {
        localStorage.removeItem('chatHistory');
        chatHistoryRef.current = [];
    };

    const handleSendMessage = async () => {
        if (inputText.trim() !== '') {
            const introText = "Pretend that you are Dr. Zen, an AI therapist who is working at SentimentZen. Your work is to make the user get over the negative emotion and make him feel good always tell him ways to feel better when user writes their feelings with you. By telling ways you can also suggest some meditation or yoga. Answer the question only if it is in your domain. Don't give answer for question's that don't involve emotions. Here is the user input: ";

            const combinedInput = introText + inputText;

            const chat = model.startChat({
                generationConfig,
                safetySettings,
                history: chatHistoryRef.current,
            });

            setIsTyping(true);

            const result = await chat.sendMessage(combinedInput);
            const response = await result.response.text();

            setIsTyping(false);

            const newMessage = {
                user: { role: 'user', parts: [{ text: inputText }] },
                bot: { role: 'model', parts: [{ text: response }] },
            };

            const updatedChatHistory = [...chatHistory, newMessage];
            setChatHistory(updatedChatHistory);

            // Update chat history with the new message
            chatHistoryRef.current.push(newMessage.user, newMessage.bot);
            saveChatHistory(updatedChatHistory);

            // Clear input text
            setInputText('');
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    useEffect(() => {
        // Load chat history from localStorage when component mounts
        const loadedHistory = loadChatHistory();
        setChatHistory(loadedHistory);
        chatHistoryRef.current = loadedHistory.flatMap(item => [item.user, item.bot]);
        return () => {
            // Clear chat history from localStorage when component unmounts
            clearChatHistory();
        };
    }, []);

    return (
        <div className="zen-chat-container">
            <div className="zen-heading">Your Personal Wellness Coach</div>

            <div className="zen-chat-history">
                {chatHistory.map((message, index) => (
                    <div key={index} className="zen-chat-message">
                        <p className="user-message"><strong>You:</strong> {message.user.parts.map(part => part.text).join(' ')}</p>
                        <p className="bot-message"><strong>Dr. Zen:</strong> {message.bot.parts.map(part => part.text).join(' ')}</p>
                    </div>
                ))}
            </div>
            {isTyping && (
                <div className="zen-response-container">
                    <p><strong>Dr. Zen:</strong> Typing...</p>
                </div>
            )}
            <div className="zen-input-container">
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress} // Call handleKeyPress function on key down event
                    placeholder="Tell me what are you feeling..."
                />
                <button className='zen-button' onClick={handleSendMessage}>
                    {isTyping ? (
                        <div>
                            <i className="fa fa-spinner fa-pulse fa-fw"></i>
                            <span className="sr-only">Loading...</span>
                        </div>
                    ) : (
                        <span>Send</span>
                    )}
                </button>
                
            </div>
        </div>
    );
};

export default DrZen;
