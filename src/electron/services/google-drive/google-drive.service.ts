import { EventEmitter } from 'events';
import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
// tslint:disable-next-line: no-submodule-imports
import { drive_v3, google } from 'googleapis';
import * as os from 'os';
import * as path from 'path';
import { BehaviorSubject, Subject } from 'rxjs';
import { buffer, delay, mergeMap, tap } from 'rxjs/operators';
import { Clip } from './../../models/models';

import * as stream from 'stream';
export default class GoogleDriveService extends EventEmitter {
  private drive: drive_v3.Drive;
  private completeSubject = new BehaviorSubject<{ next: boolean }>({
    next: true
  });
  private nextClipSubject = new Subject<Clip>();

  constructor(private googleOAuth2Client: OAuth2Client) {
    super();
    this.drive = google.drive({ version: 'v3', auth: googleOAuth2Client });
    this.initialize();
  }

  private async listClipboardFiles() {
    const result = await this.drive.files.list({
      spaces: 'appDataFolder',
      fields: 'nextPageToken, files(id, name)',
      pageSize: 100
    });
    return result.data.files;
  }

  private async watchClipboardFile() {
    const behaviourSubject = new BehaviorSubject(
      (await this.drive.changes.getStartPageToken({})).data.startPageToken
    );

    behaviourSubject
      .asObservable()
      .pipe(delay(10000))
      .subscribe(async pageToken => {
        try {
          console.error(pageToken);
          const {
            newStartPageToken,
            nextPageToken,
            changes
          } = (await this.drive.changes.list({
            spaces: 'appDataFolder',
            pageToken,
            fields: '*'
          })).data;

          changes.forEach(change => {
            console.log('Change found for file:', change.fileId);
          });

          behaviourSubject.next(nextPageToken || newStartPageToken);
        } catch (error) {
          console.error(error);
        }
      });
    // this.createClipboardFile({ cia0: 'hello' });
  }

  private createStream(str: string) {
    const readableStream = new stream.Readable();
    readableStream.push(str);
    readableStream.push(null);
    return readableStream;
  }

  private async createFileAndAddToDrive<T>(obj: T) {
    const fileMetadata = {
      name: 'clips.json',
      parents: ['appDataFolder']
    };
    const media = {
      mimeType: 'application/json',
      body: this.createStream(JSON.stringify(obj))
    };
    return this.drive.files.create(({
      resource: fileMetadata,
      media,
      fields: 'id'
    } as unknown) as any);
  }

  public async addToDrive(clip: Clip) {
    this.nextClipSubject.next(clip);
  }

  public initialize() {
    const addFile = async (clips: Clip[]): Promise<any> => {
      const clipMap = clips.reduce(
        (acc: { [key: string]: Clip }, currentClip) => {
          acc[currentClip.id] = currentClip;
          return acc;
        },
        {}
      );
      const result = await this.createFileAndAddToDrive(clipMap);
      return new Promise(resolve => setTimeout(() => resolve(result), 10000));
    };

    this.nextClipSubject
      .asObservable()
      .pipe(
        buffer(this.completeSubject.asObservable()),
        mergeMap(clips =>
          clips.length > 0 ? addFile(clips) : Promise.resolve([])
        ),
        delay(1000),
        tap(result => this.completeSubject.next({ next: true }))
      )
      .subscribe(async res => {
        console.error('Subscription', res);
        // let [file] = await this.listClipboardFiles();
        // if (!file) {
        //   file = (await this.createClipboardFile({})).data;
        // }
        // await this.downloadFile(file.id);
      });
  }

  private downloadFile(fileId: string) {
    return new Promise(async (resolve, reject) => {
      const dest = fs.createWriteStream(
        path.join(os.tmpdir(), `${fileId}.json`)
      );
      console.log('Found file:', fileId);

      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      (response.data as any)
        .on('end', () => {
          console.log('Done downloading file.');
          resolve();
        })
        .on('error', err => {
          console.error('Error downloading file.');
          reject(err);
        })
        .on('data', d => {})
        .pipe(dest);
    });
  }
}
