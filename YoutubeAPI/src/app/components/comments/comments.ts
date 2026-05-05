import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { YoutubeService } from '../../services/youtube-service';
import { GameStateService } from '../../services/game-state.service';
import { Youtuber } from '../../interfaces/youtuber';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './comments.html',
  styleUrl: './comments.css',
})
export class Comments implements OnInit {
  youtubers: Youtuber[] = []; // Lista wszystkich twórców (nasza pula do zgadywania)
  target!: Youtuber; // Główny bohater, którego próbujemy odgadnąć
  comments: string[] = []; // Pudełeczko z zapisanymi dymkami z czatu
  
  visibleCommentsCount = 1; // Na początku pokazujemy tylko JEDEN dymek czatu!
  selectedYoutuberId: string = ''; 
  isLoading = true; 
  hasWon = false; 
  guessError = false; 

  constructor(
    private youtubeService: YoutubeService,
    private gameState: GameStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Pobieramy wszystkich dostępnych twórców, żeby mieć z kogo wybierać
    this.youtubeService.getUserSubscriptionsPool().subscribe({
      next: (data) => {
        this.youtubers = data;
        
        if (this.youtubers.length > 0) {
          // 2. Pobieramy twórcę z poprzednich gier (GameState)
          const savedTarget = this.gameState.getCurrentTarget();
          
          if (savedTarget && this.youtubers.some(y => y.id === savedTarget.id)) {
            this.target = savedTarget;
          } else {
            // Jeśli ktoś tu wszedł z ulicy (z menu), to losujemy mu nowego twórcę!
            this.target = this.youtubers[Math.floor(Math.random() * this.youtubers.length)];
            this.gameState.setTarget(this.target);
          }

          // 3. Zaczynamy poszukiwania: najpierw filmy, potem śmieszne komentarze
          this.fetchVideoAndComments();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Błąd pobierania bazy twórców!', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Funkcja, która pobiera filmy, wybiera jeden losowy z zamkniętymi oczami i szuka pod nim komentarzy!
  fetchVideoAndComments() {
    this.isLoading = true;
    this.youtubeService.getChannelVideos(this.target.id).subscribe({
      next: (videos) => {
        if (videos && videos.length > 0) {
          // Mamy filmy! Losujemy jeden!
          const randomVideo = videos[Math.floor(Math.random() * videos.length)];
          const videoId = randomVideo.id.videoId;

          // Dzwonimy do YouTube z prośbą o komentarze do tego wybranego filmu
          this.youtubeService.getTopComments(videoId).subscribe({
            next: (commentItems) => {
              // Wyciągamy sam tekst z grubych, nudnych plików od YouTube
              let rawComments = commentItems.map(item => item.snippet.topLevelComment.snippet.textOriginal);
              
              // Bardzo ważne zadanie: Ukrywamy imię twórcy w tekście, żeby nie było za łatwo odgadnąć!
              this.comments = rawComments.map(c => this.sanitizeComment(c, this.target.name));
              
              // Zostawiamy w pudełeczku tylko maksymalnie 3 komentarze, bo takie są zasady gry.
              this.comments = this.comments.slice(0, 3);
              
              // Jeśli jakimś cudem nie ma żadnego komentarza, ratujemy sytuację!
              if (this.comments.length === 0) {
                this.comments = ['(Ten film nie ma żadnych fajnych komentarzy. Zgaduj na ślepo!)'];
              }

              this.setupGame();
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Brak komentarzy (może są wyłączone dla dzieci?)', err);
              this.comments = ['(Komentarze do tego filmu są wyłączone przez YouTube!)', 'Musisz poradzić sobie bez nich!'];
              this.setupGame();
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });

        } else {
          // Jeśli twórca nie ma w ogóle filmów!
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Błąd pobierania filmów', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Nasza sprytna Magiczna Gumka do Ścierania. 
  // Skanuje cały komentarz i zasłania imię twórcy naklejką [AUTOR]
  sanitizeComment(comment: string, creatorName: string): string {
    // Regex (magiczne zaklęcie) szuka wystąpień imienia ignorując wielkość liter (flaga 'i') oraz na całym tekście (flaga 'g')
    const regex = new RegExp(creatorName, 'gi');
    let cleanComment = comment.replace(regex, '[AUTOR]');

    // Co jeśli nazwa składa się z kilku słów? Np. "Friz i Wersow"
    // Rozbijamy nazwę na kawałki (słowa). Zostawiamy tylko dłuższe słowa (żeby nie cenzurować "i" albo "z").
    const words = creatorName.split(' ').filter(w => w.length > 3); 
    for (const word of words) {
      const wordRegex = new RegExp(word, 'gi');
      cleanComment = cleanComment.replace(wordRegex, '[AUTOR]'); // Zaklejamy każde duże słowo!
    }

    return cleanComment;
  }

  // Funkcja czyszcząca stół dla nowej gry
  setupGame() {
    console.log('🤫 Ostatni sekretny cel w Kampanii to ->', this.target.name);
    this.hasWon = false;
    this.selectedYoutuberId = '';
    this.guessError = false;
    this.visibleCommentsCount = 1; // Zaczynamy bardzo trudno, z tylko jednym komentarzem!
  }

  // Funkcja dla przycisku "Zagraj od nowa", która kończy Wielką Kampanię
  resetCampaign() {
    this.gameState.setTarget(null as any); // Zerujemy licznik gry
    // Powrót do menu!
  }

  // Przycisk zgadywania wciśnięty!
  guess() {
    if (this.hasWon || !this.selectedYoutuberId) return;

    if (this.selectedYoutuberId === this.target.id) {
      this.hasWon = true; // Wielkie zwycięstwo! 
      this.guessError = false;
      this.visibleCommentsCount = this.comments.length; // Odsłaniamy wszystko co zostało dla ciekawskich oczu
    } else {
      this.guessError = true; // Zły wybór!
      // Jeśli w pudełku zostały jeszcze schowane komentarze, wyjmujemy kolejny (max 3)
      if (this.visibleCommentsCount < 3 && this.visibleCommentsCount < this.comments.length) {
        this.visibleCommentsCount++;
      }
      this.selectedYoutuberId = ''; // Oddajemy czysty papier
    }
  }

  // Przekazuje do HTML-a tylko tyle dymków czatu, ile pozwala nasz licznik
  get visibleComments() {
    return this.comments.slice(0, this.visibleCommentsCount);
  }
}
