import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, switchMap, of, forkJoin } from 'rxjs';
import { Youtuber } from '../interfaces/youtuber';
import { 
  Firestore, 
  collection, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc,
  doc, 
  serverTimestamp, 
  query, 
  limit,
  runTransaction 
} from '@angular/fire/firestore';
import { interval, Subscription } from 'rxjs';
import { AuthService } from './auth.service';


import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class YoutubeService {
  private firestore = inject(Firestore);
  private readonly clientId = environment.firebase.appId;
  private readonly APIkey = environment.youtubeApiKey;
  private accessToken: string | null = null;

  private INITIAL_CREATORS_LIST = [
    { id: 'UCX6OQ3DkcsbYNE6H8uQQuVA', name: 'MrBeast', handle: '@mrbeast', basePrice: 1500 },
    { id: 'UCwBtP6NDQtsP5YBa4vuZqHA', name: 'Friz', handle: '@frizoluszek', basePrice: 770 },
    { id: 'UCakvFyG2d44_RKlX0RyhoWw', name: 'Vysotzky', handle: '@vysotzkyy', basePrice: 380},
    { id: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw', name: 'PewDiePie', handle: '@PewDiePie', basePrice: 1400},
    { id: 'UCLLNPuvRGKxSczJcxlOiMXg', name: 'ReZigiusz', handle: '@reZigiusz', basePrice: 900},
    { id: 'UCG8rbF3g2AMX70yOd8vqIZg', name: 'Logan Paul', handle: '@loganpaulvlogs', basePrice: 1000},
    { id: 'UCWsDFcIhY2DBi3GB5uykGXA', name: 'IShowSpeed', handle: '@IShowSpeed', basePrice: 1880},
    { id: 'UC1Fc8RIaSgmsLmmUKwHECvA', name: 'Bungee', handle: '@bungee5125', basePrice: 550},
    { id: 'UC2AyohFiDUS3K98h5dJVfog', name: 'WarszawskiKoks', handle: '@WarszawskiKoks', basePrice: 670},
  ];

  private authService = inject(AuthService);
  private priceUpdateSub?: Subscription;

  constructor(private http: HttpClient, private ngZone: NgZone) { 
    this.startPriceUpdates();
  }

  private startPriceUpdates() {
    this.ngZone.runOutsideAngular(() => {
      // Używamy jednego interwału i sprawdzamy stan logowania
      this.priceUpdateSub = interval(30000).subscribe(async () => {
        // Sprawdzamy czy w localStorage jest token (szybsze niż subskrypcja user$)
        const token = localStorage.getItem('google_access_token');
        if (token) {
          this.ngZone.run(() => this.updateMarketPrices());
        }
      });
    });
  }

  async updateMarketPrices() {
    console.log('--- Tick: Aktualizacja cen rynkowych ---');
    const marketRef = collection(this.firestore, 'market');
    const snapshot = await getDocs(marketRef);

    for (const d of snapshot.docs) {
      const creatorRef = doc(this.firestore, 'market', d.id);
      
      try {
        await runTransaction(this.firestore, async (transaction) => {
          const creatorDoc = await transaction.get(creatorRef);
          if (!creatorDoc.exists()) return;

          const data = creatorDoc.data();
          const currentPrice = data['currentPrice'] || 500;
          const history = data['priceHistory'] || [currentPrice];

          const changePercent = (Math.random() * 0.06) - 0.03;
          const newPrice = Math.max(10, currentPrice * (1 + changePercent));

          const newHistory = [...history, newPrice].slice(-20);

          transaction.update(creatorRef, {
            currentPrice: newPrice,
            priceHistory: newHistory,
            lastUpdate: serverTimestamp()
          });
        });
      } catch (e) {
        console.error(`Błąd aktualizacji ceny dla ${d.id}:`, e);
      }
    }
  }

  async initializeFirestoreMarket() {
    const ids = this.INITIAL_CREATORS_LIST.map(c => c.id);
    
    const marketRef = collection(this.firestore, 'market');
    const snapshot = await getDocs(marketRef);

    // 1. Usuwamy nieaktualnych twórców
    for (const d of snapshot.docs) {
      if (!ids.includes(d.id)) {
        await deleteDoc(doc(this.firestore, 'market', d.id));
      }
    }

    // 2. Pobieramy dane z API i dodajemy TYLKO BRAKUJĄCYCH lub aktualizujemy metadane
    this.getChannelsFullData(ids).subscribe({
      next: async (youtubers) => {
        for (const yt of youtubers) {
          const seedData = this.INITIAL_CREATORS_LIST.find(c => c.id === yt.id);
          const docRef = doc(this.firestore, 'market', yt.id);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            // Nowy twórca - ustawiamy cenę bazową
            await setDoc(docRef, {
              name: yt.name,
              handle: yt.handle || seedData?.handle || '',
              thumbnailUrl: yt.avatarUrl,
              currentPrice: seedData?.basePrice || 500,
              priceHistory: [seedData?.basePrice || 500],
              lastUpdate: serverTimestamp()
            });
            console.log(`Dodano nowego twórcę do rynku: ${yt.name}`);
          } else {
            // Istniejący - aktualizujemy tylko metadane (bez ceny!)
            await setDoc(docRef, {
              name: yt.name,
              handle: yt.handle || seedData?.handle || '',
              thumbnailUrl: yt.avatarUrl,
              // Nie dotykamy currentPrice i priceHistory!
            }, { merge: true });
          }
        }
      }
    });
  }





  getSubscriptions(): Observable<any> {
    const url = 'https://www.googleapis.com/youtube/v3/subscriptions?mine=true&part=snippet&maxResults=5';
    return this.http.get(url);
  }

  getUserSubscriptionsPool(): Observable<Youtuber[]> {
    const url = 'https://www.googleapis.com/youtube/v3/subscriptions?mine=true&part=snippet&maxResults=50';
    return this.http.get<any>(url).pipe(
      switchMap(response => {
        if (!response.items || response.items.length === 0) {
          return of([]);
        }
        const ids = response.items.map((item: any) => item.snippet.resourceId.channelId).join(',');
        const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&maxResults=50&key=${this.APIkey}`;
        return this.http.get<any>(channelsUrl).pipe(
          map(channelsResponse => {
            return channelsResponse.items.map((item: any) => {
              return {
                id: item.id,
                name: item.snippet.title,
                handle: item.snippet.customUrl,
                avatarUrl: item.snippet.thumbnails?.default?.url || '',
                joinedYear: new Date(item.snippet.publishedAt).getFullYear(),
                subCount: Number(item.statistics.subscriberCount) || 0,
                totalViews: Number(item.statistics.viewCount) || 0,
                videoCount: Number(item.statistics.videoCount) || 0,
                description: item.snippet.description || ''
              } as Youtuber;
            });
          })
        );
      })
    );
  }

  getChannelVideos(channelId: string): Observable<any[]> {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=20&type=video&order=viewCount&key=${this.APIkey}`;
    return this.http.get<any>(url).pipe(
      map(response => response.items || [])
    );
  }

  getChannelsStats(channelIds: string[]): Observable<any[]> {
    if (channelIds.length === 0) return of([]);
    const params = new HttpParams()
      .set('part', 'statistics')
      .set('id', channelIds.join(','))
      .set('key', this.APIkey);
    
    return this.http.get<any>('https://www.googleapis.com/youtube/v3/channels', { params }).pipe(
      map(response => response.items || [])
    );
  }

  fetchTopChannelIds(regionCode: string): Observable<string[]> {
    let params = new HttpParams()
      .set('part', 'snippet')
      .set('type', 'channel')
      .set('order', 'viewCount')
      .set('maxResults', '25')
      .set('key', this.APIkey);
    
    if (regionCode) {
      params = params.set('regionCode', regionCode);
    }

    return this.http.get<any>('https://www.googleapis.com/youtube/v3/search', { params }).pipe(
      map(response => (response.items || [])
        .filter((item: any) => {
          const title = item.snippet.title.toLowerCase();
          return !title.includes('topic') && !title.includes('music');
        })
        .map((item: any) => item.snippet.channelId))
    );
  }

  getChannelsFullData(channelIds: string[]): Observable<Youtuber[]> {
    if (channelIds.length === 0) return of([]);
    const params = new HttpParams()
      .set('part', 'snippet,statistics')
      .set('id', channelIds.join(','))
      .set('maxResults', '50')
      .set('key', this.APIkey);

    return this.http.get<any>('https://www.googleapis.com/youtube/v3/channels', { params }).pipe(
      map(response => (response.items || []).map((item: any) => ({
        id: item.id,
        name: item.snippet.title,
        handle: item.snippet.customUrl,
        avatarUrl: item.snippet.thumbnails?.default?.url || '',
        joinedYear: new Date(item.snippet.publishedAt).getFullYear(),
        subCount: Number(item.statistics.subscriberCount) || 0,
        totalViews: Number(item.statistics.viewCount) || 0,
        videoCount: Number(item.statistics.videoCount) || 0,
        description: item.snippet.description || ''
      } as Youtuber)))
    );
  }

  initializeGlobalMarket(): Observable<Youtuber[]> {
    const cachedIds = localStorage.getItem('yt_market_ids');
    
    let idsSource$;
    if (cachedIds) {
      idsSource$ = of(JSON.parse(cachedIds));
    } else {
      idsSource$ = forkJoin([
        this.fetchTopChannelIds('PL'),
        this.fetchTopChannelIds('')
      ]).pipe(
        map(([plIds, globalIds]) => {
          const combined = Array.from(new Set([...plIds, ...globalIds])).slice(0, 50);
          localStorage.setItem('yt_market_ids', JSON.stringify(combined));
          return combined;
        })
      );
    }

    return idsSource$.pipe(
      switchMap(ids => this.getChannelsFullData(ids)),
      map(youtubers => youtubers.filter(y => {
        const name = y.name.toLowerCase();
        return !name.includes('topic') && !name.includes('music');
      }))
    );
  }

  getToken() {
    return this.accessToken || localStorage.getItem('google_access_token');
  }
}