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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (this.videoRef.nativeElement) {
        this.videoRef.nativeElement.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  }

  // captureFace() {
  //   this.captured = true;
  // }

  captureFace() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    canvas.width = 300;
    canvas.height = 300;

    const context = canvas.getContext('2d');
    if (context && video.videoWidth > 0) {
      const videoRect = video.getBoundingClientRect();
      const overlayRect = {
        left: (window.innerWidth - 340) / 2,
        top: window.innerHeight * 0.2,
      };

      // Calculate the scale between video element and actual video dimensions
      const scaleX = video.videoWidth / videoRect.width;
      const scaleY = video.videoHeight / videoRect.height;

      // Calculate the focus ring position in video coordinates
      const focusRingX = (overlayRect.left - videoRect.left) * scaleX + 20; // 20px padding for 340px->300px
      const focusRingY = (overlayRect.top - videoRect.top) * scaleY + 20;
      const focusRingSize = 300 * Math.min(scaleX, scaleY); // 300px focus ring size

      // Clear canvas and create circular clipping path
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.arc(150, 150, 150, 0, 2 * Math.PI); // Center at 150,150 with radius 150
      context.closePath();
      context.clip();

      // Draw only the focus ring area from the video
      context.drawImage(
        video,
        focusRingX,
        focusRingY, // Source X, Y (focus ring position in video)
        focusRingSize,
        focusRingSize, // Source width, height (focus ring size in video)
        0,
        0, // Destination X, Y
        300,
        300 // Destination width, height
      );

      // Convert to data URL and update state
      this.capturedImage = canvas.toDataURL('image/jpeg');
      this.captured = true;
      console.log('this is the image: ', this.capturedImage);

      // Stop camera stream
      this.stopCamera();
    }
  }

  retake() {
    this.captured = false;
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
  }
}
