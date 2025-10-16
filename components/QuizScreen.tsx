import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Question, MultipleChoiceQuestion, MatchingQuestion, DropdownQuestion, FillInTheBlankQuestion, UserAnswer } from '../types';
import { useSound } from '../hooks/useSound';
import { generateImageForQuestion } from '../services/geminiService';
import Spinner from './Spinner';

// Utility to shuffle an array, used for matching questions
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

interface QuizScreenProps {
  initialQuestions: Question[];
  onQuizEnd: (results: UserAnswer[]) => void;
}

const TIMER_DURATION = 30; // Increased timer for more complex questions

const QuizScreen: React.FC<QuizScreenProps> = ({ initialQuestions, onQuizEnd }) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // State for different answer types
  const [userAnswerMC, setUserAnswerMC] = useState<number | null>(null);
  const [userAnswerFIB, setUserAnswerFIB] = useState('');
  const [userAnswerDD, setUserAnswerDD] = useState('');
  const [userAnswerMatching, setUserAnswerMatching] = useState<Record<string, string>>({});
  const [selectedMatchingPrompt, setSelectedMatchingPrompt] = useState<string | null>(null);

  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playCorrectSound, playIncorrectSound } = useSound();
  const currentQuestion = questions[currentQuestionIndex];

  // Memoize shuffled answers for matching questions to prevent re-shuffling on every render
  const shuffledAnswers = useMemo(() => {
    if (currentQuestion.questionType === 'matching') {
      return shuffleArray((currentQuestion as MatchingQuestion).answers);
    }
    return [];
  }, [currentQuestion]);

  useEffect(() => {
    const fetchImage = async () => {
      if (!currentQuestion.imageUrl) {
        setIsImageLoading(true);
        const url = await generateImageForQuestion(currentQuestion.imagePrompt);
        setQuestions(prev => {
          const newQuestions = [...prev];
          newQuestions[currentQuestionIndex].imageUrl = url;
          return newQuestions;
        });
        setIsImageLoading(false);
      } else {
        setIsImageLoading(false);
      }
    };
    fetchImage();
  }, [currentQuestionIndex, currentQuestion.imagePrompt, currentQuestion.imageUrl]);

  const processAnswer = useCallback(() => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswered(true);

    let correct = false;
    let userAnswerForRecord: any;

    switch (currentQuestion.questionType) {
      case 'multiple-choice':
        correct = userAnswerMC === (currentQuestion as MultipleChoiceQuestion).correctAnswerIndex;
        userAnswerForRecord = userAnswerMC;
        break;
      case 'fill-in-the-blank':
        const ftb = currentQuestion as FillInTheBlankQuestion;
        correct = userAnswerFIB.trim().toLowerCase() === ftb.correctAnswer.toLowerCase();
        userAnswerForRecord = userAnswerFIB;
        break;
      case 'dropdown':
        const dd = currentQuestion as DropdownQuestion;
        correct = userAnswerDD === dd.correctAnswer;
        userAnswerForRecord = userAnswerDD;
        break;
      case 'matching':
        const mq = currentQuestion as MatchingQuestion;
        const matches = userAnswerMatching;
        correct = Object.keys(mq.correctMatches).length > 0 && 
                  Object.keys(mq.correctMatches).every(prompt => mq.correctMatches[prompt] === matches[prompt]);
        userAnswerForRecord = userAnswerMatching;
        break;
    }

    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
    
    const answerRecord: UserAnswer = {
        question: currentQuestion,
        userAnswer: userAnswerForRecord,
        isCorrect: correct,
    };
    const updatedAnswers = [...userAnswers, answerRecord];
    setUserAnswers(updatedAnswers);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsAnswered(false);
        setIsCorrect(null);
        setUserAnswerMC(null);
        setUserAnswerFIB('');
        setUserAnswerDD('');
        setUserAnswerMatching({});
        setSelectedMatchingPrompt(null);
        setTimer(TIMER_DURATION);
      } else {
        onQuizEnd(updatedAnswers);
      }
    }, 3500);
  }, [isAnswered, currentQuestion, userAnswerMC, userAnswerFIB, userAnswerDD, userAnswerMatching, currentQuestionIndex, questions.length, onQuizEnd, score, playCorrectSound, playIncorrectSound, userAnswers]);

  useEffect(() => {
    if (!isAnswered) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswered]);

  useEffect(() => {
    if (timer === 0 && !isAnswered) {
      processAnswer();
    }
  }, [timer, isAnswered, processAnswer]);

  const handleMultipleChoiceSelect = (index: number) => {
    if (isAnswered) return;
    setUserAnswerMC(index);
    setTimeout(processAnswer, 150);
  };
  
  const handleMatchingSelect = (item: string, type: 'prompt' | 'answer') => {
    if (isAnswered) return;

    if (type === 'prompt') {
      setSelectedMatchingPrompt(prev => prev === item ? null : item);
    } else if (type === 'answer' && selectedMatchingPrompt) {
      setUserAnswerMatching(prev => ({...prev, [selectedMatchingPrompt]: item}));
      setSelectedMatchingPrompt(null);
    }
  };
  
  const renderMultipleChoice = () => {
    const q = currentQuestion as MultipleChoiceQuestion;
    const getButtonClass = (index: number) => {
      if (!isAnswered) return 'bg-slate-700 hover:bg-slate-600';
      if (index === q.correctAnswerIndex) return 'bg-green-600 animate-pulse';
      if (index === userAnswerMC && index !== q.correctAnswerIndex) return 'bg-red-600';
      return 'bg-slate-700 opacity-50';
    };

    return (
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 h-24 flex items-center justify-center">{q.questionText}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {q.options.map((option, index) => (
            <button key={index} onClick={() => handleMultipleChoiceSelect(index)} disabled={isAnswered}
              className={`p-4 rounded-lg text-lg text-left font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed ${getButtonClass(index)}`}>
              <span className="mr-3">{String.fromCharCode(65 + index)}.</span>{option}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  const renderMatching = () => {
    const q = currentQuestion as MatchingQuestion;
    return (
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">{q.title}</h2>
        <div className="flex justify-around gap-4">
          <div className="flex-1 flex flex-col gap-2">
            {q.prompts.map(prompt => {
              const isSelected = selectedMatchingPrompt === prompt;
              const isMatched = userAnswerMatching[prompt];
              let bgColor = 'bg-slate-700 hover:bg-slate-600';
              if (isSelected) bgColor = 'bg-cyan-600 ring-2 ring-cyan-400';
              if (isMatched) bgColor = 'bg-blue-800';

              if(isAnswered) {
                  const isCorrectMatch = q.correctMatches[prompt] === userAnswerMatching[prompt];
                  bgColor = isCorrectMatch ? 'bg-green-600' : 'bg-red-600';
              }
              
              return (
                <button key={prompt} onClick={() => handleMatchingSelect(prompt, 'prompt')} disabled={isAnswered}
                  className={`p-3 rounded-lg text-left font-semibold transition-colors duration-200 ${bgColor}`}>
                  {prompt}
                </button>
              );
            })}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {shuffledAnswers.map(answer => {
              const isMatched = Object.values(userAnswerMatching).includes(answer);
              let bgColor = 'bg-slate-700 hover:bg-slate-600';
              if(isMatched) bgColor = 'bg-slate-700 opacity-50'

              return (
                <button key={answer} onClick={() => handleMatchingSelect(answer, 'answer')} disabled={isAnswered || isMatched || !selectedMatchingPrompt}
                  className={`p-3 rounded-lg text-left font-semibold transition-colors duration-200 disabled:cursor-not-allowed ${bgColor}`}>
                  {answer}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDropdown = () => {
    const q = currentQuestion as DropdownQuestion;
    return (
      <div className="text-2xl md:text-3xl font-bold text-center h-24 flex items-center justify-center gap-4">
        <span>{q.questionParts[0]}</span>
        <select value={userAnswerDD} onChange={(e) => setUserAnswerDD(e.target.value)} disabled={isAnswered}
          className="bg-slate-700 text-white p-2 rounded-lg text-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none">
          <option value="" disabled>Select...</option>
          {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <span>{q.questionParts[1]}</span>
      </div>
    );
  };
  
  const renderFillInTheBlank = () => {
    const q = currentQuestion as FillInTheBlankQuestion;
    return (
      <div className="text-2xl md:text-3xl font-bold text-center h-24 flex items-center justify-center gap-2 flex-wrap">
        <span>{q.questionParts[0]}</span>
        <input type="text" value={userAnswerFIB} onChange={(e) => setUserAnswerFIB(e.target.value)} disabled={isAnswered}
          className="w-48 bg-slate-700 text-white p-2 rounded-lg text-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none text-center" />
        <span>{q.questionParts[1]}</span>
      </div>
    );
  };
  
  const renderFeedback = () => {
    if (!isAnswered) return null;
    if (isCorrect) return <p className="text-green-400">Correct! Well done!</p>;

    let correctAnswerDisplay;
    switch(currentQuestion.questionType) {
        case 'multiple-choice':
            correctAnswerDisplay = (currentQuestion as MultipleChoiceQuestion).options[(currentQuestion as MultipleChoiceQuestion).correctAnswerIndex];
            break;
        case 'fill-in-the-blank':
        case 'dropdown':
            correctAnswerDisplay = (currentQuestion as FillInTheBlankQuestion | DropdownQuestion).correctAnswer;
            break;
        case 'matching':
            return <p className="text-red-400">Oops! Check the correct pairings.</p>; // Matching feedback is shown via colors
    }

    return <p className="text-red-400">Oops! The correct answer was: {correctAnswerDisplay}</p>;
  };
  
  const renderQuestionContent = () => {
    switch(currentQuestion.questionType) {
      case 'multiple-choice': return renderMultipleChoice();
      case 'matching': return renderMatching();
      case 'dropdown': return renderDropdown();
      case 'fill-in-the-blank': return renderFillInTheBlank();
      default: return <p>Unsupported question type.</p>;
    }
  };

  const timerPercentage = (timer / TIMER_DURATION) * 100;
  const timerColor = timerPercentage > 50 ? 'bg-green-500' : timerPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';
  const pulseAnimation = timerPercentage <= 25 ? ' animate-pulse' : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold text-cyan-400">Question {currentQuestionIndex + 1} / {questions.length}</div>
          <div className="text-lg font-bold">Score: {score}</div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6">
          <div className={`${timerColor}${pulseAnimation} h-2.5 rounded-full transition-all duration-1000 linear`} style={{ width: `${timerPercentage}%` }}></div>
        </div>
        <div className="aspect-video w-full bg-slate-700 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
          {isImageLoading ? <Spinner /> : <img src={currentQuestion.imageUrl} alt="Quiz illustration" className="w-full h-full object-cover"/>}
        </div>
        
        <div className="min-h-[15rem] flex flex-col justify-center">
            {renderQuestionContent()}
        </div>

        <div className="mt-6 text-center text-xl font-semibold h-8">
            {renderFeedback()}
        </div>

        {!isAnswered && currentQuestion.questionType !== 'multiple-choice' && (
            <div className="flex justify-center mt-4">
                <button onClick={processAnswer} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition duration-300">
                    Submit
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
