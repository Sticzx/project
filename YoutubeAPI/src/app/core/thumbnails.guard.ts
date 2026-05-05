import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameStateService } from '../services/game-state.service';

export const thumbnailsGuard: CanActivateFn = (route, state) => {
  const gameState = inject(GameStateService);
  const router = inject(Router);

  if (gameState.hasCompletedSubscribed()) {
    return true;
  }

  return router.parseUrl('/subscribed');
};
