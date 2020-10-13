import {Component} from '@angular/core';
import {Photo, PhotoService} from '../services/photo.service';
import {ToastController} from '@ionic/angular';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    constructor(
        private photoService: PhotoService,
        public toastController: ToastController
    ) {
    }

    addPhotoToGallery() {
        this.photoService.addNewToGallery();
    }

    uploadPhoto(photo: Photo) {
        this.photoService.uploadFileToServer(photo).subscribe((response) => {
            console.log(response);
        });
        this.presentToast(photo);
    }

    async presentToast(photo: Photo) {
        const toast = await this.toastController.create({
            message: `${photo.filepath}-${photo.webviewPath}`,
            duration: 2000
        });
        toast.present();
    }

}
