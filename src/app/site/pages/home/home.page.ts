import { Component } from '@angular/core';
// tslint:disable-next-line: no-submodule-imports
import { AngularFireStorage } from '@angular/fire/storage';
import { GoogleAnalyticsService } from '../../../services/google-analytics/google-analytics.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  constructor(
    private afs: AngularFireStorage,
    private googleAnalytics: GoogleAnalyticsService
  ) {}

  public async downloadForWindows() {
    const pathReference = this.afs.ref('windows/Infiniti Clips.exe');
    const downloadUrl: string = await pathReference
      .getDownloadURL()
      .toPromise();
    await this.download(downloadUrl);
  }

  public async downloadForMac() {
    const pathReference = this.afs.ref('mac/Infiniti Clips.dmg');
    const downloadUrl: string = await pathReference
      .getDownloadURL()
      .toPromise();
    await this.download(downloadUrl);
  }

  public async download(url) {
    // const response = await fetch(downloadUrl);
    // const blob = new Blob([await response.blob()], {
    //   type: 'application/octet-stream'
    // });
    // const URL = window.URL;
    // const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.setAttribute('href', url);
    a.setAttribute('download', 'Infiniti Clips' + '.exe');
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click'));
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
    this.googleAnalytics.trackEvent('download', 'click', 'mac');
  }
}