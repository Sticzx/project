import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc,
  runTransaction, 
  collection, 
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private toast = inject(ToastService);

  private getNounDeclension(amount: number): string {
    const isInteger = Number.isInteger(amount);
    if (!isInteger) return 'akcji';

    const lastDigit = amount % 10;
    const lastTwoDigits = amount % 100;

    if (amount === 1) return 'akcję';
    if (lastTwoDigits >= 12 && lastTwoDigits <= 14) return 'akcji';
    if (lastDigit >= 2 && lastDigit <= 4) return 'akcje';
    return 'akcji';
  }

  async buyStock(channelId: string, amount: number) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Użytkownik niezalogowany');

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const marketDocRef = doc(this.firestore, `market/${channelId}`);
    const transDocRef = doc(collection(this.firestore, 'transactions'));

    try {
      console.log(`Próba zakupu ${amount} akcji ${channelId}...`);

      await runTransaction(this.firestore, async (transaction) => {
        const marketSnap = await transaction.get(marketDocRef);
        if (!marketSnap.exists()) throw new Error('Nie znaleziono ceny rynkowej dla tego twórcy');

        const userSnap = await transaction.get(userDocRef);
        if (!userSnap.exists()) throw new Error('Nie znaleziono profilu użytkownika');

        const marketData = marketSnap.data();
        const price = marketData['currentPrice'];
        const creatorName = marketData['name'] || 'Nieznany';
        const totalCost = price * amount;
        const userData = userSnap.data();

        if (userData['balance'] < totalCost) {
          throw new Error(`Niewystarczające środki. Masz: ${userData['balance'].toFixed(2)}, potrzebujesz: ${totalCost.toFixed(2)}`);
        }

        const portfolio = userData['portfolio'] || {};
        const storedValue = portfolio[channelId];
        const currentData = typeof storedValue === 'object' 
          ? storedValue 
          : { amount: storedValue || 0, avgPrice: 0 };
        
        const newAmount = currentData.amount + amount;
        const newAvgPrice = ((currentData.amount * currentData.avgPrice) + (amount * price)) / newAmount;

        portfolio[channelId] = {
          amount: newAmount,
          avgPrice: newAvgPrice || 0
        };

        transaction.update(userDocRef, {
          balance: userData['balance'] - totalCost,
          portfolio: portfolio
        });

        console.log('Zapisywanie dokumentu transakcji BUY...');
        transaction.set(transDocRef, {
          userId: user.uid,
          channelId: channelId,
          youtuberName: creatorName,
          type: 'BUY',
          price: price,
          amount: amount,
          total: totalCost,
          timestamp: serverTimestamp()
        });
      });
      console.log('Transakcja BUY zapisana pomyślnie.');
      this.toast.show(`Pomyślnie zakupiono ${amount} ${this.getNounDeclension(amount)}!`, 'success');
      this.updateTotalWealth(user.uid);
    } catch (error: any) {
      console.error('Błąd transakcji zakupu:', error);
      this.toast.show(error.message || 'Błąd podczas zakupu', 'error');
      throw error;
    }

  }

  async sellStock(channelId: string, amount: number) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Użytkownik niezalogowany');

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const marketDocRef = doc(this.firestore, `market/${channelId}`);
    const transDocRef = doc(collection(this.firestore, 'transactions'));

    try {
      console.log(`Próba sprzedaży ${amount} akcji ${channelId}...`);
      await runTransaction(this.firestore, async (transaction) => {
        const marketSnap = await transaction.get(marketDocRef);
        if (!marketSnap.exists()) throw new Error('Nie znaleziono ceny rynkowej');

        const userSnap = await transaction.get(userDocRef);
        if (!userSnap.exists()) throw new Error('Nie znaleziono profilu');

        const marketData = marketSnap.data();
        const userData = userSnap.data();
        const portfolio = userData['portfolio'] || {};
        const storedValue = portfolio[channelId];
        const currentData = typeof storedValue === 'object' 
          ? storedValue 
          : { amount: storedValue || 0, avgPrice: 0 };

        if (currentData.amount < amount) {
          throw new Error(`Niestety masz tylko ${currentData.amount} akcji.`);
        }

        const price = marketData['currentPrice'];
        const creatorName = marketData['name'] || 'Nieznany';
        const totalGain = price * amount;

        const newAmount = currentData.amount - amount;
        if (newAmount <= 0) {
          delete portfolio[channelId];
        } else {
          portfolio[channelId] = {
            amount: newAmount,
            avgPrice: currentData.avgPrice || 0
          };
        }

        transaction.update(userDocRef, {
          balance: userData['balance'] + totalGain,
          portfolio: portfolio
        });

        console.log('Zapisywanie dokumentu transakcji SELL...');
        transaction.set(transDocRef, {
          userId: user.uid,
          channelId: channelId,
          youtuberName: creatorName,
          type: 'SELL',
          price: price,
          amount: amount,
          total: totalGain,
          timestamp: serverTimestamp()
        });
      });
      console.log('Transakcja SELL zapisana pomyślnie.');
      this.toast.show(`Pomyślnie sprzedano ${amount} ${this.getNounDeclension(amount)}!`, 'success');
      this.updateTotalWealth(user.uid);
    } catch (error: any) {
      console.error('Błąd transakcji sprzedaży:', error);
      this.toast.show(error.message || 'Błąd podczas sprzedaży', 'error');
      throw error;
    }

  }

  private async updateTotalWealth(uid: string) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const balance = userData['balance'] || 0;
      const portfolio = userData['portfolio'] || {};

      let stocksValue = 0;
      for (const channelId in portfolio) {
        const marketDoc = await getDoc(doc(this.firestore, `market/${channelId}`));
        if (marketDoc.exists()) {
          const price = marketDoc.data()['currentPrice'] || 0;
          const amount = portfolio[channelId].amount || 0;
          stocksValue += price * amount;
        }
      }

      await setDoc(userDocRef, { totalWealth: balance + stocksValue }, { merge: true });
    } catch (error) {
      console.error('Błąd podczas aktualizacji Total Wealth:', error);
    }
  }
}
