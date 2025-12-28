// Convertit les mots français en nombres
export function parseFrenchNumber(text: string): number | null {
  if (!text) return null;

  console.log('parseFrenchNumber - Input:', JSON.stringify(text)); // Debug

  // Nettoyer le texte - enlever tous les caractères spéciaux sauf espaces et tirets
  const cleanText = text.toLowerCase().trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('parseFrenchNumber - Clean:', JSON.stringify(cleanText)); // Debug

  // Dictionnaire des nombres de base
  const units: Record<string, number> = {
    'zéro': 0, 'zero': 0,
    'un': 1, 'une': 1, '1': 1,
    'deux': 2, '2': 2,
    'trois': 3, '3': 3,
    'quatre': 4, '4': 4,
    'cinq': 5, '5': 5,
    'six': 6, '6': 6,
    'sept': 7, '7': 7,
    'huit': 8, '8': 8,
    'neuf': 9, '9': 9,
    'dix': 10, '10': 10,
    'onze': 11, '11': 11,
    'douze': 12, '12': 12,
    'treize': 13, '13': 13,
    'quatorze': 14, '14': 14,
    'quinze': 15, '15': 15,
    'seize': 16, '16': 16,
    'dix-sept': 17, 'dixsept': 17, '17': 17,
    'dix-huit': 18, 'dixhuit': 18, '18': 18,
    'dix-neuf': 19, 'dixneuf': 19, '19': 19
  };

  const tens: Record<string, number> = {
    'dix': 10, '10': 10,
    'vingt': 20, '20': 20,
    'trente': 30, '30': 30,
    'quarante': 40, '40': 40,
    'cinquante': 50, '50': 50,
    'soixante': 60, '60': 60,
    'septante': 70, '70': 70, // Belgique/Suisse
    'soixante-dix': 70, 'soixantedix': 70,
    'quatre-vingt': 80, 'quatre-vingts': 80, 'quatre vingt': 80, 'quatre vingts': 80, 'quatrevingt': 80, 'quatrevingts': 80, '80': 80,
    'huitante': 80, // Suisse
    'quatre-vingt-dix': 90, 'quatrevingdix': 90, 'quatre vingt dix': 90,
    'nonante': 90, '90': 90  // Belgique/Suisse
  };

  // Vérifier si c'est un nombre direct
  if (units[cleanText] !== undefined) {
    console.log('parseFrenchNumber - Found in units:', units[cleanText]); // Debug
    return units[cleanText];
  }

  if (tens[cleanText] !== undefined) {
    console.log('parseFrenchNumber - Found in tens:', tens[cleanText]); // Debug
    return tens[cleanText];
  }

  // Gérer "cent" et nombres ronds
  if (cleanText === 'cent' || cleanText === '100') return 100;

  // Nombres composés courants pour les tables de multiplication (jusqu'à 100)
  const commonNumbers: Record<string, number> = {
    'vingt et un': 21, 'vingt-et-un': 21, 'vingtun': 21, '21': 21,
    'vingt deux': 22, 'vingt-deux': 22, 'vingtdeux': 22, '22': 22,
    'vingt trois': 23, 'vingt-trois': 23, 'vingttrois': 23, '23': 23,
    'vingt quatre': 24, 'vingt-quatre': 24, 'vingtquatre': 24, '24': 24,
    'vingt cinq': 25, 'vingt-cinq': 25, 'vingtcinq': 25, '25': 25,
    'vingt six': 26, 'vingt-six': 26, 'vingtsix': 26, '26': 26,
    'vingt sept': 27, 'vingt-sept': 27, 'vingtsept': 27, '27': 27,
    'vingt huit': 28, 'vingt-huit': 28, 'vingthuit': 28, '28': 28,
    'vingt neuf': 29, 'vingt-neuf': 29, 'vingtneuf': 29, '29': 29,
    'trente et un': 31, 'trente-et-un': 31, '31': 31,
    'trente deux': 32, 'trente-deux': 32, '32': 32,
    'trente cinq': 35, 'trente-cinq': 35, '35': 35,
    'trente six': 36, 'trente-six': 36, '36': 36,
    'quarante deux': 42, 'quarante-deux': 42, '42': 42,
    'quarante cinq': 45, 'quarante-cinq': 45, '45': 45,
    'quarante huit': 48, 'quarante-huit': 48, '48': 48,
    'quarante neuf': 49, 'quarante-neuf': 49, '49': 49,
    'cinquante quatre': 54, 'cinquante-quatre': 54, '54': 54,
    'cinquante six': 56, 'cinquante-six': 56, '56': 56,
    'soixante trois': 63, 'soixante-trois': 63, '63': 63,
    'soixante quatre': 64, 'soixante-quatre': 64, '64': 64,
    'soixante douze': 72, 'soixante-douze': 72, '72': 72,
    'quatre vingt un': 81, 'quatre-vingt-un': 81, '81': 81,
  };

  if (commonNumbers[cleanText] !== undefined) {
    console.log('parseFrenchNumber - Found in common:', commonNumbers[cleanText]); // Debug
    return commonNumbers[cleanText];
  }

  // Gérer les nombres composés
  let total = 0;
  let current = 0;

  // Séparer par espaces et tirets
  const words = cleanText.split(/[\s-]+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (units[word] !== undefined) {
      current += units[word];
    } else if (tens[word] !== undefined) {
      current += tens[word];
    } else if (word === 'cent' || word === 'cents') {
      if (current === 0) current = 1;
      current *= 100;
      total += current;
      current = 0;
    } else if (word === 'et') {
      // Ignore "et" dans "vingt et un"
      continue;
    } else {
      // Gestion spéciale pour soixante-dix (60 + 10)
      if (i > 0 && words[i - 1] === 'soixante') {
        if (word === 'dix') {
          current = 70;
        } else if (units[word] !== undefined && units[word] > 10) {
          current = 60 + units[word];
        }
      }
      // Gestion pour quatre-vingt-dix (80 + 10)
      else if (i > 0 && (words[i - 1] === 'quatre' || (i > 1 && words[i - 2] === 'quatre' && words[i - 1] === 'vingt'))) {
        if (word === 'dix') {
          current = 90;
        } else if (units[word] !== undefined && units[word] > 10) {
          current = 80 + units[word];
        }
      }
    }
  }

  total += current;

  console.log('parseFrenchNumber - Result:', total); // Debug

  // Si on n'a pas trouvé de nombre valide, retourner null
  return total > 0 ? total : null;
}

// Fonction pour extraire un nombre d'un texte quelconque
export function extractNumberFromText(text: string): number | null {
  if (!text) return null;

  console.log('extractNumberFromText - Input:', JSON.stringify(text)); // Debug

  // Nettoyer le texte d'abord
  const cleanedText = text.trim();

  // D'abord essayer de parser en français (ça inclut aussi les chiffres maintenant)
  const frenchResult = parseFrenchNumber(cleanedText);
  if (frenchResult !== null) {
    return frenchResult;
  }

  // Si rien n'a marché, chercher un nombre pur
  const numberMatch = cleanedText.match(/\d+/);
  if (numberMatch) {
    return parseInt(numberMatch[0], 10);
  }

  return null;
}
