import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StockEngineService } from '../../services/stock-engine.service';
import { WalletService } from '../../services/wallet.service';
import { TradingService } from '../../services/trading.service';
import { combineLatest, map, Observable } from 'rxjs';
import { Youtuber } from '../../interfaces/youtuber';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ytstock',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ytstock.html',
  styleUrls: ['./ytstock.css']
})
export class Ytstock implements OnInit {
  public selectedCreator: Youtuber | null = null;
  public tradeAmount: number = 1;
  public tradeCash: number = 0;
  public tradeType: 'BUY' | 'SELL' = 'BUY';

  public headerStats$!: Observable<{
    balance: number,
    portfolioValue: number
  }>;

  public isProcessing: boolean = false;

  constructor(
    private stockEngine: StockEngineService,
    private walletService: WalletService,
    private tradingService: TradingService
  ) {}

  ngOnInit(): void {
    this.headerStats$ = combineLatest([
      this.stockEngine.youtubers$,
      this.walletService.balance$,
      this.walletService.ownedStocks$
    ]).pipe(
      map(([youtubers, balance, ownedStocks]) => {
        const portfolioValue = ownedStocks.reduce((total, owned) => {
          const yt = youtubers.find(y => y.id === owned.youtuberId);
          return total + (yt?.stock?.currentPrice || 0) * owned.amount;
        }, 0);

        return {
          balance,
          portfolioValue
        };
      })
    );
  }

  openTrade(creator: Youtuber, type: 'BUY' | 'SELL') {
    this.selectedCreator = creator;
    this.tradeType = type;
    this.tradeAmount = type === 'SELL' ? this.walletService.getOwnedAmount(creator.id) : 1;
    this.isProcessing = false;
    this.updateCashFromAmount();
  }

  closeTrade() {
    if (this.isProcessing) return;
    this.selectedCreator = null;
  }

  updateCashFromAmount() {
    if (!this.selectedCreator?.stock) return;
    this.tradeCash = Number((this.tradeAmount * this.selectedCreator.stock.currentPrice).toFixed(2));
  }

  updateAmountFromCash() {
    if (!this.selectedCreator?.stock) return;
    this.tradeAmount = Number((this.tradeCash / this.selectedCreator.stock.currentPrice).toFixed(2));
  }

  async executeTrade() {
    if (!this.selectedCreator || this.isProcessing) return;
    
    this.isProcessing = true;
    try {
      if (this.tradeType === 'BUY') {
        await this.tradingService.buyStock(this.selectedCreator.id, this.tradeAmount);
      } else {
        await this.tradingService.sellStock(this.selectedCreator.id, this.tradeAmount);
      }
      this.isProcessing = false;
      this.closeTrade();
    } catch (e: any) {
      this.isProcessing = false;
      alert(e.message);
    }
  }

  getOwnedCount(youtuberId: string): number {
    return this.walletService.getOwnedAmount(youtuberId);
  }
}


