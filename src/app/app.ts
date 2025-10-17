import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  @ViewChild('video', { static: false })
  videoRef!: ElementRef<HTMLVideoElement>;

  @ViewChild('canvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  captured = false;
  capturedImage: string | null = null;
  private stream: MediaStream | null = null;

  ngAfterViewInit() {
    this.startCamera();
  }

  async startCamera() {
    try {
      // Stop existing stream if any
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera for selfie
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (this.videoRef.nativeElement) {
        this.videoRef.nativeElement.srcObject = this.stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  }

  captureImage() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL (JPEG format)
      this.capturedImage = canvas.toDataURL('image/jpeg');

      // Set captured flag to true
      this.captured = true;

      // Stop camera stream to save resources
      this.stopCamera();
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
  }

  retake() {
    // Reset captured state
    this.captured = false;
    this.capturedImage = null;

    // Restart camera
    this.startCamera();
  }

  saveImage() {
    if (this.capturedImage) {
      // Here you can implement the save functionality
      console.log('Saving image:', this.capturedImage);

      // Example: Download the image
      this.downloadImage(this.capturedImage);

      // Or send to backend
      // this.uploadToBackend(this.capturedImage);
    }
  }

  private downloadImage(dataUrl: string) {
    const link = document.createElement('a');
    link.download = 'selfie.jpg';
    link.href = dataUrl;
    link.click();
  }

  ngOnDestroy() {
    // Clean up when component is destroyed
    this.stopCamera();
  }
}
