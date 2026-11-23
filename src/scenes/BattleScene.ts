import Phaser from 'phaser';

type Enemy = { body: Phaser.GameObjects.Container; hp: number; speed: number; lastShot: number };
type Bullet = { body: Phaser.GameObjects.Arc; vx: number; vy: number; enemy: boolean; life: number };

export class BattleScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Container;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private stars: Phaser.GameObjects.Arc[] = [];
  private hud!: Phaser.GameObjects.Text;
  private hp = 100;
  private shield = 100;
  private score = 0;
  private lastFire = 0;
  private lastSpawn = 0;
  private pointerId: number | null = null;
  private move = new Phaser.Math.Vector2();
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private fireButton!: Phaser.GameObjects.Arc;
  private fireLabel!: Phaser.GameObjects.Text;
  private firePressed = false;
  private over = false;

  constructor() { super('BattleScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#040b1b');
    const w = this.scale.width, h = this.scale.height;
    for (let i = 0; i < 130; i++) {
      const star = this.add.circle(Phaser.Math.Between(0,w),Phaser.Math.Between(0,h),Math.random()*1.8+.3,0x9dd8ff,Math.random()*.7+.2);
      this.stars.push(star);
    }
    this.ship = this.makeShip(w/2,h/2,0x3ddcff);
    this.hud = this.add.text(14,12,'',{fontFamily:'monospace',fontSize:'15px',color:'#d8faff',backgroundColor:'#061429cc',padding:{x:9,y:7}}).setDepth(30);
    this.fireButton = this.add.circle(w-72,h-84,43,0xff6b43,.24).setStrokeStyle(2,0xff875f).setScrollFactor(0).setDepth(30).setInteractive();
    this.fireLabel = this.add.text(w-72,h-84,'ATEŞ',{fontFamily:'sans-serif',fontSize:'15px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5).setDepth(31);
    this.fireButton.on('pointerdown',()=>{this.firePressed=true;});
    this.input.on('pointerup',()=>{this.firePressed=false;this.pointerId=null;this.move.set(0,0);});
    this.input.on('pointerdown',(p:Phaser.Input.Pointer,targets:Phaser.GameObjects.GameObject[])=>{
      if(this.over){this.scene.restart();return;}
      if(targets.includes(this.fireButton))return;
      if(this.pointerId===null)this.pointerId=p.id;
    });
    this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{
      if(p.id!==this.pointerId)return;
      const dx=p.x-this.ship.x,dy=p.y-this.ship.y;
      this.move.set(dx,dy);
      if(this.move.length()>15)this.move.normalize();else this.move.set(0,0);
    });
    this.keys=this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE') as Record<string,Phaser.Input.Keyboard.Key> | undefined;
    this.scale.on('resize',(s:Phaser.Structs.Size)=>{this.fireButton.setPosition(s.width-72,s.height-84);this.fireLabel.setPosition(s.width-72,s.height-84);});
    this.add.text(w/2,70,'KOSCHEI • GALACTIC EMPIRES',{fontSize:'17px',color:'#61dfff',fontStyle:'bold'}).setOrigin(.5).setDepth(20);
    this.add.text(w/2,96,'Sol tarafta sürükle • Sağda ATEŞ',{fontSize:'12px',color:'#b4d5ec'}).setOrigin(.5).setDepth(20);
  }

  private makeShip(x:number,y:number,color:number) {
    const g=this.add.graphics();
    g.fillStyle(color,.95);g.fillTriangle(0,-23,-14,16,14,16);
    g.fillStyle(0x0b1b3d);g.fillTriangle(0,-11,-6,11,6,11);
    g.fillStyle(0xffb65e);g.fillTriangle(-8,15,-3,24,0,14);g.fillTriangle(8,15,3,24,0,14);
    return this.add.container(x,y,[g]).setDepth(10);
  }
  private spawnEnemy() {
    const w=this.scale.width,h=this.scale.height;
    const side=Phaser.Math.Between(0,3);
    const x=side===0?-30:side===1?w+30:Phaser.Math.Between(0,w);
    const y=side===2?-30:side===3?h+30:Phaser.Math.Between(0,h);
    const body=this.makeShip(x,y,0xff597c);body.setRotation(Math.PI);
    this.enemies.push({body,hp:3,speed:Phaser.Math.Between(42,76),lastShot:0});
  }
  private shoot(x:number,y:number,angle:number,enemy:boolean) {
    const b=this.add.circle(x,y,enemy?4:3,enemy?0xff597c:0x5cf9ff).setDepth(8);
    this.bullets.push({body:b,vx:Math.cos(angle)*(enemy?185:450),vy:Math.sin(angle)*(enemy?185:450),enemy,life:2});
  }
  update(time:number,delta:number) {
    if(this.over)return;
    const dt=Math.min(delta/1000,.05),w=this.scale.width,h=this.scale.height;
    const m=this.move.clone();
    if(this.keys){
      if(this.keys.A?.isDown||this.keys.LEFT?.isDown)m.x=-1;
      if(this.keys.D?.isDown||this.keys.RIGHT?.isDown)m.x=1;
      if(this.keys.W?.isDown||this.keys.UP?.isDown)m.y=-1;
      if(this.keys.S?.isDown||this.keys.DOWN?.isDown)m.y=1;
    }
    if(m.length()>1)m.normalize();
    this.ship.x=Phaser.Math.Clamp(this.ship.x+m.x*235*dt,22,w-22);
    this.ship.y=Phaser.Math.Clamp(this.ship.y+m.y*235*dt,25,h-25);
    if(m.length()>.1)this.ship.rotation=Phaser.Math.Angle.RotateTo(this.ship.rotation,Math.atan2(m.y,m.x)+Math.PI/2,dt*7);
    for(const s of this.stars){s.y+=dt*13;if(s.y>h){s.y=0;s.x=Math.random()*w;}}
    if(time-this.lastSpawn>1700&&this.enemies.length<14){this.spawnEnemy();this.lastSpawn=time;}
    const nearest=this.enemies.reduce<Enemy|null>((best,e)=>!best||Phaser.Math.Distance.Between(e.body.x,e.body.y,this.ship.x,this.ship.y)<Phaser.Math.Distance.Between(best.body.x,best.body.y,this.ship.x,this.ship.y)?e:best,null);
    if((this.firePressed||this.keys?.SPACE?.isDown)&&time-this.lastFire>180){
      const angle=nearest?Math.atan2(nearest.body.y-this.ship.y,nearest.body.x-this.ship.x):-Math.PI/2;
      this.shoot(this.ship.x,this.ship.y,angle,false);this.lastFire=time;
    }
    for(const e of this.enemies){
      const angle=Math.atan2(this.ship.y-e.body.y,this.ship.x-e.body.x);
      e.body.rotation=angle+Math.PI/2;
      const distance=Phaser.Math.Distance.Between(e.body.x,e.body.y,this.ship.x,this.ship.y);
      if(distance>115){e.body.x+=Math.cos(angle)*e.speed*dt;e.body.y+=Math.sin(angle)*e.speed*dt;}
      if(distance<390&&time-e.lastShot>1900){this.shoot(e.body.x,e.body.y,angle,true);e.lastShot=time;}
      if(distance<27){this.takeDamage(15*dt);}
    }
    for(let i=this.bullets.length-1;i>=0;i--){
      const b=this.bullets[i];b.body.x+=b.vx*dt;b.body.y+=b.vy*dt;b.life-=dt;
      let hit=false;
      if(b.enemy){
        if(Phaser.Math.Distance.Between(b.body.x,b.body.y,this.ship.x,this.ship.y)<17){this.takeDamage(12);hit=true;}
      }else{
        const e=this.enemies.find(e=>Phaser.Math.Distance.Between(e.body.x,e.body.y,b.body.x,b.body.y)<20);
        if(e){e.hp--;hit=true;if(e.hp<=0){e.body.destroy();this.enemies.splice(this.enemies.indexOf(e),1);this.score+=100;this.shield=Math.min(100,this.shield+3);}}
      }
      if(hit||b.life<=0||b.body.x<0||b.body.x>w||b.body.y<0||b.body.y>h){b.body.destroy();this.bullets.splice(i,1);}
    }
    this.hud.setText('KOSCHEI  •  PROTOTİP\nCAN '+Math.ceil(this.hp)+'  KALKAN '+Math.ceil(this.shield)+'\nSKOR '+this.score+'  DRON '+this.enemies.length);
    if(this.hp<=0){this.over=true;this.add.rectangle(w/2,h/2,w,140,0x040b1b,.9).setDepth(40);this.add.text(w/2,h/2,'GEMİ KAYBEDİLDİ\nYeniden başlamak için dokun',{fontSize:'21px',align:'center',color:'#ffb8a6'}).setOrigin(.5).setDepth(41);}
  }
  private takeDamage(amount:number){
    const absorbed=Math.min(this.shield,amount);this.shield-=absorbed;this.hp=Math.max(0,this.hp-(amount-absorbed));
  }
}
