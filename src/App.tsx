import { useState, useEffect, useCallback } from 'react';
import { extractNumberFromText } from './utils/frenchNumberParser';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import './App.css';

interface Question {
  num1: number;
  num2: number;
  answer: number;
}

// Emojis pour les animations
const SUCCESS_EMOJIS = ['🎉', '🌟', '⭐', '✨', '🎊', '🏆', '💯', '🔥', '👏', '🥳'];
const CELEBRATION_EMOJIS = ['🎉', '🎊', '🥳', '🎈', '🎆', '🎇', '✨', '🌟', '⭐', '💫', '🏆', '👑', '💯', '🔥'];

// Fonction helper pour charger depuis localStorage
function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Fonction helper pour sauvegarder dans localStorage
function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Hook personnalisé pour synchroniser l'état avec localStorage
function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadFromLocalStorage(key, defaultValue));

  useEffect(() => {
    saveToLocalStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}

function App() {
  // États synchronisés avec localStorage
  const [leftNumbers, setLeftNumbers] = useLocalStorage<number[]>('leftNumbers', [0, 1, 2, 3, 4, 5]);
  const [rightNumbers, setRightNumbers] = useLocalStorage<number[]>('rightNumbers', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [score, setScore] = useLocalStorage('score', 0);
  const [showDebug, setShowDebug] = useLocalStorage('showDebug', false);

  // États locaux (non persistés)
  const [question, setQuestion] = useState<Question>({ num1: 2, num2: 3, answer: 6 }); // Temporaire
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'invalid' | 'unicode' | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [successEmoji, setSuccessEmoji] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Fonction pour ajouter un log de debug
  function addDebugLog(message: string) {
    setDebugLogs(prev => [...prev.slice(-9), message]); // Garder seulement les 10 derniers
  }


  // Fonction pour détecter les nombres Unicode (π, ½, ², etc.)
  function containsUnicodeNumber(text: string): boolean {
    // Caractères Unicode pour les nombres mathématiques
    const unicodeNumberPatterns = [
      /[\u03C0\u03C6\u03B8\u03C4]/g, // π, φ, θ, τ (lettres grecques utilisées comme constantes)
      /[\u00B2\u00B3\u00B9\u2070-\u2079]/g, // Exposants: ², ³, ¹, ⁰-⁹
      /[\u2080-\u2089]/g, // Indices: ₀-₉
      /[\u00BC-\u00BE\u2150-\u215E]/g, // Fractions: ¼, ½, ¾, ⅐-⅞
      /[\u2460-\u2473]/g, // Nombres entourés: ①-⑳
      /[\u2776-\u277F]/g, // Nombres négatifs entourés
      /[\u24EA\u2460-\u24FF]/g, // Nombres dans des cercles
      /[\u2189]/g, // Fraction 0/3
      /[\u3220-\u3229\u3280-\u3289]/g, // Nombres entre parenthèses
      /[\uFF10-\uFF19]/g, // Chiffres pleine largeur (０-９)
    ];

    return unicodeNumberPatterns.some(pattern => pattern.test(text));
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

  // Générer une nouvelle question avec useCallback pour éviter les closures périmées
  const generateQuestion = useCallback((): Question => {
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
  }, [leftNumbers, rightNumbers]);

  // Réinitialiser le formulaire
  function resetForm() {
    setUserInput('');
    setFeedback(null);
  }


  // Gérer la soumission
  const handleSubmit = useCallback((e?: React.FormEvent, valueOverride?: number) => {
    if (e) e.preventDefault();

    // Ne pas revalider si déjà en cours de feedback
    if (feedback !== null) return;

    // Vérifier si l'entrée contient des nombres Unicode (uniquement pour input manuel)
    if (valueOverride === undefined && containsUnicodeNumber(userInput)) {
      addDebugLog(`Unicode détecté dans: "${userInput}"`);
      setFeedback('unicode');
      setTimeout(() => {
        resetForm();
      }, 3000);
      return;
    }

    let value: number | null;

    if (valueOverride !== undefined) {
      // Utiliser la valeur passée en paramètre (pour auto-submit vocal)
      value = valueOverride;
      addDebugLog(`Submit (auto): ${value} vs ${question.num1}×${question.num2}=${question.answer}`);
    } else {
      // Extraire depuis userInput (pour submit manuel)
      value = extractNumberFromText(userInput, addDebugLog);
      addDebugLog(`Submit (manual): ${value} vs ${question.num1}×${question.num2}=${question.answer}`);
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
      addDebugLog(`✅ Correct! ${value} = ${question.answer} | Score: ${score} → ${score + 1}`);
      const emoji = SUCCESS_EMOJIS[Math.floor(Math.random() * SUCCESS_EMOJIS.length)];
      setSuccessEmoji(emoji);
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      setTimeout(() => {
        if (newScore === 10) {
          // Célébration pour 10 bonnes réponses
          addDebugLog('🎉 CÉLÉBRATION! 10/10 atteint!');
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setScore(0);
            const newQ = generateQuestion();
            addDebugLog(`🆕 Nouvelle question: ${newQ.num1}×${newQ.num2}=?`);
            setQuestion(newQ);
            resetForm();
          }, 5000);
        } else {
          // Nouvelle question - reset feedback immédiatement pour permettre réponse rapide
          setFeedback(null);
          const newQ = generateQuestion();
          addDebugLog(`🆕 Nouvelle question: ${newQ.num1}×${newQ.num2}=?`);
          setQuestion(newQ);
          setTimeout(() => {
            setUserInput('');
          }, 100);
        }
      }, 1500);
    } else {
      // Mauvaise réponse
      addDebugLog(`❌ Incorrect: ${value} ≠ ${question.answer}`);
      setFeedback('incorrect');
      setTimeout(() => {
        resetForm();
      }, 1500);
    }
  }, [question, feedback, userInput, score, generateQuestion, setScore, setFeedback, setSuccessEmoji, setShowCelebration, setQuestion, setUserInput]);

  // Hook de reconnaissance vocale
  const { isListening, recognizedText, startListening, stopListening } = useVoiceRecognition({
    onResult: (text: string, number: number | null) => {
      if (number !== null) {
        setUserInput(number.toString());
        // Validation automatique quand un nombre est détecté
        setTimeout(() => {
          handleSubmit(undefined, number);
        }, 100);
      } else {
        setUserInput(text);
      }
    },
    addDebugLog,
  });

  // Générer une première question au chargement et quand les nombres changent
  useEffect(() => {
    setQuestion(generateQuestion());
  }, [generateQuestion]);

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
          <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 font-mono z-50">
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

              {feedback === 'unicode' && (
                <div className="mt-8 text-center">
                  <div className="text-7xl">😈</div>
                  <p className="text-3xl font-bold text-purple-600 mt-4">
                    On cherche un nombre entier rationnel !
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
