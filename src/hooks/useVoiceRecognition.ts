import { useState, useRef, useEffect, useCallback } from 'react';
import { extractNumberFromText } from '../utils/frenchNumberParser';

interface UseVoiceRecognitionOptions {
  onResult: (text: string, number: number | null) => void;
  addDebugLog: (message: string) => void;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  recognizedText: string;
  startListening: () => void;
  stopListening: () => void;
  clearRecognizedText: () => void;
}

export function useVoiceRecognition({
  onResult,
  addDebugLog,
}: UseVoiceRecognitionOptions): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const wakeLockRef = useRef<any>(null);
  const onResultRef = useRef(onResult);

  // Toujours garder la dernière version du callback
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Demander un Wake Lock pour empêcher la mise en veille pendant l'écoute
  const requestWakeLock = useCallback(async () => {
    try {
      // Vérifier si l'API Wake Lock est disponible
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        addDebugLog('Wake Lock activé (écran restera allumé)');

        // Ré-activer le wake lock si la page devient visible après avoir été cachée
        wakeLockRef.current.addEventListener('release', () => {
          addDebugLog('Wake Lock relâché');
        });
      }
    } catch (err) {
      console.error('Erreur Wake Lock:', err);
      // Ne pas bloquer l'application si Wake Lock n'est pas supporté
    }
  }, [addDebugLog]);

  // Relâcher le Wake Lock
  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (err) {
      console.error('Erreur libération Wake Lock:', err);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
      return;
    }

    shouldListenRef.current = true;
    setIsListening(true);

    // Activer le Wake Lock pour empêcher la mise en veille
    requestWakeLock();

    // @ts-expect-error - SpeechRecognition types not available
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
        addDebugLog(`→ Nombre: ${number} (auto-submit)`);
      } else {
        addDebugLog(`→ Pas de nombre détecté`);
      }

      // Appeler le callback avec le résultat (utilise la ref pour avoir la dernière version)
      onResultRef.current(transcript, number);
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
      releaseWakeLock();
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
  }, [onResult, addDebugLog, requestWakeLock, releaseWakeLock]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);

    // Relâcher le Wake Lock
    releaseWakeLock();
  }, [releaseWakeLock]);

  // Nettoyer la reconnaissance vocale et le wake lock au démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Gérer la visibilité de la page pour le Wake Lock
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Quand la page redevient visible et qu'on est en train d'écouter
      if (document.visibilityState === 'visible' && isListening) {
        // Re-demander le wake lock car il a été automatiquement relâché
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening, requestWakeLock]);

  const clearRecognizedText = useCallback(() => {
    setRecognizedText('');
  }, []);

  return {
    isListening,
    recognizedText,
    startListening,
    stopListening,
    clearRecognizedText,
  };
}
