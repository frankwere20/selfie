import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

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
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('frameCanvas') frameCanvasElement!: ElementRef<HTMLCanvasElement>;

  capturedImage: boolean = false;
  private stream: MediaStream | null = null;
  private sessionId: string = '';
  private ws: WebSocket | null = null;

  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  async ngOnInit() {
    this.sessionId = this.route.snapshot.params['sessionId'];
    await this.initializeCamera();
    this.setupWebSocket();
  }

  private async initializeCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment',
          aspectRatio: 4 / 3,
          autoGainControl: true,
        },
      });

      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    } catch (err) {
      this.snackBar.open('Camera access denied', 'Close', {
        duration: 3000,
      });
    }
  }

  private setupWebSocket() {
    this.ws = new WebSocket(`${environment.websocketUrl}/${this.sessionId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.snackBar.open('Connection error', 'Close', {
        duration: 3000,
      });
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  captureImage() {
    if (
      !this.videoElement?.nativeElement ||
      !this.canvasElement?.nativeElement ||
      !this.frameCanvasElement?.nativeElement
    ) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const frameCanvas = this.frameCanvasElement.nativeElement;

    // Set full video dimensions for the main canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Calculate frame dimensions and position
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    const frameAspectRatio = 4 / 3; // Your guide frame aspect ratio

    let frameWidth, frameHeight, frameX, frameY;

    if (videoAspectRatio > frameAspectRatio) {
      // Video is wider than frame
      frameHeight = video.videoHeight * 0.6; // 60% of height
      frameWidth = frameHeight * frameAspectRatio;
      frameX = (video.videoWidth - frameWidth) / 2;
      frameY = (video.videoHeight - frameHeight) / 2;
    } else {
      // Video is taller than frame
      frameWidth = video.videoWidth * 0.8; // 80% of width
      frameHeight = frameWidth / frameAspectRatio;
      frameX = (video.videoWidth - frameWidth) / 2;
      frameY = (video.videoHeight - frameHeight) / 2;
    }

    // Draw the full image first
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    // Set up the frame canvas for the cropped image
    frameCanvas.width = frameWidth;
    frameCanvas.height = frameHeight;
    const frameCtx = frameCanvas.getContext('2d');

    // Draw only the frame area to the frame canvas
    frameCtx?.drawImage(
      video,
      frameX,
      frameY,
      frameWidth,
      frameHeight, // Source rectangle
      0,
      0,
      frameWidth,
      frameHeight // Destination rectangle
    );

    this.capturedImage = true;
  }

  sendImage() {
    console.log('sendImage', this.frameCanvasElement?.nativeElement);
    if (!this.frameCanvasElement?.nativeElement) {
      return;
    }

    // Use the frame canvas (cropped image) instead of the full canvas
    const imageData = this.frameCanvasElement.nativeElement.toDataURL(
      'image/jpeg',
      0.8
    );

    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');

    console.log('base64Data', base64Data);

    this.ws?.send(
      JSON.stringify({
        fileName: 'test',
        data: base64Data,
      })
    );

    this.snackBar.open('Image sent successfully!', 'Close', {
      duration: 3000,
    });
  }

  retake() {
    this.capturedImage = false;
  }

  close() {}

  ngOnDestroy() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.ws?.close();
  }
}
