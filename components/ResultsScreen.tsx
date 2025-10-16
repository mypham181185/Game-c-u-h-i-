import React from 'react';
import { UserAnswer, MultipleChoiceQuestion, MatchingQuestion, DropdownQuestion, FillInTheBlankQuestion } from '../types';

interface ResultsScreenProps {
  score: number;
  results: UserAnswer[];
  onRestart: () => void;
  onNewQuiz: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, results, onRestart, onNewQuiz }) => {
  const totalQuestions = results.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const message = percentage >= 80 ? "Excellent Work!" : percentage >= 50 ? "Good Job!" : "Keep Practicing!";

  const getQuestionTitle = (q: UserAnswer['question']): string => {
    switch (q.questionType) {
        case 'multiple-choice': return q.questionText;
        case 'matching': return q.title;
        case 'dropdown': return `${q.questionParts[0]} ___ ${q.questionParts[1]}`;
        case 'fill-in-the-blank': return `${q.questionParts[0]} ___ ${q.questionParts[1]}`;
        default: return "Question";
    }
  }

  const renderUserAnswer = (result: UserAnswer) => {
    const { question, userAnswer, isCorrect } = result;
    if (userAnswer === null || userAnswer === '' || (typeof userAnswer === 'object' && Object.keys(userAnswer).length === 0)) {
        return <span className="text-slate-400 italic">No answer</span>;
    }

    switch (question.questionType) {
        case 'multiple-choice':
            return `"${question.options[userAnswer]}"`;
        case 'matching':
            return (
                 <ul className="list-disc list-inside text-left ml-4">
                    {Object.entries(userAnswer as Record<string, string>).map(([prompt, answer]) => (
                        <li key={prompt}>{prompt} &rarr; {answer}</li>
                    ))}
                </ul>
            );
        default:
             return `"${userAnswer}"`;
    }
  }

  const renderCorrectAnswer = (result: UserAnswer) => {
    const { question } = result;
     switch (question.questionType) {
        case 'multiple-choice':
            return `"${(question as MultipleChoiceQuestion).options[(question as MultipleChoiceQuestion).correctAnswerIndex]}"`;
        case 'matching':
            return (
                <ul className="list-disc list-inside text-left ml-4">
                    {Object.entries((question as MatchingQuestion).correctMatches).map(([prompt, answer]) => (
                        <li key={prompt}>{prompt} &rarr; {answer}</li>
                    ))}
                </ul>
            );
        case 'dropdown':
        case 'fill-in-the-blank':
            return `"${(question as DropdownQuestion | FillInTheBlankQuestion).correctAnswer}"`;
        default:
             return "N/A";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-slate-800 p-8 md:p-12 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md mb-8">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
          Quiz Complete!
        </h2>
        <p className="text-xl text-slate-300 mb-6">{message}</p>
        <div className="mb-8">
          <p className="text-lg text-slate-400">Your Score</p>
          <p className="text-6xl font-bold text-white">
            {score} <span className="text-3xl text-slate-400">/ {totalQuestions}</span>
          </p>
          <p className="text-2xl font-semibold text-cyan-400 mt-2">{percentage}%</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={onRestart}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300"
          >
            Play Again
          </button>
          <button
            onClick={onNewQuiz}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300"
          >
            Create New Quiz
          </button>
        </div>
      </div>
      
      <div className="w-full max-w-3xl">
         <h3 className="text-3xl font-bold text-center mb-6">Review Your Answers</h3>
         <div className="space-y-4">
            {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border text-left ${result.isCorrect ? 'bg-slate-800 border-green-700/50' : 'bg-slate-800 border-red-700/50'}`}>
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-lg flex-1">
                           <span className="text-slate-400 mr-2">Q{index + 1}:</span> {getQuestionTitle(result.question)}
                        </p>
                        <span className={`text-2xl ml-4 ${result.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                           {result.isCorrect ? '✔' : '✖'}
                        </span>
                    </div>
                    <div className="mt-3 pl-8 text-slate-300">
                        <div className="flex items-start gap-2">
                            <span className="font-medium text-slate-400">You:</span>
                            <div className="flex-1">{renderUserAnswer(result)}</div>
                        </div>
                       {!result.isCorrect && (
                         <div className="flex items-start gap-2 mt-2 text-green-400">
                             <span className="font-medium text-green-300">Correct:</span>
                             <div className="flex-1">{renderCorrectAnswer(result)}</div>
                         </div>
                       )}
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
