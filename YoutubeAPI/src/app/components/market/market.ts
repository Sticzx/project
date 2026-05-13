import { Component, Optional, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { StockEngineService } from '../../services/stock-engine.service';
import { WalletService } from '../../services/wallet.service';
import { Youtuber } from '../../interfaces/youtuber';
import { Ytstock } from '../ytstock/ytstock';
import { YoutubeService } from '../../services/youtube-service';
import { Firestore, collection, onSnapshot } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './market.html',
  styleUrl: './market.css',
})
export class MarketComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private youtubeService = inject(YoutubeService);
  private router = inject(Router);
  
  private youtubersSubject = new BehaviorSubject<Youtuber[]>([]);
  public youtubers$ = this.youtubersSubject.asObservable();
  
  private unsubscribe?: () => void;

  constructor(
    private stockEngine: StockEngineService,
    private walletService: WalletService,
    @Optional() private parent: Ytstock
  ) {}

  ngOnInit() {
    // Inicjalizacja rynku jeśli jest pusty
    this.youtubeService.initializeFirestoreMarket();

    // Ręczne nasłuchiwanie na zmiany w kolekcji market (bezpieczniejsze niż collectionData)
    const marketRef = collection(this.firestore, 'market');
    this.unsubscribe = onSnapshot(marketRef, (snapshot) => {
      const youtubers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data['name'],
          avatarUrl: data['thumbnailUrl'],
          handle: data['handle'] || `@${data['name'].toLowerCase().replace(/\s/g, '')}`,
          stock: {
            currentPrice: data['currentPrice'],
            priceHistory: data['priceHistory'] || [],
            change24h: this.calculateChange(data['priceHistory'])
          }
        } as Youtuber;
      });
      this.youtubersSubject.next(youtubers);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private calculateChange(history: number[]): number {
    if (!history || history.length < 2) return 0;
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    return ((current - previous) / previous) * 100;
  }

  private route = inject(ActivatedRoute);

  goToDetail(id: string) {
    console.log('Nawigacja SPA do:', id);
    this.router.navigate(['/ytstock/details', id]);
  }

  getOwnedCount(youtuberId: string): number {
    return this.walletService.getOwnedAmount(youtuberId);
  }

  openTrade(creator: Youtuber, type: 'BUY' | 'SELL') {
    if (this.parent) {
      this.parent.openTrade(creator, type);
    }
  }
}


