import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, MeshBuilder, StandardMaterial, HemisphericLight, PointLight, Texture, DynamicTexture, GlowLayer } from '@babylonjs/core';
import './orion.css';

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas');
if (!canvas) throw new Error('Orion canvas bulunamadı');
const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true }, true);
engine.setHardwareScalingLevel(Math.max(1, Math.min(2, window.devicePixelRatio / 1.5)));
const scene = new Scene(engine);
scene.clearColor = new Color4(0.008, 0.015, 0.045, 1);

const camera = new ArcRotateCamera('orbit', -Math.PI / 2.5, Math.PI / 2.25, 13, Vector3.Zero(), scene);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 7;
camera.upperRadiusLimit = 27;
camera.lowerBetaLimit = 0.2;
camera.upperBetaLimit = Math.PI - 0.2;
camera.wheelPrecision = 35;
camera.pinchPrecision = 80;
camera.inertia = 0.78;

const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
ambient.intensity = 0.38;
const sun = new PointLight('sun', new Vector3(-12, 7, -9), scene);
sun.intensity = 850;

const planet = MeshBuilder.CreateSphere('orion', { diameter: 7, segments: 64 }, scene);
const planetMaterial = new StandardMaterial('surface', scene);
const map = new DynamicTexture('orion-map', { width: 512, height: 256 }, scene, false);
const ctx = map.getContext();
const W = 512, H = 256;
const image = ctx.getImageData(0, 0, W, H);
const hash = (x:number,y:number) => {
  const v = Math.sin(x*127.1+y*311.7)*43758.5453;
  return v-Math.floor(v);
};
const noise=(x:number,y:number)=>{
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
};
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const nx=x/W,ny=y/H;
  const n=.56*noise(nx*5,ny*5)+.28*noise(nx*12,ny*12)+.16*noise(nx*33,ny*33);
  const lat=Math.abs(ny-.5)*2;
  let rgb:[number,number,number];
  if(lat>.88)rgb=[211,233,235];
  else if(n<.49)rgb=[7,47+Math.floor(n*85),118+Math.floor(n*115)];
  else if(n<.515)rgb=[40,145,151];
  else if(n<.62)rgb=[19+Math.floor(n*35),87+Math.floor(n*95),64];
  else if(n<.7)rgb=[102,134,94];
  else rgb=[166,170,152];
  const k=(y*W+x)*4;image.data[k]=rgb[0];image.data[k+1]=rgb[1];image.data[k+2]=rgb[2];image.data[k+3]=255;
}
ctx.putImageData(image,0,0);map.update();
planetMaterial.diffuseTexture=map;
planetMaterial.specularColor=new Color3(.1,.2,.25);
planet.material=planetMaterial;

const atmosphere = MeshBuilder.CreateSphere('atmosphere', { diameter: 7.3, segments: 48 }, scene);
const atmosphereMat = new StandardMaterial('atmosphere', scene);
atmosphereMat.diffuseColor=new Color3(.02,.3,.8);
atmosphereMat.emissiveColor=new Color3(.025,.12,.33);
atmosphereMat.alpha=.095;
atmosphereMat.backFaceCulling=false;
atmosphere.material=atmosphereMat;

// Glow disabled for initial mobile compatibility.

for(let i=0;i<100;i++){
  const theta=Math.random()*Math.PI*2;
  const z=Math.random()*2-1;
  const radius=65+Math.random()*30;
  const s=MeshBuilder.CreateSphere('star',{diameter:Math.random()*.09+.025,segments:4},scene);
  s.position.set(Math.cos(theta)*Math.sqrt(1-z*z)*radius,z*radius,Math.sin(theta)*Math.sqrt(1-z*z)*radius);
  const m=new StandardMaterial('starmat'+i,scene);
  m.disableLighting=true;m.emissiveColor=new Color3(.45+Math.random()*.55,.65+Math.random()*.35,1);
  s.material=m;
}

const moon=MeshBuilder.CreateSphere('moon',{diameter:1.1,segments:24},scene);
moon.position.set(8,2.4,1.2);
const moonMat=new StandardMaterial('moon-mat',scene);
moonMat.diffuseColor=new Color3(.4,.48,.57);
moon.material=moonMat;

scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(engine.getDeltaTime()/1000,.05);
  planet.rotation.y+=dt*.025;
  atmosphere.rotation.y+=dt*.01;
});
engine.runRenderLoop(()=>scene.render());
scene.executeWhenReady(()=>{const b=document.getElementById('boot');if(b)b.style.display='none';});
window.addEventListener('resize',()=>engine.resize());
document.addEventListener('visibilitychange',()=>{if(document.hidden)engine.stopRenderLoop();else engine.runRenderLoop(()=>scene.render());});
