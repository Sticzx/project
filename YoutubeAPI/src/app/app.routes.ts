import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Subscribed } from './components/subscribed/subscribed';
import { Emotes } from './components/emotes/emotes'; 
import { Thumbnails } from './components/thumbnails/thumbnails';
import { thumbnailsGuard } from './core/thumbnails.guard';
import { Comments } from './components/comments/comments';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'home', component: Home },
    { path: 'emotes', component: Emotes },
    { path: 'subscribed', component: Subscribed },
    { path: 'thumbnails', component: Thumbnails, canActivate: [thumbnailsGuard] },
    { path: 'comments', component: Comments }
];
