import React, { useState, useCallback } from 'react';
import { GameState, Question, UserAnswer } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import Spinner from './components/Spinner';
import { generateQuizQuestions } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [quizData, setQuizData] = useState<Question[]>([]);
  const [resultsData, setResultsData] = useState<UserAnswer[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [quizKey, setQuizKey] = useState(0); // State to force remounting of QuizScreen

  const handleStart = useCallback(async (topic: string, count: number) => {
    setGameState('generating');
    setError(null);
    setLoadingMessage('AI is crafting your questions...');
    try {
      const questions = await generateQuizQuestions(topic, count);
      if (questions && questions.length > 0) {
        setQuizData(questions);
        setLoadingMessage('Generating illustrative images...');
        setQuizKey(prev => prev + 1); // Change the key to mount a new quiz
        setGameState('playing');
      } else {
        throw new Error("The AI didn't return any questions. Try a different topic.");
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setGameState('welcome');
    }
  }, []);

  const handleQuizEnd = (results: UserAnswer[]) => {
    setResultsData(results);
    setFinalScore(results.filter(r => r.isCorrect).length);
    setGameState('results');
  };

  const handleRestart = () => {
    // Re-play the same quiz by remounting QuizScreen with a new key
    setQuizKey(prev => prev + 1);
    setGameState('playing');
  };

  const handleNewQuiz = () => {
    setQuizData([]);
    setResultsData([]);
    setError(null);
    setGameState('welcome');
  };

  const renderContent = () => {
    switch (gameState) {
      case 'welcome':
        return (
          <>
            {error && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white p-4 rounded-lg shadow-lg">{error}</div>}
            <WelcomeScreen onStart={handleStart} />
          </>
        );
      case 'generating':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <Spinner />
            <p className="mt-4 text-lg text-slate-300">{loadingMessage}</p>
          </div>
        );
      case 'playing':
        // Use the key prop to ensure the component is re-mounted for new or restarted quizzes
        return <QuizScreen key={quizKey} initialQuestions={quizData} onQuizEnd={handleQuizEnd} />;
      case 'results':
        return <ResultsScreen score={finalScore} results={resultsData} onRestart={handleRestart} onNewQuiz={handleNewQuiz} />;
      default:
        return <WelcomeScreen onStart={handleStart} />;
    }
  };

  return <div className="App">{renderContent()}</div>;
};

export default App;
