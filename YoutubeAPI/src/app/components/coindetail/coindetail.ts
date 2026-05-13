import { Component, OnInit, OnDestroy, inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartOptions } from 'chart.js';
import { WalletService } from '../../services/wallet.service';
import { Ytstock } from '../ytstock/ytstock';
import { Youtuber } from '../../interfaces/youtuber';

Chart.register(...registerables);

@Component({
  selector: 'app-coindetail',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './coindetail.html',
  styleUrl: './coindetail.css',
})
export class Coindetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private walletService = inject(WalletService);
  @Optional() private parent = inject(Ytstock);
  
  public creator: any = null;
  private unsubscribe?: () => void;

  // Konfiguracja wykresu
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Cena USD',
        fill: true,
        tension: 0.4,
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        pointRadius: 0,
        borderWidth: 3
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#888' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#00ff88',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 255, 136, 0.3)',
        borderWidth: 1
      }
    }
  };

  constructor() {
    console.log('Komponent Coindetail został utworzony!');
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Nawigacja do ID:', id);
      
      // Czyścimy poprzednią subskrypcję jeśli istnieje
      if (this.unsubscribe) this.unsubscribe();
      this.creator = null; // Resetujemy widok przed ładowaniem nowych danych

      if (id) {
        const creatorRef = doc(this.firestore, 'market', id);
        this.unsubscribe = onSnapshot(creatorRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            this.creator = { 
              id: snapshot.id, 
              ...data,
              // Mapowanie dla kompatybilności z modalem handlu
              avatarUrl: data['thumbnailUrl'],
              stock: {
                currentPrice: data['currentPrice']
              }
            };
            this.updateChartData(data['priceHistory'] || []);
          }
        });
      }
    });
  }

  getOwnedCount(): number {
    return this.creator ? this.walletService.getOwnedAmount(this.creator.id) : 0;
  }

  openTrade(type: 'BUY' | 'SELL') {
    if (this.parent && this.creator) {
      this.parent.openTrade(this.creator as Youtuber, type);
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  private updateChartData(history: number[]) {
    if (history.length === 0) return;

    // Kolor w zależności od trendu
    const isUp = history[history.length - 1] >= history[0];
    const color = isUp ? '#00ff88' : '#ff3e3e';
    const bgColor = isUp ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 62, 62, 0.1)';

    this.lineChartData = {
      labels: history.map((_, i) => `T-${history.length - i}`),
      datasets: [{
        ...this.lineChartData.datasets[0],
        data: history,
        borderColor: color,
        backgroundColor: bgColor
      }]
    };
  }
}
