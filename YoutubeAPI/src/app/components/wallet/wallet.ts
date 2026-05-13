import { Component, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StockEngineService } from '../../services/stock-engine.service';
import { WalletService } from '../../services/wallet.service';
import { Youtuber } from '../../interfaces/youtuber';
import { Ytstock } from '../ytstock/ytstock';
import { YoutubeService } from '../../services/youtube-service';
import { Firestore, collection, onSnapshot } from '@angular/fire/firestore';
import { combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css',
})
export class WalletComponent {
  public walletData$: Observable<{
    youtubers: Youtuber[],
    ownedStocks: any[]
  }>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor(
    private stockEngine: StockEngineService,
    private walletService: WalletService,
    private youtubeService: YoutubeService,
    private firestore: Firestore,
    @Optional() private parent: Ytstock
  ) {
    const marketRef = collection(this.firestore, 'market');
    const market$ = new Observable<Youtuber[]>(subscriber => {
      return onSnapshot(marketRef, (snapshot) => {
        const youtubers = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data['name'],
            avatarUrl: data['thumbnailUrl'],
            handle: data['handle'],
            stock: {
              currentPrice: data['currentPrice'],
              priceHistory: data['priceHistory'] || []
            }
          } as Youtuber;
        });
        subscriber.next(youtubers);
      });
    });

    this.walletData$ = combineLatest([
      market$,
      this.walletService.ownedStocks$
    ]).pipe(
      map(([youtubers, ownedStocks]) => ({ youtubers, ownedStocks }))
    );
  }

  getYoutuberById(id: string, youtubers: Youtuber[]): Youtuber | undefined {
    return youtubers.find(y => y.id === id);
  }

  goToDetail(id: string) {
    console.log('Nawigacja SPA (Portfel) do:', id);
    this.router.navigate(['/ytstock/details', id]);
  }

  openTrade(creator: Youtuber, type: 'BUY' | 'SELL') {
    if (this.parent) {
      this.parent.openTrade(creator, type);
    }
  }
}
