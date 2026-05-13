import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Youtuber } from '../../interfaces/youtuber';
import { ComparisonResult } from '../../interfaces/comparison-result';
import { YoutubeService } from '../../services/youtube-service';
import { GameStateService } from '../../services/game-state.service';

@Component({
  selector: 'app-subscribed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './subscribed.html',
  styleUrl: './subscribed.css',
})
export class Subscribed implements OnInit {
  youtubers: Youtuber[] = [];
  target!: Youtuber;
  selectedYoutuberId: string = '';
  guesses: { youtuber: Youtuber, results: ComparisonResult[] }[] = [];
  isLoading = true;
  hasWon = false;

  constructor(
    private youtubeService: YoutubeService, 
    private cdr: ChangeDetectorRef,
    private gameState: GameStateService
  ) {}

  ngOnInit() {
    this.youtubeService.getUserSubscriptionsPool().subscribe({
      next: (data) => {
        this.youtubers = data;
        if (this.youtubers.length > 0) {
          const savedTarget = this.gameState.getCurrentTarget();
          if (savedTarget && this.youtubers.some(y => y.id === savedTarget.id)) {
            this.target = savedTarget;
          } else {
            this.target = this.youtubers[Math.floor(Math.random() * this.youtubers.length)];
            this.gameState.setTarget(this.target);
          }
          console.log('Target selected:', this.target.name);
          
          if (this.gameState.hasCompletedSubscribed()) {
            this.hasWon = true;
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Błąd pobierania subskrypcji:', err);
        if (err.error && err.error.error) {
          console.error('Szczegóły błędu Google:', err.error.error.message);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  checkGuess() {
    if (!this.selectedYoutuberId || !this.target || this.hasWon) return;

    const guess = this.youtubers.find(y => y.id === this.selectedYoutuberId);
    if (!guess) return;

    if (this.guesses.some(g => g.youtuber.id === guess.id)) return;

    const results: ComparisonResult[] = [
      { property: 'joinedYear', status: this.compareYear(guess.joinedYear, this.target.joinedYear), actualValue: guess.joinedYear },
      { property: 'subCount', status: this.compareValue(guess.subCount, this.target.subCount), actualValue: guess.subCount },
      { property: 'totalViews', status: this.compareValue(guess.totalViews, this.target.totalViews), actualValue: guess.totalViews }
    ];

    this.guesses.unshift({ youtuber: guess, results });

    if (guess.id === this.target.id) {
        console.log('Zwycięstwo!');
        this.hasWon = true;
        this.gameState.completeSubscribedStage();
    }

    this.selectedYoutuberId = ''; // reset selection
  }

  resetGame() {
    this.guesses = [];
    this.selectedYoutuberId = '';
    this.hasWon = false;
    let newTarget;
    do {
      newTarget = this.youtubers[Math.floor(Math.random() * this.youtubers.length)];
    } while (this.youtubers.length > 1 && newTarget.id === this.target.id);
    this.target = newTarget;
    this.gameState.setTarget(newTarget);
    console.log('New target selected:', this.target.name);
  }

  private compareYear(guessValue: number, targetValue: number): ComparisonResult['status'] {
    if (guessValue === targetValue) return 'correct';
    if (targetValue < guessValue) return 'lower';
    return 'higher';
  }

  private compareValue(guessValue: number, targetValue: number): ComparisonResult['status'] {
    if (guessValue === targetValue) return 'correct';
    if (targetValue > guessValue) return 'higher';
    return 'lower';
  }
}
