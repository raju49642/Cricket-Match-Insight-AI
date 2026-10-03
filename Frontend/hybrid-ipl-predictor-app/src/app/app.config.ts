import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

// Standalone bootstrap config. provideHttpClient() is required so
// PredictionService can call the Flask backend with HttpClient.
export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()]
};
