import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Youtuber } from '../interfaces/youtuber';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private currentTargetSource = new BehaviorSubject<Youtuber | null>(null);
  currentTarget$ = this.currentTargetSource.asObservable();

  private isSubscribedCompletedSource = new BehaviorSubject<boolean>(false);
  isSubscribedCompleted$ = this.isSubscribedCompletedSource.asObservable();

  setTarget(target: Youtuber | null) {
    this.currentTargetSource.next(target);
    // Jeśli ustawiamy nowy target, resetujemy postęp
    if (target) {
      this.isSubscribedCompletedSource.next(false);
    }
  }

  getCurrentTarget(): Youtuber | null {
    return this.currentTargetSource.getValue();
  }

  completeSubscribedStage() {
    this.isSubscribedCompletedSource.next(true);
  }

  hasCompletedSubscribed(): boolean {
    return this.isSubscribedCompletedSource.getValue();
  }

  resetSession() {
    this.currentTargetSource.next(null);
    this.isSubscribedCompletedSource.next(false);
  }
}
