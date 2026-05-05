import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { YoutubeService } from '../../services/youtube-service';
import { GameStateService } from '../../services/game-state.service';
import { EmojiService } from '../../services/emoji.service';
import { Youtuber } from '../../interfaces/youtuber';

@Component({
  selector: 'app-emotes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './emotes.html',
  styleUrl: './emotes.css',
})
export class Emotes implements OnInit {
  youtubers: Youtuber[] = []; // To nasza lista wszystkich znajomych (twórców)
  target!: Youtuber; // To jest ten jeden twórca, którego musimy zgadnąć
  emojis: string[] = []; // Pudełeczko z naszymi podpowiedziami-emotkami
  
  visibleEmojisCount = 2; // Ile emotek pokazujemy na start? Dwie!
  
  selectedYoutuberId: string = ''; // Wybór gracza z rozwijanej listy
  isLoading = true; // Flaga mówiąca, czy gra się jeszcze ładuje (jak klepsydra w grach)
  hasWon = false; // Pamięta, czy już wygraliśmy
  guessError = false; // Pamięta, czy zrobiliśmy błąd przy zgadywaniu

  // W naszym konstruktorze zapraszamy do pomocy 4 przyjaciół (Serwisy), którzy przynoszą dane i zarządzają ekranem
  constructor(
    private youtubeService: YoutubeService,
    private gameState: GameStateService,
    private emojiService: EmojiService,
    private cdr: ChangeDetectorRef
  ) {}

  // Kiedy nasza gra się uruchamia, wołamy tę funkcję (jak naciśnięcie przycisku START w grze wideo)
  ngOnInit() {
    // Prosimy naszego przyjaciela (YoutubeService) o przyniesienie wszystkich subskrybowanych kanałów
    this.youtubeService.getUserSubscriptionsPool().subscribe({
      next: (data) => {
        this.youtubers = data; // Zapisujemy kanały do naszej listy

        if (this.youtubers.length > 0) {
          // Pytamy drugiego przyjaciela (GameState), czy w poprzedniej grze kogoś już zgadywaliśmy
          const savedTarget = this.gameState.getCurrentTarget();
          
          if (savedTarget && this.youtubers.some(y => y.id === savedTarget.id)) {
            // Jeśli tak, to bawimy się z nim dalej! Będzie łatwiej!
            this.target = savedTarget;
          } else {
            // Jeśli nie, zamykamy oczy i losujemy kogoś z wielkiego kapelusza pełnego twórców!
            this.target = this.youtubers[Math.floor(Math.random() * this.youtubers.length)];
            this.gameState.setTarget(this.target); // Zapisujemy go w systemie na przyszłość
          }

          // Najpierw musimy pobrać najnowsze filmy, by z ich tytułów złożyć super emotki!
          this.fetchVideosAndStart();
        } else {
          this.isLoading = false; // Lista pusta, wyłączamy ładowanie
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Coś się zepsuło przy pobieraniu!', err);
        this.isLoading = false; // Zdejmujemy ekran ładowania nawet jak jest błąd, żeby gracz nie czekał w nieskończoność
        this.cdr.detectChanges();
      }
    });
  }

  // Funkcja, która dzwoni do YouTube'a po listę filmów naszego twórcy
  fetchVideosAndStart() {
    this.isLoading = true; // Znowu pokazujemy ekran ładowania
    this.youtubeService.getChannelVideos(this.target.id).subscribe({
      next: (videos) => {
        // Z każdego filmu wyciągamy tylko jego tytuł
        const titles = videos.map((v: any) => v.snippet.title);
        // Prosimy Maszynę do Emotek o 5 fajnych obrazków z tytułów!
        this.emojis = this.emojiService.generateEmojiClues(titles, this.target.description);
        this.setupGame(); // Ustawiamy stół do gry
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Błąd pobierania wideo', err);
        // Jak coś pęknie, dajemy pustą listę tytułów
        this.emojis = this.emojiService.generateEmojiClues([], this.target.description);
        this.setupGame();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Funkcja, która sprząta planszę i przygotowuje wszystko na nowy start
  setupGame() {
    console.log('🤫 Podpowiedź dla testera: Szukany twórca to ->', this.target.name);
    
    this.hasWon = false; // Usuwamy naklejkę "Wygrana"
    this.selectedYoutuberId = ''; // Czyścimy to co gracz wybrał
    this.guessError = false; // Ukrywamy błędy (czerwony tekst)
    this.visibleEmojisCount = 2; // Na stole zostawiamy na początku tylko 2 emotki!
  }

  // Funkcja losująca całkowicie nowego twórcę do zabawy (gdy klikniemy zagraj ponownie po wygranej)
  setupNewTarget() {
    // Ponownie zamykamy oczy i losujemy!
    this.target = this.youtubers[Math.floor(Math.random() * this.youtubers.length)];
    this.gameState.setTarget(this.target); // Zapisujemy nowego znajomego
    this.fetchVideosAndStart(); // Znów pobieramy filmy!
  }

  // Co się dzieje, gdy naciśniemy przycisk "Zgadnij!"? Zobaczmy!
  guess() {
    // Jeśli już wygraliśmy albo gracz zapomniał wcisnąć kogoś z listy, to nic nie robimy
    if (this.hasWon || !this.selectedYoutuberId) return;

    // Sprawdzamy, czy strzał gracza to dokładnie ten twórca, którego wylosowaliśmy (Cel)
    if (this.selectedYoutuberId === this.target.id) {
      // Udało się! Hura! Konfetti!
      this.hasWon = true;
      this.guessError = false;
      this.visibleEmojisCount = 5; // Pokazujemy od razu wszystkie 5 emotek, jako nagrodę!
    } else {
      // Oj, pudło! To nie on!
      this.guessError = true;
      // Jeśli mamy mniej niż 5 odkrytych emotek na stole, dokładamy jedną, żeby było ciutkę łatwiej
      if (this.visibleEmojisCount < 5) {
        this.visibleEmojisCount++;
      }
      this.selectedYoutuberId = ''; // Oddajemy graczowi czystą listę, by spróbował raz jeszcze
    }
  }

  // Magiczna funkcja dająca nam do ręki tylko te emotki, które już odblokowaliśmy
  get visibleEmojis() {
    // Przecina naszego węża z 5 emotkami i zwraca na ekranie dokładnie tyle, ile nam pozwala licznik visibleEmojisCount
    return this.emojis.slice(0, this.visibleEmojisCount);
  }
}
