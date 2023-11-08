import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Viewer, ScreenSpaceEventHandler, ScreenSpaceEventType, sampleTerrainMostDetailed, Rectangle, Cartesian2, VerticalOrigin, HorizontalOrigin, CesiumTerrainProvider, Camera, TileMapServiceImageryProvider, buildModuleUrl, Cartographic, Math, WebMapServiceImageryProvider, WebMapTileServiceImageryProvider, GeographicTilingScheme, Resource, Request, SceneMode, Cartesian3, defined, Matrix3, Matrix4, Transforms, JulianDate, PolylineCollection, Material, Color, ClockRange, SampledPositionProperty } from 'cesium'
import { eciToGeodetic, gstime, propagate, sgp4, twoline2satrec } from 'satellite.js';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  viewer: any;
  subjectArray: Array<any> = [];
  previousTime = Date.now();
  spinRate = 1.0;
  satrec: any;
  viewInInertial: boolean = true;
  earthRotation: boolean = false;
  CesiumMath = Math;
  object: any
  constructor() { }


  ngOnDestroy() {
    this.subjectArray.forEach(subject => {
      if (subject != undefined) {
        subject.unsubscribe();
      }
    })
  }


  ngOnInit(): void {
    this.viewer = new Viewer("cesiumContainer", {
      sceneMode: SceneMode.SCENE3D,
      infoBox: false,
      geocoder: false,
      timeline: true,
      animation: false,
      homeButton: false,
      scene3DOnly: false,
      baseLayerPicker: false,
      sceneModePicker: true,
      fullscreenButton: false,
      projectionPicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      // shadows : true,
      shouldAnimate: true
    });
    this.viewer.scene.globe.enableLighting = true;

    this.object = this.viewer.entities.add({
      position: Cartesian3.fromDegrees(0, 0,),
      model: {
        uri: "assets/weixin.gltf",
        minimumPixelSize: 128,
        maximumScale: 20000,
      }
    });


    const tleLine1 = '1 38248U 12017A   23276.02948347  .00011244  00000-0  55674-3 0  9995';
    const tleLine2 = '2 38248  97.5409 288.5412 0005504  75.4777 284.7067 15.17938706630361';

    // Initialize a satellite record
    this.satrec = twoline2satrec(tleLine1, tleLine2);
    this.plotSAT(this.satrec)
    console.log(this.satrec)
    this.viewer.clock.multiplier = 1000; // speed of the simulation

    this.viewer.scene.preRender.addEventListener((scene, time) => {
      this.onPreRender(time)
     
    });
    if (this.earthRotation) {
      this.viewer.trackedEntity = this.object;
    }


    const polylines = new PolylineCollection({show: true});
    let currentTLE;

  }
  ngAfterViewInit(): void {

  }
  updateCamera(time) {
    const camera = this.viewer.scene.camera;

    const icrfToFixed = Transforms.computeIcrfToFixedMatrix(time);
    if (icrfToFixed) {
      const offset = Cartesian3.clone(camera.position);
      const transform = Matrix4.fromRotationTranslation(icrfToFixed);

      if (this.earthRotation) {
        camera.lookAtTransform(transform, offset);
      }
    }
  }

  onPreRender(time) {
    // console.log(time)

    this.updateCamera(time);
    this.updatePosition(time);
  }

  updatePosition(julianDate: any) {
    const date = JulianDate.toDate(julianDate);

    const positionAndVelocity = propagate(this.satrec, date);

    const gmst = gstime(date);

    const positionEci: any = positionAndVelocity.position;
    const positionGd: any = eciToGeodetic(positionEci, gmst);

    const longitude = positionGd.longitude;
    const latitude = positionGd.latitude;
    const height = positionGd.height;

    const positionInFixed = Cartesian3.fromDegrees(this.CesiumMath.toDegrees(longitude), this.CesiumMath.toDegrees(latitude), height);

    if (this.viewInInertial) {
      const fixedToIcrf = Transforms.computeFixedToIcrfMatrix(julianDate);

      let positionInInertial = new Cartesian3();

      if (defined(fixedToIcrf)) {
        positionInInertial = Matrix3.multiplyByVector(fixedToIcrf, positionInFixed, positionInInertial);
      }

      this.object.position.setValue(positionInInertial);
    } else {
      this.object.position.setValue(positionInFixed);
    }
  }
  plotSAT(TLErec) {
    const totalSeconds = 60 * 60 * 6;
    const timestepInSeconds = 10;
    const start = JulianDate.fromDate(new Date());
    const stop =JulianDate.addSeconds(start, totalSeconds, new JulianDate());
    this.viewer.clock.startTime = start.clone();
    this.viewer.clock.stopTime = stop.clone();
    this.viewer.clock.currentTime = start.clone();
    this.viewer.timeline.zoomTo(start, stop);
    this.viewer.clock.multiplier = 1000;
    this.viewer.clock.clockRange = ClockRange.LOOP_STOP;
    
    const positionsOverTime = new SampledPositionProperty();
    let p;
    let position;
    const positions:Array<any> = [];

    for (let i = 0; i < totalSeconds; i += timestepInSeconds) {
      const time = JulianDate.addSeconds(start, i, new JulianDate());
      const jsDate = JulianDate.toDate(time);
  
      const positionAndVelocity = propagate(TLErec, jsDate);
      const gmst = gstime(jsDate);
      console.log("position and velocity: ", positionAndVelocity)
      // @ts-ignore
      const p = eciToGeodetic(positionAndVelocity.position, gmst);
  
      const position = Cartesian3.fromRadians(p.longitude, p.latitude, p.height * 1000);
      positions.push(position);
    }
  
    this.viewer.entities.add({
      name: "orbit line",
      polyline: {
        positions: positions,
        material: Color.RED,
        width: 1,
      }
    });
  
  }

}
