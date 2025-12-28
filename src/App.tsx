import { useState, useRef, useEffect } from 'react';
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
  const [leftNumbers, setLeftNumbers] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [rightNumbers, setRightNumbers] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [question, setQuestion] = useState<Question>({ num1: 2, num2: 3, answer: 6 }); // Temporaire
  const [userInput, setUserInput] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'invalid' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [successEmoji, setSuccessEmoji] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false); // Ref pour savoir si on doit continuer d'écouter

  // Fonction pour ajouter un log de debug
  function addDebugLog(message: string) {
    setDebugLogs(prev => [...prev.slice(-4), message]); // Garder seulement les 5 derniers
  }

  // Fonctions pour gérer les nombres sélectionnés
  function toggleNumber(side: 'left' | 'right', num: number) {
    const setter = side === 'left' ? setLeftNumbers : setRightNumbers;
    const current = side === 'left' ? leftNumbers : rightNumbers;

    if (current.includes(num)) {
      setter(current.filter(n => n !== num));
    } else {
      setter([...current, num].sort((a, b) => a - b));
    }
  }

  function selectAllNumbers(side: 'left' | 'right') {
    const setter = side === 'left' ? setLeftNumbers : setRightNumbers;
    setter([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  }

  function selectNoNumbers(side: 'left' | 'right') {
    const setter = side === 'left' ? setLeftNumbers : setRightNumbers;
    setter([]);
  }

  // Générer une nouvelle question
  function generateQuestion(): Question {
    // Sélectionner un nombre aléatoire parmi les nombres sélectionnés
    const left = leftNumbers.length > 0
      ? leftNumbers[Math.floor(Math.random() * leftNumbers.length)]
      : 0;
    const right = rightNumbers.length > 0
      ? rightNumbers[Math.floor(Math.random() * rightNumbers.length)]
      : 0;

    // Échange aléatoire (50%)
    const swap = Math.random() < 0.5;
    const num1 = swap ? right : left;
    const num2 = swap ? left : right;

    return { num1, num2, answer: num1 * num2 };
  }

  // Réinitialiser le formulaire
  function resetForm() {
    setUserInput('');
    setRecognizedText('');
    setFeedback(null);
  }

  // Gérer la soumission
  function handleSubmit(e?: React.FormEvent, valueOverride?: number) {
    if (e) e.preventDefault();

    // Ne pas revalider si déjà en cours de feedback
    if (feedback !== null) return;

    let value: number | null;

    if (valueOverride !== undefined) {
      // Utiliser la valeur passée en paramètre (pour auto-submit vocal)
      value = valueOverride;
      addDebugLog(`Submit (auto): ${value}`);
    } else {
      // Extraire depuis userInput (pour submit manuel)
      value = extractNumberFromText(userInput, addDebugLog);
      addDebugLog(`Submit (manual): "${userInput}" → ${value}`);
    }

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

    shouldListenRef.current = true;
    setIsListening(true);

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'fr-FR';
    recognition.continuous = false; // On redémarre manuellement pour plus de contrôle
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      addDebugLog(`Vocal: "${transcript}"`);
      setRecognizedText(transcript);

      // Extraire le nombre du texte reconnu
      const number = extractNumberFromText(transcript, addDebugLog);
      if (number !== null) {
        setUserInput(number.toString());
        addDebugLog(`→ Nombre: ${number} (auto-submit)`);
        // Validation automatique quand un nombre est détecté - passer le nombre directement
        setTimeout(() => {
          handleSubmit(undefined, number);
        }, 500);
      } else {
        setUserInput(transcript);
        addDebugLog(`→ Pas de nombre détecté`);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Continuer d'écouter
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Ignore
              }
            }
          }, 100);
        }
        return;
      }
      // Autres erreurs : arrêter
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Redémarrer automatiquement si on doit continuer d'écouter
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Erreur au redémarrage:', e);
              shouldListenRef.current = false;
              setIsListening(false);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }

  // Nettoyer la reconnaissance vocale au démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Générer une première question au chargement
  useEffect(() => {
    setQuestion(generateQuestion());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Bouton paramètres */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="fixed top-4 right-4 bg-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all hover:scale-110 text-3xl z-40 flex items-center justify-center"
          aria-label="Paramètres"
        >
          ⚙️
        </button>

        {/* Zone de debug */}
        {showDebug && debugLogs.length > 0 && (
          <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 font-mono z-50">
            {debugLogs.map((log, i) => (
              <div key={i} className="truncate">{log}</div>
            ))}
          </div>
        )}

        {/* Panneau de paramètres */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-purple-600">⚙️ Paramètres</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-4xl hover:scale-110 transition-transform"
                >
                  ✕
                </button>
              </div>

              {/* Option debug */}
              <div className="mb-6 p-4 bg-gray-100 rounded-2xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xl font-semibold text-gray-700">Afficher le debug</span>
                  <input
                    type="checkbox"
                    checked={showDebug}
                    onChange={(e) => setShowDebug(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </label>
              </div>

              {/* Nombres partie gauche */}
              <div className="mb-6 p-4 bg-purple-100 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-bold text-purple-700">Nombres partie gauche</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAllNumbers('left')}
                      className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => selectNoNumbers('left')}
                      className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                    >
                      Aucun
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                    <button
                      key={num}
                      onClick={() => toggleNumber('left', num)}
                      className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                        leftNumbers.includes(num)
                          ? 'bg-purple-500 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-400 border-2 border-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombres partie droite */}
              <div className="mb-4 p-4 bg-pink-100 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-bold text-pink-700">Nombres partie droite</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAllNumbers('right')}
                      className="px-3 py-1 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600"
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => selectNoNumbers('right')}
                      className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                    >
                      Aucun
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                    <button
                      key={num}
                      onClick={() => toggleNumber('right', num)}
                      className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                        rightNumbers.includes(num)
                          ? 'bg-pink-500 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-400 border-2 border-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center mt-4">
                Les côtés gauche et droite sont échangés aléatoirement (50%)
              </p>
            </div>
          </div>
        )}

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
                    onClick={isListening ? stopListening : startListening}
                    disabled={feedback !== null}
                    className={`flex-1 max-w-xs px-8 py-6 text-2xl font-bold rounded-2xl transition-all shadow-lg ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isListening ? '🔴 Arrêter' : '🎤 Parler'}
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
