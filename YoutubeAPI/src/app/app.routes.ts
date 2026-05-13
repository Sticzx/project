import { Routes } from '@angular/router';
import { Ytidle } from './components/ytidle/ytidle';
import { Login } from './components/login/login';
import { Subscribed } from './components/subscribed/subscribed';
import { Emotes } from './components/emotes/emotes'; 
import { Thumbnails } from './components/thumbnails/thumbnails';
import { thumbnailsGuard } from './core/thumbnails.guard';
import { Homepage } from './components/homepage/homepage';
import { Ytstock } from './components/ytstock/ytstock';
import { MarketComponent } from './components/market/market';
import { WalletComponent } from './components/wallet/wallet';
import { TransactionsComponent } from './components/transactions/transactions';
import { Coindetail } from './components/coindetail/coindetail';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'home', component: Homepage },
    { path: 'ytidle', component: Ytidle },
    { path: 'emotes', component: Emotes },
    { path: 'subscribed', component: Subscribed },
    { path: 'thumbnails', component: Thumbnails, canActivate: [thumbnailsGuard] },
    { 
        path: 'ytstock', 
        component: Ytstock,
        children: [
            { path: '', redirectTo: 'market', pathMatch: 'full' },
            { path: 'market', component: MarketComponent },
            { path: 'details/:id', component: Coindetail },
            { path: 'wallet', component: WalletComponent },
            { path: 'transactions', component: TransactionsComponent }
        ]
    }
];
