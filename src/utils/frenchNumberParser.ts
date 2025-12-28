// Convertit les mots français en nombres
export function parseFrenchNumber(text: string): number | null {
  if (!text) return null;

  // Nettoyer le texte
  const cleanText = text.toLowerCase().trim()
    .replace(/[.,!?;]/g, '')
    .replace(/\s+/g, ' ');

  // Dictionnaire des nombres de base
  const units: Record<string, number> = {
    'zéro': 0, 'zero': 0,
    'un': 1, 'une': 1,
    'deux': 2,
    'trois': 3,
    'quatre': 4,
    'cinq': 5,
    'six': 6,
    'sept': 7,
    'huit': 8,
    'neuf': 9,
    'dix': 10,
    'onze': 11,
    'douze': 12,
    'treize': 13,
    'quatorze': 14,
    'quinze': 15,
    'seize': 16
  };

  const tens: Record<string, number> = {
    'dix': 10,
    'vingt': 20,
    'trente': 30,
    'quarante': 40,
    'cinquante': 50,
    'soixante': 60,
    'septante': 70, // Belgique/Suisse
    'quatre-vingt': 80, 'quatre-vingts': 80, 'quatre vingt': 80, 'quatre vingts': 80, 'quatrevingt': 80, 'quatrevingts': 80,
    'huitante': 80, // Suisse
    'nonante': 90  // Belgique/Suisse
  };

  // Vérifier si c'est un nombre direct
  if (units[cleanText] !== undefined) {
    return units[cleanText];
  }

  if (tens[cleanText] !== undefined) {
    return tens[cleanText];
  }

  // Gérer "cent"
  if (cleanText === 'cent') return 100;

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

  // Si on n'a pas trouvé de nombre valide, retourner null
  return total > 0 ? total : null;
}

// Fonction pour extraire un nombre d'un texte quelconque
export function extractNumberFromText(text: string): number | null {
  // D'abord, vérifier s'il y a un nombre directement
  const numberMatch = text.match(/\d+/);
  if (numberMatch) {
    return parseInt(numberMatch[0], 10);
  }

  // Sinon, essayer de parser en français
  return parseFrenchNumber(text);
}
