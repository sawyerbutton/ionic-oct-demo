import {Inject, Injectable} from '@angular/core';
import {
    Plugins, CameraResultType, Capacitor, FilesystemDirectory,
    CameraPhoto, CameraSource
} from '@capacitor/core';

import {Platform} from '@ionic/angular';
import {HttpClient} from '@angular/common/http';
import {HTTP} from '@ionic-native/http/ngx';
import {Observable} from 'rxjs';

const {Camera, Filesystem, Storage} = Plugins;

@Injectable({
    providedIn: 'root'
})
export class PhotoService {
    public photos: Photo[] = [];
    private platform: Platform;

    constructor(
        platform: Platform,
        private http: HttpClient,
        @Inject('BASE_CONFIG') private config
    ) {
        this.platform = platform;
    }

    public async addNewToGallery() {
        // Take a photo
        const capturedPhoto = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });
        // Save the picture and add it to photo collection
        const savedImageFile = await this.savePicture(capturedPhoto);
        this.photos.unshift(savedImageFile);
    }

    private async savePicture(cameraPhoto: CameraPhoto) {
        // Convert photo to base64 format, required by Filesystem API to save
        const base64Data = await this.readAsBase64(cameraPhoto);

        // Write the file to the data directory
        const fileName = new Date().getTime() + '.jpeg';
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });

        if (this.platform.is('hybrid')) {
            // Display the new image by rewriting the 'file://' path to HTTP
            // Details: https://ionicframework.com/docs/building/webview#file-protocol
            return {
                filepath: savedFile.uri,
                data: base64Data,
                webviewPath: Capacitor.convertFileSrc(savedFile.uri),
            };
        } else {
            // Use webPath to display the new image instead of base64 since it's
            // already loaded into memory
            return {
                filepath: fileName,
                data: base64Data,
                webviewPath: cameraPhoto.webPath
            };
        }
    }

    private async readAsBase64(cameraPhoto: CameraPhoto) {
        // "hybrid" will detect Cordova or Capacitor
        if (this.platform.is('hybrid')) {
            // Read the file into base64 format
            const file = await Filesystem.readFile({
                path: cameraPhoto.path
            });

            return file.data;
        } else {
            // Fetch the photo, read as a blob, then convert to base64 format
            const response = await fetch(cameraPhoto.webPath);
            const blob = await response.blob();

            return await this.convertBlobToBase64(blob) as string;
        }
    }

    convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
        // tslint:disable-next-line:new-parens
        const reader = new FileReader;
        reader.onerror = reject;
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.readAsDataURL(blob);
    })

    uploadFileToServer(photo: Photo): Observable<any> {
        const formData = new FormData();
        formData.append('file', this.b64toBlob(photo.data), `${photo.filepath}`);
        formData.append('name', name);
        return this.http.post('http://192.168.1.14:3000/', formData);
    }

    b64toBlob(b64Data, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }
}

export interface Photo {
    filepath: string;
    webviewPath: string;
    data: any;
}
