
import React, { useState } from 'react';

interface WelcomeScreenProps {
  onStart: (topic: string, count: number) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && count > 0 && count <= 10) {
      onStart(topic, count);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
          AI Quiz Generator
        </h1>
        <p className="text-lg text-slate-300 mb-8">
          Enter any topic, and our AI will create a fun, illustrated quiz for you in seconds.
        </p>
        <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
          <div className="mb-6">
            <label htmlFor="topic" className="block text-left text-slate-300 font-semibold mb-2">
              Quiz Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Solar System Planets, Vietnamese History"
              className="w-full bg-slate-700 text-white p-4 rounded-lg border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              required
            />
          </div>
          <div className="mb-8">
            <label htmlFor="count" className="block text-left text-slate-300 font-semibold mb-2">
              Number of Questions (1-10)
            </label>
            <input
              id="count"
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full bg-slate-700 text-white p-4 rounded-lg border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!topic.trim() || count < 1 || count > 10}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-4 rounded-lg text-xl shadow-lg transform hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Generate Quiz
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeScreen;
