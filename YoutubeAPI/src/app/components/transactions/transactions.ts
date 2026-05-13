import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class TransactionsComponent {
  public history$: Observable<any[]>;

  constructor(private walletService: WalletService) {
    this.history$ = this.walletService.history$;
  }
}
