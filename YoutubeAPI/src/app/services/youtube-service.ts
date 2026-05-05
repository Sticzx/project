import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { Youtuber } from '../interfaces/youtuber';

@Injectable({
  providedIn: 'root',
})
export class YoutubeService {
  private readonly clientId = import.meta.env['NG_APP_CLIENT_ID'];
  private accessToken: string | null = null;

  constructor(private http: HttpClient, private ngZone: NgZone) { }

  inicjalizujLogowanie(onSuccess: () => void) {
    // @ts-ignore
    const client = google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      callback: (response: any) => {
        this.ngZone.run(() => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            localStorage.setItem('google_access_token', response.access_token);
            console.log('Zalogowano pomyślnie!');
            onSuccess();
          }
        });
      },
    });

    client.requestAccessToken();
  }

  getSubscriptions(): Observable<any> {
    const url = 'https://www.googleapis.com/youtube/v3/subscriptions?mine=true&part=snippet&maxResults=5';
    return this.http.get(url);
  }

  getUserSubscriptionsPool(): Observable<Youtuber[]> {
    const url = 'https://www.googleapis.com/youtube/v3/subscriptions?mine=true&part=snippet&maxResults=50';
    return this.http.get<any>(url).pipe(
      switchMap(response => {
        if (!response.items || response.items.length === 0) {
          return of([]);
        }
        const ids = response.items.map((item: any) => item.snippet.resourceId.channelId).join(',');
        const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&maxResults=50`;
        return this.http.get<any>(channelsUrl).pipe(
          map(channelsResponse => {
            return channelsResponse.items.map((item: any) => {
              return {
                id: item.id,
                name: item.snippet.title,
                handle: item.snippet.customUrl,
                avatarUrl: item.snippet.thumbnails?.default?.url || '',
                joinedYear: new Date(item.snippet.publishedAt).getFullYear(),
                subCount: Number(item.statistics.subscriberCount) || 0,
                totalViews: Number(item.statistics.viewCount) || 0,
                videoCount: Number(item.statistics.videoCount) || 0,
                description: item.snippet.description || ''
              } as Youtuber;
            });
          })
        );
      })
    );
  }

  getToken() {
    return this.accessToken || localStorage.getItem('google_access_token');
  }
}