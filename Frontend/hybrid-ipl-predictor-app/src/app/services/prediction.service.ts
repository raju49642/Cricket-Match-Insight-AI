import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PredictionRequest, PredictionResponse } from '../models/prediction.model';

@Injectable({ providedIn: 'root' })
export class PredictionService {
  // Existing Flask backend. Do NOT change this URL or the request/response shape.
  private readonly API_URL = 'http://127.0.0.1:5000/predict';

  constructor(private http: HttpClient) {}

  predictMatch(request: PredictionRequest): Observable<PredictionResponse> {
    return this.http
      .post<PredictionResponse>(this.API_URL, request)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // The browser could not reach the server at all (Flask not running, CORS, etc.)
      return throwError(() => new Error('Prediction server unavailable.'));
    }

    // The backend responded, but with an error body, e.g. { "error": "..." }
    const backendMessage = error.error && (error.error as { error?: string }).error;
    return throwError(
      () => new Error(backendMessage || 'Something went wrong while predicting the match.')
    );
  }
}
