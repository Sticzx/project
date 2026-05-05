import { Component } from '@angular/core';
import { YoutubeService } from '../../services/youtube-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login{

  constructor(private youtubeService: YoutubeService, private router: Router){}

  login(){
    this.youtubeService.inicjalizujLogowanie(() => {
      this.router.navigate(['/home']);
    });
  }

}
