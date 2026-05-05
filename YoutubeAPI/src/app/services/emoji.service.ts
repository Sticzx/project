import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {

  // Nasz powiększony, super dokładny słownik skojarzeń! 
  // Łapie gry, YouTuberów, sporty, jedzenie i wiele innych!
  private keywordMap: { [key: string]: string[] } = {
    // Gry
    'fortnite': ['🔫', '🧱', '🚌', '🏆'],
    'minecraft': ['⛏️', '🧟', '🏠', '🧊'],
    'csgo': ['🔫', '💣', '🎖️', '🇷🇺'],
    'cs:go': ['🔫', '💣', '🎖️', '🇷🇺'],
    'roblox': ['⬛', '🧍', '🎮', '🕹️'],
    'fifa': ['⚽', '🏟️', '🎮', '🏆'],
    'ea fc': ['⚽', '🏟️', '🎮', '🏆'],
    'league': ['🧙‍♂️', '⚔️', '🏰', '🐉'],
    'lol': ['🧙‍♂️', '⚔️', '🏰', '🐉'],
    'gta': ['🚗', '🔫', '💰', '🚔'],
    'valorant': ['🔫', '✨', '🕵️', '🎯'],
    'simsy': ['🏠', '👫', '🔥', '💻'],
    'sims': ['🏠', '👫', '🔥', '💻'],

    // Konkretni YouTuberzy
    'mrbeast': ['💵', '🏎️', '🚢', '😲'],
    'friz': ['🏠', '☁️', '👕', '🍦'],
    'ekipa': ['🏠', '☁️', '👕', '🍦'],
    'genzie': ['🏠', '👫', '🎬', '👗'],
    'budda': ['🏎️', '⛽', '💰', '🚘'],
    'książulo': ['🍔', '🍕', '🤢', '🤤'],
    'ksiazulo': ['🍔', '🍕', '🤢', '🤤'],
    'bungee': ['🤪', '🎬', '🎤', '🔥'],
    'wardega': ['🐶', '🕵️‍♂️', '🌲', '🚔'],
    'gimper': ['🗣️', '🎧', '📰', '🤡'],
    'rezi': ['👕', '🛹', '🎬', '🔥'],

    // Siłownia i fitness
    'siłownia': ['🏋️‍♂️', '💪', '🥩', '🥤'],
    'silownia': ['🏋️‍♂️', '💪', '🥩', '🥤'],
    'gym': ['🏋️‍♂️', '💪', '🥩', '🥤'],
    'trening': ['🏃‍♂️', '💦', '💪', '🔥'],
    'dieta': ['🥗', '🍗', '⚖️', '🍎'],
    'dzik': ['🐗', '🏋️‍♂️', '💪', '🥤'],
    'koks': ['💪', '🏋️‍♂️', '🔥', '🥩'],

    // Codzienne życie i VLOGi
    'vlog': ['🏠', '🤳', '🎬', '🚶‍♂️'],
    'daily': ['☀️', '📅', '☕', '🤳'],
    'życie': ['❤️', '🏠', '🌍', '😊'],
    'zycie': ['❤️', '🏠', '🌍', '😊'],
    'q&a': ['❓', '🗣️', '🤔', '💬'],
    'challenge': ['🏆', '🔥', '⏱️', '😱'],
    'wyzwanie': ['🏆', '🔥', '⏱️', '😱'],
    'test': ['✅', '❌', '🧐', '📦'],

    // Jedzenie i gotowanie
    'jedzenie': ['🍔', '🍕', '🌮', '🤤'],
    'gotowanie': ['👨‍🍳', '🍳', '🥗', '🔥'],
    'kuchnia': ['🔪', '🥘', '👨‍🍳', '🍲'],
    'przepis': ['📖', '🥣', '🍰', '🧂'],
    'mukbang': ['🍔', '🍟', '🥤', '😋'],
    'smak': ['👅', '😋', '🌶️', '🍭'],
    'degustacja': ['🍷', '🧀', '🧐', '🍽️'],

    // Sport i walki
    'piłka': ['⚽', '🥅', '🏃‍♂️', '🏟️'],
    'pilka': ['⚽', '🥅', '🏃‍♂️', '🏟️'],
    'mecz': ['⚽', '🏟️', '📺', '🍻'],
    'sport': ['🏅', '🏃‍♂️', '🏀', '🥇'],
    'boks': ['🥊', '🩸', '🥇', '🤕'],
    'famemma': ['🥊', '🤡', '💸', '🏟️'],
    'fame mma': ['🥊', '🤡', '💸', '🏟️'],
    'ksw': ['🥊', '🥋', '🩸', '🏆'],
    'mma': ['🥊', '🥋', '🩸', '🏆'],

    // Motoryzacja
    'auto': ['🚗', '🚘', '🔧', '💨'],
    'samochód': ['🚗', '🚘', '🔧', '💨'],
    'motoryzacja': ['🏎️', '⛽', '🛠️', '🛣️'],
    'drift': ['🏎️', '💨', '🔥', '🏁'],
    'bmw': ['🚗', '💨', '🔧', '😎'],

    // Technologia i elektronika
    'tech': ['💻', '📱', '🔌', '⚙️'],
    'recenzja': ['📱', '🧐', '📦', '⭐'],
    'sprzęt': ['💻', '⌨️', '🖱️', '🎧'],
    'sprzet': ['💻', '⌨️', '🖱️', '🎧'],
    'telefon': ['📱', '📞', '🔋', '📸'],
    'iphone': ['📱', '🍎', '💸', '📸'],
    'komputer': ['💻', '🖥️', '⌨️', '🖱️'],

    // Edukacja, nauka, historia
    'nauka': ['🧠', '📚', '🔬', '🎓'],
    'edukacja': ['🏫', '📖', '🎓', '📝'],
    'ciekawostki': ['🤔', '💡', '🤯', '🔍'],
    'historia': ['📜', '🏰', '⚔️', '⏳'],
    'kosmos': ['🚀', '🌌', '🪐', '👽'],

    // Pieniądze i biznes
    'biznes': ['💼', '📈', '🤝', '🏢'],
    'pieniądze': ['💰', '💸', '💳', '🏦'],
    'pieniadze': ['💰', '💸', '💳', '🏦'],
    'krypto': ['₿', '📈', '💻', '💸'],
    'inwestycje': ['📈', '💰', '📉', '🏦'],

    // Podróże
    'podróż': ['✈️', '🌍', '🎒', '🗺️'],
    'podroz': ['✈️', '🌍', '🎒', '🗺️'],
    'wakacje': ['☀️', '🏖️', '🌴', '🍹'],
    'świat': ['🌍', '🗺️', '✈️', '📸'],
    'swiat': ['🌍', '🗺️', '✈️', '📸'],

    // Muzyka
    'muzyka': ['🎵', '🎧', '🎸', '🎤'],
    'rap': ['🎤', '🧢', '🔥', '🤬'],
    'hip-hop': ['🎤', '🧢', '🔥', '🎧'],
    'teledysk': ['🎥', '🎬', '🎵', '🕺'],
    
    // Beauty
    'makijaż': ['💄', '💅', '✨', '👁️'],
    'makijaz': ['💄', '💅', '✨', '👁️'],
    'kosmetyki': ['🧴', '💄', '🧼', '✨'],
    'włosy': ['💇‍♀️', '✂️', '🧴', '👱‍♀️'],
    'wlosy': ['💇‍♀️', '✂️', '🧴', '👱‍♀️']
  };

  // Zapasowe emotki, gdyby twórca nie używał w ogóle emotek i grał w nieznane gry.
  private fallbackEmojis: string[] = ['⭐', '🎬', '🔥', '👀', '😎', '👍', '🎥', '✨'];

  // Ta funkcja analizuje tytuły filmów twórcy, by wyciągnąć to, co najważniejsze!
  generateEmojiClues(titles: string[], description: string): string[] {
    let selectedEmojis: string[] = [];
    // Sklejamy wszystkie tytuły filmów i opis w jeden dłuuugi tekst
    const combinedText = [...titles, description].join(' ').toLowerCase();

    // 1. Krok pierwszy: Szukamy w naszym słowniku!
    for (const [keyword, emojis] of Object.entries(this.keywordMap)) {
      // Jeśli w tytułach jest "minecraft", dorzucamy kilof!
      if (combinedText.includes(keyword)) {
        for (const emoji of emojis) {
          if (!selectedEmojis.includes(emoji)) {
            selectedEmojis.push(emoji);
          }
        }
      }
    }

    // 2. Krok drugi: Prawdziwi twórcy często wstawiają emotki w tytułach.
    // Używamy magicznego zaklęcia (wyrażenia regularnego), by złowić wszystkie buźki wprost z YouTube'a!
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F004}-\u{1F0CF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}]/gu;
    
    for (const title of titles) {
      const foundEmojis = title.match(emojiRegex);
      if (foundEmojis) {
        for (const emoji of foundEmojis) {
          // Jeśli złapaliśmy nową emotkę, wrzucamy ją do pudełka!
          if (!selectedEmojis.includes(emoji)) {
            selectedEmojis.push(emoji);
          }
        }
      }
    }

    // Mieszamy nasze emotki w pudełku jak cukierki
    selectedEmojis = selectedEmojis.sort(() => 0.5 - Math.random());
    selectedEmojis = selectedEmojis.slice(0, 5);

    // Jeśli z tytułów wyszło nam za mało emotek, dodajemy zapasowe!
    while (selectedEmojis.length < 5) {
      const randomFallback = this.fallbackEmojis[Math.floor(Math.random() * this.fallbackEmojis.length)];
      if (!selectedEmojis.includes(randomFallback)) {
        selectedEmojis.push(randomFallback);
      }
    }

    return selectedEmojis;
  }
}
