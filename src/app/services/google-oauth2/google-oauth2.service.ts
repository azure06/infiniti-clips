import { Injectable } from '@angular/core';
import { OAuth2Client } from 'google-auth-library';
import { ElectronService } from '../electron/electron.service';

@Injectable()
export class GoogleOAuth2Service {
  private oAuth2Client?: OAuth2Client;

  constructor(private electronService: ElectronService) {
    if (this.electronService.isAvailable) {
      const ipcRenderer = this.electronService.electron.ipcRenderer;

      ipcRenderer.send(
        'oauth2tokens',
        JSON.parse(localStorage.getItem('infiniti-clips-tokens') || null)
      );
      ipcRenderer.send('client-load');

      ipcRenderer.on('oauth2tokens-refresh', (event, authTokens) => {
        const localTokens =
          JSON.parse(localStorage.getItem('infiniti-clips-tokens') || null) || {};

        localStorage.setItem(
          'infiniti-clips-tokens',
          JSON.stringify({ ...localTokens, ...authTokens })
        );
      });
      ipcRenderer.on(
        'oauth2-client',
        (event, oAuth2Client) => (this.oAuth2Client = oAuth2Client)
      );
    }
  }

  get isAuthenticated() {
    return !!this.oAuth2Client;
  }

  public getOAuth2Client() {
    return this.oAuth2Client;
  }
}
