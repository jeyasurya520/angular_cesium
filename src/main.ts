import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Ion } from 'cesium';

import { AppModule } from './app/app.module';

(window as Record<string, any>)['CESIUM_BASE_URL'] = '/assets/cesium/';

// Uncomment the following line and add your personal access token if you are using Cesium Ion
//Ion.defaultAccessToken = '<Your access token here>';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1YThkZWM4Ni1hNDFlLTRlODEtYjI4OS1hOTYzNzYxOTY4MTMiLCJpZCI6MzAwNDAsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTMwMTE4NTZ9.inRXr73SAY9FVJG09oFj82GdMLNUemF0v8olRiXJ_fU';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
