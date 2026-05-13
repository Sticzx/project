import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, interval, switchMap, tap, forkJoin, map, of } from 'rxjs';
import { Youtuber } from '../interfaces/youtuber';
import { YoutubeService } from './youtube-service';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class StockEngineService {
  private firestore = inject(Firestore);
  private youtubeService = inject(YoutubeService);

  private youtubersSubject = new BehaviorSubject<Youtuber[]>([]);
  public youtubers$ = this.youtubersSubject.asObservable();

  constructor() {
    this.initializeMarket();
  }

  private readonly REFRESH_INTERVAL = 300000; // 5 minutes
  private readonly EMA_ALPHA = 0.1;

  private initializeMarket() {
    const cachedIds = localStorage.getItem('yt_market_ids');
    
    let idsSource$;
    if (cachedIds) {
      idsSource$ = of(JSON.parse(cachedIds));
    } else {
      idsSource$ = forkJoin([
        this.youtubeService.fetchTopChannelIds('PL'),
        this.youtubeService.fetchTopChannelIds('')
      ]).pipe(
        map(([plIds, globalIds]) => {
          const combined = Array.from(new Set([...plIds, ...globalIds])).slice(0, 50);
          if (combined.length > 0) {
            localStorage.setItem('yt_market_ids', JSON.stringify(combined));
          }
          return combined;
        })
      );
    }

    idsSource$.pipe(
      switchMap(ids => {
        if (ids.length === 0) return of([]);
        return this.youtubeService.getChannelsFullData(ids);
      }),
      tap(youtubers => {
        if (!youtubers || youtubers.length === 0) {
          const mockData: Youtuber[] = [
            { id: 'mock1', name: 'MrBeast', handle: '@mrbeast', avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nO-68Yp9O6-6-6-6=s176-c-k-c0x00ffffff-no-rj', joinedYear: 2012, subCount: 200000000, totalViews: 40000000000, videoCount: 700, description: 'Mock channel for testing' },
            { id: 'mock2', name: 'PewDiePie', handle: '@pewdiepie', avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_n-6-6-6-6-6-6=s176-c-k-c0x00ffffff-no-rj', joinedYear: 2010, subCount: 111000000, totalViews: 29000000000, videoCount: 4700, description: 'Mock channel for testing' },
            { id: 'mock3', name: 'T-Series', handle: '@tseries', avatarUrl: 'https://yt3.googleusercontent.com/v/mock3', joinedYear: 2006, subCount: 250000000, totalViews: 230000000000, videoCount: 19000, description: 'Mock channel for testing' },
            { id: 'mock4', name: 'Ekipa', handle: '@ekipa', avatarUrl: 'https://yt3.googleusercontent.com/v/mock4', joinedYear: 2018, subCount: 2000000, totalViews: 500000000, videoCount: 300, description: 'Mock channel for testing' }
          ];
          this.initStocks(mockData);
        } else {
          this.initStocks(youtubers);
        }
        this.startAutoRefresh();
      })
    ).subscribe({
      error: (err) => {
        console.error('Market init error:', err);
        const mockData: Youtuber[] = [
          { id: 'mock1', name: 'MrBeast (Test)', handle: '@mrbeast', avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nO-68Yp9O6-6-6-6=s176-c-k-c0x00ffffff-no-rj', joinedYear: 2012, subCount: 200000000, totalViews: 40000000000, videoCount: 700, description: 'Mock' },
          { id: 'mock2', name: 'PewDiePie (Test)', handle: '@pewdiepie', avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_n-6-6-6-6-6-6=s176-c-k-c0x00ffffff-no-rj', joinedYear: 2010, subCount: 111000000, totalViews: 29000000000, videoCount: 4700, description: 'Mock' }
        ];
        this.initStocks(mockData);
        this.startAutoRefresh();
      }
    });
  }

  public initStocks(pool: Youtuber[]) {
    const initialized = pool.map(y => {
      if (!y.stock) {
        y.stock = {
          currentPrice: 100, 
          priceHistory: [100],
          lastViewCount: y.totalViews,
          change24h: 0
        };
      }
      return y;
    });
    this.youtubersSubject.next(initialized);
  }

  private calculateNewPrice(youtuber: Youtuber, currentViews: number): number {
    if (!youtuber.stock) return 0;
    const velocity = Math.max(0, currentViews - youtuber.stock.lastViewCount);
    const valueFromGrowth = 100 + (velocity / 1000); 
    const oldPrice = youtuber.stock.currentPrice;
    const newPrice = (valueFromGrowth * this.EMA_ALPHA) + (oldPrice * (1 - this.EMA_ALPHA));
    return Math.round(newPrice * 100) / 100;
  }

  private startAutoRefresh() {
    interval(this.REFRESH_INTERVAL).pipe(
      switchMap(() => {
        const currentPool = this.youtubersSubject.value;
        if (currentPool.length === 0) return of([]);
        const ids = currentPool.map(y => y.id).filter(id => !id.startsWith('mock'));
        if (ids.length === 0) return of([]);
        return this.youtubeService.getChannelsStats(ids);
      }),
      tap(stats => {
        const updatedPool = this.youtubersSubject.value.map(y => {
          let currentViews = y.totalViews;
          
          if (y.id.startsWith('mock')) {
            currentViews += Math.floor(Math.random() * 90000) + 10000;
          } else {
            const channelStats = stats.find((s: any) => s.id === y.id);
            if (channelStats) {
              currentViews = Number(channelStats.statistics.viewCount);
            }
          }

          if (y.stock) {
            const newPrice = this.calculateNewPrice(y, currentViews);
            this.syncPriceToFirestore(y.id, newPrice);

            const priceHistory = [...y.stock.priceHistory, newPrice].slice(-30);
            const initialPrice = priceHistory[0];
            const change24h = ((newPrice - initialPrice) / initialPrice) * 100;

            const updatedStock = {
              ...y.stock,
              currentPrice: newPrice,
              priceHistory: priceHistory,
              lastViewCount: currentViews,
              change24h: Math.round(change24h * 100) / 100
            };

            return { ...y, totalViews: currentViews, stock: updatedStock };
          }
          return y;
        });

        this.youtubersSubject.next(updatedPool);
      })
    ).subscribe();
  }

  private async syncPriceToFirestore(channelId: string, price: number) {
    const docRef = doc(this.firestore, `market/${channelId}`);
    try {
      await setDoc(docRef, { currentPrice: price, lastUpdate: new Date() }, { merge: true });
    } catch (e) {
      console.error(`Sync error for ${channelId}:`, e);
    }
  }

  public getStockState(): Youtuber[] {
    return this.youtubersSubject.value;
  }
}


