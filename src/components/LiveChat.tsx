'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { sender: 'bot', text: 'Welcome to MIRACLE Relations. How may we assist you today?' },
  ]);
  const [input, setInput] = useState('');

  const quickReplies = [
    { label: 'Track Order', reply: 'How can I track my shipment status?' },
    { label: 'Returns', reply: 'What is your return policy?' },
    { label: 'Agent', reply: 'I would like to speak to a client relations executive.' },
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Append user message
    const newMsgs: Array<{ sender: 'bot' | 'user'; text: string }> = [...messages, { sender: 'user' as const, text }];
    setMessages(newMsgs);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      let botResponse = "Thank you. An advisor will review your message and reply shortly.";
      
      if (text.toLowerCase().includes('track')) {
        botResponse = "You can track your order inside the User Dashboard under 'Order History'. A tracking number is also emailed to you upon dispatch.";
      } else if (text.toLowerCase().includes('return')) {
        botResponse = "We offer complimentary returns within 14 days of delivery. Items must be unworn and in their original packaging.";
      } else if (text.toLowerCase().includes('agent')) {
        botResponse = "Understood. Connecting you to our luxury relations advisor. Please hold...";
      }

      setMessages((prev) => [...prev, { sender: 'bot' as const, text: botResponse }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4 w-[330px] h-[400px] bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder rounded-luxury shadow-luxuryHover overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-luxury-text dark:bg-luxury-darkBorder p-4 flex justify-between items-center text-white">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest">MIRACLE Relations</h4>
                <p className="text-[9px] text-luxury-gold tracking-wider">Online &amp; ready to assist</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-luxury-gold">
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 no-scrollbar text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-luxury leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-luxury-text text-white'
                        : 'bg-luxury-bg dark:bg-luxury-darkBg text-luxury-text dark:text-luxury-darkText border border-luxury-border dark:border-luxury-darkBorder'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick replies */}
            <div className="px-4 py-2 border-t border-luxury-border dark:border-luxury-darkBorder flex space-x-1.5 overflow-x-auto no-scrollbar">
              {quickReplies.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => handleSend(qr.reply)}
                  className="whitespace-nowrap px-2.5 py-1 border border-luxury-border dark:border-luxury-darkBorder hover:border-luxury-gold text-[10px] font-semibold rounded-luxury transition-all text-luxury-muted dark:text-luxury-darkMuted"
                >
                  {qr.label}
                </button>
              ))}
            </div>

            {/* Text Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 border-t border-luxury-border dark:border-luxury-darkBorder flex items-center space-x-2 bg-luxury-bg/30 dark:bg-luxury-darkBg/30"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask our relations team..."
                className="flex-grow bg-transparent text-xs outline-none"
              />
              <button type="submit" className="text-luxury-text dark:text-white hover:text-luxury-gold transition-colors">
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 bg-luxury-text hover:bg-luxury-gold text-white rounded-full shadow-luxuryHover transition-colors duration-300"
      >
        <MessageSquare size={20} />
      </button>
    </div>
  );
}
