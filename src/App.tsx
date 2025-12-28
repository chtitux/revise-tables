import { useState } from 'react';
import { extractNumberFromText } from './utils/frenchNumberParser';
import './App.css';

interface Question {
  num1: number;
  num2: number;
  answer: number;
}

// Emojis pour les animations
const SUCCESS_EMOJIS = ['🎉', '🌟', '⭐', '✨', '🎊', '🏆', '💯', '🔥', '👏', '🥳'];
const CELEBRATION_EMOJIS = ['🎉', '🎊', '🥳', '🎈', '🎆', '🎇', '✨', '🌟', '⭐', '💫', '🏆', '👑', '💯', '🔥'];

function App() {
  const [question, setQuestion] = useState<Question>(generateQuestion());
  const [userInput, setUserInput] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'invalid' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [successEmoji, setSuccessEmoji] = useState('');

  // Générer une nouvelle question
  function generateQuestion(): Question {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 * num2 };
  }

  // Réinitialiser le formulaire
  function resetForm() {
    setUserInput('');
    setRecognizedText('');
    setFeedback(null);
  }

  // Gérer la soumission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const value = extractNumberFromText(userInput);

    if (value === null) {
      setFeedback('invalid');
      setTimeout(() => {
        resetForm();
      }, 3000);
      return;
    }

    if (value === question.answer) {
      // Bonne réponse
      const emoji = SUCCESS_EMOJIS[Math.floor(Math.random() * SUCCESS_EMOJIS.length)];
      setSuccessEmoji(emoji);
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      setTimeout(() => {
        if (newScore === 10) {
          // Célébration pour 10 bonnes réponses
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setScore(0);
            setQuestion(generateQuestion());
            resetForm();
          }, 5000);
        } else {
          // Nouvelle question
          setQuestion(generateQuestion());
          resetForm();
        }
      }, 1500);
    } else {
      // Mauvaise réponse
      setFeedback('incorrect');
      setTimeout(() => {
        resetForm();
      }, 1500);
    }
  }

  // Reconnaissance vocale
  function startListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setRecognizedText(transcript);

      // Extraire le nombre du texte reconnu
      const number = extractNumberFromText(transcript);
      if (number !== null) {
        setUserInput(number.toString());
      } else {
        setUserInput(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Compteur de score */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full px-8 py-4 shadow-2xl">
            <p className="text-3xl font-bold text-purple-600">
              Score: <span className="text-5xl text-pink-500">{score}</span> / 10
            </p>
          </div>
        </div>

        {/* Zone de jeu principale */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {!showCelebration ? (
            <>
              {/* Question */}
              <div className="text-center mb-8">
                <h1 className="text-6xl md:text-8xl font-bold text-purple-600 mb-4">
                  {question.num1} × {question.num2} = ?
                </h1>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Texte reconnu */}
                {recognizedText && (
                  <div className="text-center">
                    <p className="text-lg text-gray-600">
                      Reconnu: <span className="font-semibold text-purple-600">{recognizedText}</span>
                    </p>
                  </div>
                )}

                {/* Input */}
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full text-5xl md:text-6xl text-center font-bold border-4 border-purple-300 rounded-2xl p-6 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all"
                  placeholder="?"
                  disabled={feedback !== null}
                />

                {/* Boutons */}
                <div className="flex gap-4 justify-center">
                  <button
                    type="button"
                    onClick={startListening}
                    disabled={isListening || feedback !== null}
                    className={`flex-1 max-w-xs px-8 py-6 text-2xl font-bold rounded-2xl transition-all shadow-lg ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isListening ? '🎤 Écoute...' : '🎤 Parler'}
                  </button>

                  <button
                    type="submit"
                    disabled={!userInput || feedback !== null}
                    className="flex-1 max-w-xs bg-green-500 text-white px-8 py-6 text-2xl font-bold rounded-2xl hover:bg-green-600 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vérifier ✓
                  </button>
                </div>
              </form>

              {/* Feedback */}
              {feedback === 'correct' && (
                <div className="mt-8 text-center">
                  <div className="text-9xl animate-bounce-scale">
                    {successEmoji}
                  </div>
                  <p className="text-4xl font-bold text-green-600 mt-4">
                    Bravo !
                  </p>
                </div>
              )}

              {feedback === 'incorrect' && (
                <div className="mt-8 text-center">
                  <div className="text-9xl animate-shake">
                    ❌
                  </div>
                  <p className="text-4xl font-bold text-red-600 mt-4">
                    Oups ! Essaie encore !
                  </p>
                </div>
              )}

              {feedback === 'invalid' && (
                <div className="mt-8 text-center">
                  <div className="text-7xl">⚠️</div>
                  <p className="text-3xl font-bold text-orange-600 mt-4">
                    Ceci n'est pas un nombre
                  </p>
                </div>
              )}
            </>
          ) : (
            // Célébration pour 10 bonnes réponses
            <div className="text-center py-12">
              <div className="relative">
                <div className="celebration-container">
                  {CELEBRATION_EMOJIS.map((emoji, index) => (
                    <div
                      key={index}
                      className="celebration-emoji"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-6 animate-pulse">
                  FÉLICITATIONS !
                </h1>
                <p className="text-5xl md:text-6xl font-bold text-purple-600 mb-4">
                  🏆 10/10 ! 🏆
                </p>
                <p className="text-3xl md:text-4xl text-gray-700">
                  Tu es un champion des tables !
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
