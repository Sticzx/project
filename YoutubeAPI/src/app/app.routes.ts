import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Subscribed } from './components/subscribed/subscribed';
import { Classic } from './components/classic/classic';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'home', component: Home },
    { path: 'classic', component: Classic },
    { path: 'subscribed', component: Subscribed }
];
