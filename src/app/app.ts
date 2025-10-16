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
  captured = false;

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

  captureFace() {
    this.captured = true;
  }

  retake() {
    this.captured = false;
  }
}
