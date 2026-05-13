import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Youtuber } from '../interfaces/youtuber';
import { 
  Firestore, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit 
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

export interface OwnedStock {
  youtuberId: string;
  amount: number;
  avgPrice: number;
}

export interface Transaction {
  id: string;
  userId: string;
  channelId: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  total: number;
  timestamp: any;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private balanceSubject = new BehaviorSubject<number>(10000);
  public balance$ = this.balanceSubject.asObservable();

  private ownedStocksSubject = new BehaviorSubject<OwnedStock[]>([]);
  public ownedStocks$ = this.ownedStocksSubject.asObservable();

  private historySubject = new BehaviorSubject<Transaction[]>([]);
  public history$ = this.historySubject.asObservable();

  private snapshotUnsubscribe?: () => void;
  private historyUnsubscribe?: () => void;

  constructor() {
    this.initSync();
  }

  private initSync() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.startFirestoreSync(user.uid);
      } else {
        this.stopFirestoreSync();
      }
    });
  }

  private startFirestoreSync(uid: string) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    
    this.clearOldStorage();

    // 1. Synchronizacja danych profilu (balans, portfolio)
    this.snapshotUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data['balance'] !== undefined) {
          this.balanceSubject.next(data['balance']);
        }

        const portfolio = data['portfolio'] || {};
        const owned: OwnedStock[] = Object.keys(portfolio).map(id => {
          const item = portfolio[id];
          return {
            youtuberId: id,
            amount: typeof item === 'object' ? item.amount : item,
            avgPrice: typeof item === 'object' ? item.avgPrice : 0
          };
        });
        this.ownedStocksSubject.next(owned);
      }
    });

    // 2. Synchronizacja historii transakcji
    const transactionsRef = collection(this.firestore, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    this.historyUnsubscribe = onSnapshot(q, (snapshot) => {
      const history: Transaction[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          // Konwersja Firestore Timestamp na JS Date dla poprawnego działania pipe 'date'
          timestamp: data['timestamp']?.toDate() || null
        } as Transaction;
      });
      this.historySubject.next(history);
    });

  }

  private stopFirestoreSync() {
    if (this.snapshotUnsubscribe) this.snapshotUnsubscribe();
    if (this.historyUnsubscribe) this.historyUnsubscribe();
  }

  private clearOldStorage() {
    localStorage.removeItem('yt_stock_balance');
    localStorage.removeItem('yt_stock_owned');
    localStorage.removeItem('yt_stock_history');
  }

  public getOwnedAmount(youtuberId: string): number {
    const stock = this.ownedStocksSubject.value.find(s => s.youtuberId === youtuberId);
    return stock ? stock.amount : 0;
  }
}


