import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  user$ = user(this.auth);

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
    
    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
        console.log('Zapisano Google Access Token');
      }

      console.log('Firebase initialized and logged in successfully:', user);

      // Sprawdź czy użytkownik istnieje w Firestore
      await this.ensureUserDocumentExists(user);

      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  

  private async ensureUserDocumentExists(user: any) {
    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('Tworzenie nowego profilu użytkownika w Firestore...');
      await setDoc(userDocRef, {
        balance: 10000,
        totalWealth: 10000,
        username: user.displayName || 'Anonim',
        portfolio: {}
      });
    } else {
      console.log('Profil użytkownika już istnieje.');
    }
  }

  async logout() {
    localStorage.removeItem('google_access_token');
    await signOut(this.auth);
  }
}
