import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { YoutubeService } from '../../services/youtube-service';
import { GameStateService } from '../../services/game-state.service';
import { Youtuber } from '../../interfaces/youtuber';

@Component({
  selector: 'app-thumbnails',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './thumbnails.html',
  styleUrl: './thumbnails.css',
})
export class Thumbnails implements OnInit {
  targetCreator: Youtuber | null = null;
  videos: any[] = [];
  targetVideo: any;
  
  isLoading = true;
  hasWon = false;
  selectedVideoId: string = '';
  guessError = false;
  wrongGuessesCount = 0;

  constructor(
    private youtubeService: YoutubeService,
    private gameState: GameStateService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  get currentBlur(): number {
    return Math.max(0, 20 - (this.wrongGuessesCount * 5));
  }

  ngOnInit() {
    this.targetCreator = this.gameState.getCurrentTarget();
    
    if (!this.targetCreator) {
      this.router.navigate(['/subscribed']);
      return;
    }

    this.youtubeService.getChannelVideos(this.targetCreator.id).subscribe({
      next: (videos) => {
        if (videos && videos.length > 0) {
          this.videos = videos;
          this.setupGame();
        } else {
          console.error('Za mało wideo do gry.');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Błąd pobierania wideo:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setupGame() {
    this.hasWon = false;
    this.selectedVideoId = '';
    this.guessError = false;
    this.wrongGuessesCount = 0;
    
    this.targetVideo = this.videos[Math.floor(Math.random() * this.videos.length)];
  }

  guess() {
    if (this.hasWon || !this.selectedVideoId) return;
    
    if (this.selectedVideoId === this.targetVideo.id.videoId) {
      this.hasWon = true;
      this.guessError = false;
    } else {
      this.guessError = true;
      this.wrongGuessesCount++;
      this.selectedVideoId = ''; // reset after wrong guess
    }
  }

  decodeHtml(html: string) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }
}
