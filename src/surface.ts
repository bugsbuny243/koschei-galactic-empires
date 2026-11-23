import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, MeshBuilder, StandardMaterial, HemisphericLight, DirectionalLight, TransformNode } from '@babylonjs/core';

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas');
if (!canvas) throw new Error('Canvas eksik');
const loading = document.getElementById('loading');
try {
  const engine = new Engine(canvas, true, { stencil: false }, true);
  engine.setHardwareScalingLevel(Math.max(1, Math.min(2, devicePixelRatio / 1.4)));
  const scene = new Scene(engine);
  scene.clearColor = new Color4(.06,.14,.23,1);
  const camera = new ArcRotateCamera('colony-camera', -Math.PI/3, 1.08, 120, new Vector3(0,4,0), scene);
  camera.attachControl(canvas,true);
  camera.lowerRadiusLimit=22; camera.upperRadiusLimit=220;
  camera.lowerBetaLimit=.2; camera.upperBetaLimit=1.52;
  camera.wheelPrecision=20; camera.pinchPrecision=100;
  camera.panningSensibility=120;
  const ambient = new HemisphericLight('sky',new Vector3(0,1,0),scene);
  ambient.intensity=.85;
  const sunlight = new DirectionalLight('sun',new Vector3(-.5,-1,.3),scene);
  sunlight.intensity=1.2;

  function material(name:string, color:Color3, emissive?:Color3) {
    const m=new StandardMaterial(name,scene);
    m.diffuseColor=color;
    m.specularColor=new Color3(.08,.1,.12);
    if(emissive)m.emissiveColor=emissive;
    return m;
  }
  const groundMat=material('meadow',new Color3(.13,.32,.25));
  const plateauMat=material('plateau',new Color3(.22,.34,.31));
  const roadMat=material('road',new Color3(.16,.22,.28));
  const wallMat=material('architecture',new Color3(.62,.76,.79));
  const darkMat=material('dark metal',new Color3(.12,.2,.27));
  const glassMat=material('glass',new Color3(.06,.42,.55),new Color3(.01,.1,.14));
  const glowMat=material('cyan light',new Color3(.12,.8,.9),new Color3(.05,.52,.7));
  const padMat=material('landing pad',new Color3(.24,.3,.36));

  // Local playable terrain tile, not a spherical shell.
  const size=220, subdivisions=64;
  const terrain=MeshBuilder.CreateGround('terrain',{width:size,height:size,subdivisions},scene);
  const positions=terrain.getVerticesData('position');
  if(positions){
    for(let i=0;i<positions.length;i+=3){
      const x=positions[i],z=positions[i+2];
      const r=Math.hypot(x,z);
      const edge=Math.max(0,(r-55)/75);
      positions[i+1]=Math.sin(x*.09)*Math.cos(z*.075)*1.2*edge+Math.sin(x*.03+z*.06)*2.4*edge;
    }
    terrain.updateVerticesData('position',positions);
    terrain.createNormals(false);
  }
  terrain.material=groundMat;
  const roadX=MeshBuilder.CreateGround('main-road',{width:12,height:170},scene);roadX.position.y=.11;roadX.material=roadMat;
  const roadZ=MeshBuilder.CreateGround('cross-road',{width:170,height:12},scene);roadZ.position.y=.12;roadZ.material=roadMat;
  const plaza=MeshBuilder.CreateCylinder('central-plaza',{diameter:38,height:.45,tessellation:48},scene);plaza.position.y=.3;plaza.material=plateauMat;

  function building(x:number,z:number,w:number,h:number,d:number,accent=false){
    const body=MeshBuilder.CreateBox('colony-building',{width:w,height:h,depth:d},scene);
    body.position.set(x,h/2+.2,z);body.material=wallMat;
    const cap=MeshBuilder.CreateBox('roof',{width:w+1,height:1.2,depth:d+1},scene);
    cap.position.set(x,h+.8,z);cap.material=darkMat;
    if(accent){
      const antenna=MeshBuilder.CreateCylinder('signal-spire',{height:Math.min(12,h*.7),diameterTop:.1,diameterBottom:1.3,tessellation:8},scene);
      antenna.position.set(x,h+Math.min(12,h*.7)/2+1.4,z);antenna.material=glowMat;
    }
    const windowBand=MeshBuilder.CreateBox('glass-band',{width:w+.08,height:Math.max(1,h*.2),depth:d+.08},scene);
    windowBand.position.set(x,h*.7,z);windowBand.material=glassMat;
  }
  for(let i=0;i<30;i++){
    const x=((i*37)%150)-75,z=((i*53)%150)-75;
    if(Math.abs(x)<12||Math.abs(z)<12||Math.hypot(x,z)<27)continue;
    building(x,z,6+(i%4)*2,9+(i%6)*4,7+(i%3)*3,i%5===0);
  }
  const tower=MeshBuilder.CreateCylinder('command-tower',{height:30,diameterTop:8,diameterBottom:14,tessellation:12},scene);
  tower.position.y=15.7;tower.material=wallMat;
  const beacon=MeshBuilder.CreateSphere('command-beacon',{diameter:5,segments:16},scene);
  beacon.position.y=32;beacon.material=glowMat;
  for(const [x,z] of [[-36,-36],[36,-36],[-36,36],[36,36]]){
    const pad=MeshBuilder.CreateCylinder('ship-pad',{diameter:21,height:.5,tessellation:32},scene);
    pad.position.set(x,.4,z);pad.material=padMat;
    const ring=MeshBuilder.CreateTorus('pad-ring',{diameter:17,thickness:.5,tessellation:32},scene);
    ring.position.set(x,.75,z);ring.material=glowMat;
  }
  const craft=MeshBuilder.CreateBox('landed-craft',{width:8,height:2,depth:13},scene);
  craft.position.set(-36,2.1,-36);craft.material=darkMat;
  const wing=MeshBuilder.CreateBox('craft-wing',{width:15,height:.5,depth:4},scene);
  wing.position.set(-36,2.1,-36);wing.material=glassMat;
  const marker=MeshBuilder.CreateTorus('base-perimeter',{diameter:86,thickness:.25,tessellation:80},scene);
  marker.position.y=.45;marker.material=glowMat;

  scene.executeWhenReady(()=>{if(loading)loading.style.display='none';});
  engine.runRenderLoop(()=>scene.render());
  window.addEventListener('resize',()=>engine.resize());
} catch(e) {
  if(loading)loading.textContent='3D yüzey başlatılamadı: '+String(e);
}
