/* =====================================================================
   👑 VIP frames — 3D engine (ES module, loaded on demand by vip-frames.js)
   Builds the 14 approved frame designs in real 3D (three.js) and turns any
   design + colour into a small animated sprite sheet with a see-through
   centre, so the person's photo shows through. One hidden renderer only.
   window.VipFrames3D.sheet("lion:4") → Promise<{url, n, scale}>
   ===================================================================== */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";

const SIZE = 240, FRAMES = 12, LOOP = 3.3;
const canvas = document.createElement("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE, false); renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .72; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;
const camera = new THREE.PerspectiveCamera(32, 1, .1, 50); camera.position.set(0, 0, 5.6);

// materials
const gold=new THREE.MeshPhysicalMaterial({color:0xf2bd55,metalness:1,roughness:.24,clearcoat:.5,clearcoatRoughness:.1,envMapIntensity:1.05});
const gold2=new THREE.MeshPhysicalMaterial({color:0xe6ab45,metalness:1,roughness:.3,envMapIntensity:1.3,side:THREE.DoubleSide});
const gem=new THREE.MeshPhysicalMaterial({color:0x0c9a52,metalness:0,roughness:.03,clearcoat:1,ior:2.2,emissive:0x033a1f,emissiveIntensity:.3,envMapIntensity:2.2,flatShading:true});
const gemDark=new THREE.MeshPhysicalMaterial({color:0x08502d,metalness:.2,roughness:.25,clearcoat:1,envMapIntensity:1.6,side:THREE.DoubleSide});
const glowMat=new THREE.MeshBasicMaterial({color:new THREE.Color(1,2,1),toneMapped:false});
const root=new THREE.Group();scene.add(root);
const M4=new THREE.Matrix4();

// ring (shared)
root.add(new THREE.Mesh(new THREE.TorusGeometry(1,.105,48,220),gold));
const innerRing=new THREE.Mesh(new THREE.TorusGeometry(.885,.028,24,200),gem);root.add(innerRing);
root.add(new THREE.Mesh(new THREE.TorusGeometry(1.13,.02,16,200),gold));
const beads=new THREE.InstancedMesh(new THREE.SphereGeometry(.024,14,10),gold,60);
for(let i=0;i<60;i++){const a=i/60*Math.PI*2;M4.makeTranslation(Math.cos(a)*1.19,Math.sin(a)*1.19,0);beads.setMatrixAt(i,M4)}root.add(beads);
const gemGeo=new THREE.OctahedronGeometry(.08,0),bez=new THREE.TorusGeometry(.084,.017,12,32);
function ringGem(deg,parent){const a=deg*Math.PI/180,g=new THREE.Group(),m=new THREE.Mesh(gemGeo,gem);m.scale.set(1,1.2,.6);m.rotation.z=Math.PI/4;g.add(m);g.add(new THREE.Mesh(bez,gold));
  g.position.set(Math.cos(a),Math.sin(a),.1);g.rotation.z=a;parent.add(g);return g.position.clone()}

// ribbon (shared)
function banner(w,h,p){const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2+p,0);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.lineTo(-w/2-p,0);s.closePath();return s}
const ribbon=new THREE.Group();
const rb=new THREE.Mesh(new THREE.ExtrudeGeometry(banner(.98,.27,.08),{depth:.04,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:3}),gold);rb.geometry.center();ribbon.add(rb);
const rf=new THREE.Mesh(new THREE.ExtrudeGeometry(banner(.9,.2,.065),{depth:.02,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:2}),gemDark);rf.geometry.center();rf.position.z=.035;ribbon.add(rf);
[-1,1].forEach(sx=>{const t=new THREE.Shape();t.moveTo(0,.09);t.lineTo(.22,.13);t.lineTo(.16,0);t.lineTo(.24,-.13);t.lineTo(0,-.08);t.closePath();
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(t,{depth:.02,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2}),gemDark);m.scale.x=sx;m.position.set(sx*.52,-.04,-.04);m.rotation.y=sx*-.35;ribbon.add(m)});
let LABEL='VIP 1';
const tC=document.createElement('canvas');tC.width=1024;tC.height=256;const tTex=new THREE.CanvasTexture(tC);tTex.colorSpace=THREE.SRGBColorSpace;
function drawText(){const x=tC.getContext('2d');x.clearRect(0,0,1024,256);x.font='900 170px Cinzel, "Times New Roman", serif';x.textAlign='center';x.textBaseline='middle';
  const g=x.createLinearGradient(0,40,0,220);g.addColorStop(0,'#fff8d8');g.addColorStop(.45,'#f7d675');g.addColorStop(.75,'#b8801f');g.addColorStop(1,'#ffe8a0');
  x.lineWidth=10;x.strokeStyle='#4a2c04';x.strokeText(LABEL,512,138);x.fillStyle=g;x.fillText(LABEL,512,138);tTex.needsUpdate=true}
const txt=new THREE.Mesh(new THREE.PlaneGeometry(.78,.195),new THREE.MeshBasicMaterial({map:tTex,transparent:true,toneMapped:false}));txt.position.z=.062;ribbon.add(txt);
ribbon.position.set(0,-1.2,.12);root.add(ribbon);
const sstep=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};

// ================= A: angel wings + crown =================
const A=new THREE.Group();root.add(A);const gemPosA=[];
function featherGeo(L,w){const s=new THREE.Shape();s.moveTo(0,0);s.quadraticCurveTo(w,L*.45,0,L);s.quadraticCurveTo(-w*.55,L*.5,0,0);
  return new THREE.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:2,curveSegments:14})}
const wings=[];
[-1,1].forEach(side=>{
  const pivot=new THREE.Group();pivot.position.set(side*.92,.18,-.06);
  const wing=new THREE.Group();wing.scale.x=side;pivot.add(wing);
  const rows=[{n:8,L0:.62,L1:1.05,a0:12,a1:112,w:.11,mat:gold2,z:0,off:[0,0]},{n:7,L0:.42,L1:.7,a0:18,a1:105,w:.09,mat:gemDark,z:.03,off:[.04,-.02]},{n:6,L0:.24,L1:.38,a0:22,a1:100,w:.07,mat:gold,z:.06,off:[.06,-.03]}];
  rows.forEach(r=>{for(let i=0;i<r.n;i++){const u=i/(r.n-1),L=r.L0+(r.L1-r.L0)*Math.sin(u*Math.PI*.85+.25),ang=(r.a0+(r.a1-r.a0)*u)*Math.PI/180;
    const f=new THREE.Mesh(featherGeo(L,r.w),r.mat);f.position.set(r.off[0],r.off[1],r.z);f.rotation.z=-ang;f.rotation.y=.15;wing.add(f)}});
  for(let k=0;k<3;k++){const s=new THREE.Mesh(new THREE.OctahedronGeometry(.035,0),gem);s.position.set(.08+k*.07,.05+k*.04,.1);wing.add(s)}
  A.add(pivot);wings.push({pivot,side});
});
const crown=new THREE.Group();
crown.add(new THREE.Mesh(new THREE.CylinderGeometry(.27,.23,.13,48,1,true),gold2));
const dome=new THREE.Mesh(new THREE.SphereGeometry(.24,32,16,0,Math.PI*2,0,Math.PI/2),gemDark);dome.position.y=.02;dome.scale.y=.8;crown.add(dome);
for(let i=0;i<5;i++){const a=i/5*Math.PI*2+Math.PI/2;const sp=new THREE.Mesh(new THREE.ConeGeometry(.045,.2,4),gold);sp.position.set(Math.cos(a)*.25,.16,Math.sin(a)*.25);crown.add(sp);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.03,14,10),gold);ball.position.set(Math.cos(a)*.25,.28,Math.sin(a)*.25);crown.add(ball);
  const g=new THREE.Mesh(new THREE.OctahedronGeometry(.035,0),gem);g.position.set(Math.cos(a+.63)*.255,0,Math.sin(a+.63)*.255);crown.add(g)}
const cross=new THREE.Mesh(new THREE.OctahedronGeometry(.06,0),gem);cross.position.y=.27;cross.scale.set(1,1.4,1);crown.add(cross);
crown.position.set(0,1.2,0);crown.rotation.x=.25;A.add(crown);
[50,130,210,250,290,330].forEach(d=>gemPosA.push(ringGem(d,A)));
const halo=new THREE.Mesh(new THREE.TorusGeometry(.32,.012,12,80),glowMat);halo.position.set(0,1.58,0);halo.rotation.x=Math.PI/2.4;A.add(halo);

// ================= B: laurel + crescent moon + orbiting gems =================
const B=new THREE.Group();root.add(B);const gemPosB=[];
const leafS=new THREE.Shape();leafS.moveTo(0,0);leafS.quadraticCurveTo(.06,.09,0,.2);leafS.quadraticCurveTo(-.06,.09,0,0);
const leafG=new THREE.ExtrudeGeometry(leafS,{depth:.01,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:2,curveSegments:10});
[-1,1].forEach(side=>{for(let d=-84;d<=58;d+=11){const a=(side>0?d:180-d)*Math.PI/180;const base=new THREE.Vector3(Math.cos(a)*1.27,Math.sin(a)*1.27,.02);
  [-1,1].forEach(io=>{const l=new THREE.Mesh(leafG,io>0?gold:gold2);l.position.copy(base);
    const tangent=a+side*Math.PI/2;l.rotation.z=tangent-Math.PI/2+io*.55*side;l.rotation.y=io*.25;l.scale.setScalar(1-Math.abs(d)/400);B.add(l)});
  if((d+84)%22===0){const b=new THREE.Mesh(new THREE.SphereGeometry(.028,12,10),gem);b.position.copy(base).multiplyScalar(1.06);b.position.z=.05;B.add(b)}}});
const moonS=new THREE.Shape();
{const N=40;for(let i=0;i<=N;i++){const a=Math.PI*.16+(Math.PI*1.68)*i/N;const x=Math.cos(a)*.3,y=Math.sin(a)*.3;i?moonS.lineTo(x,y):moonS.moveTo(x,y)}
 for(let i=N;i>=0;i--){const a=Math.PI*.3+(Math.PI*1.4)*i/N;moonS.lineTo(.1+Math.cos(a)*.22,Math.sin(a)*.22)}moonS.closePath()}
const moon=new THREE.Mesh(new THREE.ExtrudeGeometry(moonS,{depth:.06,bevelEnabled:true,bevelThickness:.025,bevelSize:.02,bevelSegments:5}),gold);moon.geometry.center();
moon.rotation.z=Math.PI/2+.3;moon.position.set(0,1.28,.04);B.add(moon);
function starShape(r1,r2,n){const s=new THREE.Shape();for(let i=0;i<n*2;i++){const r=i%2?r2:r1,a=i/(n*2)*Math.PI*2+Math.PI/2;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r)}s.closePath();return s}
const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(.14,.06,5),{depth:.04,bevelEnabled:true,bevelThickness:.02,bevelSize:.015,bevelSegments:3}),gem);star.geometry.center();
star.position.set(.1,1.3,.12);B.add(star);
[[-.32,1.5,.06,.05],[.36,1.52,.06,.04],[-.18,1.62,.05,.03]].forEach(([x,y,z,r])=>{const s=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(r,r*.4,4),{depth:.01,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:2}),gold);s.geometry.center();s.position.set(x,y,z);B.add(s);gemPosB.push(s.position.clone())});
[25,155,205,335].forEach(d=>gemPosB.push(ringGem(d,B)));
const orbit=new THREE.Group();orbit.rotation.x=1.15;orbit.rotation.y=.2;B.add(orbit);const orbs=[];
for(let i=0;i<6;i++){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(.06,0),gem);orbit.add(o);orbs.push(o)}
orbit.add(new THREE.Mesh(new THREE.TorusGeometry(1.42,.004,8,200),glowMat));

// ================= C: white & gold angel wings + glowing star =================
const C=new THREE.Group();root.add(C);const gemPosC=[];
const pearl=new THREE.MeshPhysicalMaterial({color:0xfbf8f2,metalness:0,roughness:.35,clearcoat:.8,clearcoatRoughness:.2,sheen:1,sheenColor:new THREE.Color(0xfff3d6),envMapIntensity:1.1,side:THREE.DoubleSide});
[-1,1].forEach(side=>{
  const pivot=new THREE.Group();pivot.position.set(side*.9,.12,-.08);
  const wing=new THREE.Group();wing.scale.x=side;pivot.add(wing);
  const rows=[{n:9,L0:.7,L1:1.18,a0:8,a1:118,w:.12,z:0,off:[0,0]},{n:8,L0:.48,L1:.8,a0:14,a1:110,w:.1,z:.035,off:[.04,-.02]},{n:7,L0:.3,L1:.48,a0:18,a1:104,w:.08,z:.07,off:[.07,-.03]},{n:5,L0:.16,L1:.24,a0:24,a1:96,w:.06,z:.1,off:[.1,-.03]}];
  rows.forEach((r,ri)=>{for(let i=0;i<r.n;i++){const u=i/(r.n-1),L=r.L0+(r.L1-r.L0)*Math.sin(u*Math.PI*.85+.25),ang=(r.a0+(r.a1-r.a0)*u)*Math.PI/180;
    const g=new THREE.Group();g.position.set(r.off[0],r.off[1],r.z);g.rotation.z=-ang;g.rotation.y=.18;
    const trim=new THREE.Mesh(featherGeo(L*1.04,r.w*1.18),ri===3?gem:gold);trim.position.z=-.012;g.add(trim);
    if(ri<3)g.add(new THREE.Mesh(featherGeo(L,r.w),pearl));
    wing.add(g)}});
  [0,1,2].forEach(k=>{const s=new THREE.Mesh(new THREE.OctahedronGeometry(.04,0),gem);s.scale.set(1,1.3,.7);s.position.set(.12+k*.08,.06+k*.05,.15);wing.add(s)});
  C.add(pivot);wings.push({pivot,side});
});
const starC=new THREE.Group();
const st8=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(.3,.12,8),{depth:.05,bevelEnabled:true,bevelThickness:.03,bevelSize:.02,bevelSegments:4}),gold);st8.geometry.center();starC.add(st8);
const st4=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(.22,.07,4),{depth:.05,bevelEnabled:true,bevelThickness:.03,bevelSize:.015,bevelSegments:4}),gem);st4.geometry.center();st4.position.z=.05;starC.add(st4);
const core=new THREE.Mesh(new THREE.SphereGeometry(.06,24,16),glowMat);core.position.z=.11;starC.add(core);
const rayGeo=new THREE.PlaneGeometry(.02,.9);
const rays=new THREE.Group();for(let i=0;i<12;i++){const r=new THREE.Mesh(rayGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  r.rotation.z=i/12*Math.PI*2;rays.add(r)}rays.position.z=-.02;starC.add(rays);
starC.position.set(0,1.32,.06);C.add(starC);
[30,150,210,240,270,300,330].forEach(d=>gemPosC.push(ringGem(d,C)));

// ================= D: crystal lotus + vines + butterfly =================
const D=new THREE.Group();root.add(D);const gemPosD=[];
const crystal=new THREE.MeshPhysicalMaterial({color:0x9b4dff,metalness:0,roughness:.08,transmission:.55,thickness:.3,ior:1.6,emissive:0x5a1aa8,emissiveIntensity:.5,clearcoat:1,envMapIntensity:2,side:THREE.DoubleSide});
[-1,1].forEach(side=>{const pts=[];for(let i=0;i<=80;i++){const s=i/80,deg=-95+s*165,a=(side>0?deg:180-deg)*Math.PI/180,r=1.24+Math.sin(s*Math.PI*6)*.05;
  pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,Math.sin(s*Math.PI*6+1)*.06+.02))}
  const cv=new THREE.CatmullRomCurve3(pts);D.add(new THREE.Mesh(new THREE.TubeGeometry(cv,200,.014,8,false),gold));
  for(let k=1;k<12;k++){const u=k/12,p=cv.getPointAt(u),tg=cv.getTangentAt(u);const l=new THREE.Mesh(leafG,k%2?gold:gold2);l.position.copy(p);
    l.rotation.z=Math.atan2(tg.y,tg.x)+(k%2?.9:-.9)*side;l.scale.setScalar(.8);D.add(l)}});
const petalS=new THREE.Shape();petalS.moveTo(0,0);petalS.quadraticCurveTo(.09,.1,0,.26);petalS.quadraticCurveTo(-.09,.1,0,0);
const petalG=new THREE.ExtrudeGeometry(petalS,{depth:.008,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:2,curveSegments:12});
const lotuses=[];
function lotus(deg,r,sc){const a=deg*Math.PI/180,g=new THREE.Group();
  [[8,1.05,0],[6,.75,.35]].forEach(([n,len,off],li)=>{for(let i=0;i<n;i++){const holder=new THREE.Group();holder.rotation.z=i/n*Math.PI*2+off;
    const p=new THREE.Mesh(petalG,crystal);p.scale.setScalar(len);p.rotation.x=li?-.45:-.95;holder.add(p);
    const tr=new THREE.Mesh(petalG,gold);tr.scale.setScalar(len*1.05);tr.rotation.x=(li?-.45:-.95);tr.position.z=-.01;if(!li)holder.add(tr);g.add(holder)}});
  const c=new THREE.Mesh(new THREE.SphereGeometry(.05,20,14),gold);c.position.z=.03;g.add(c);
  for(let i=0;i<10;i++){const st=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),glowMat);const b=i/10*Math.PI*2;st.position.set(Math.cos(b)*.06,Math.sin(b)*.06,.07);g.add(st)}
  g.position.set(Math.cos(a)*r,Math.sin(a)*r,.12);g.scale.setScalar(sc);g.rotation.x=.15;D.add(g);lotuses.push(g);gemPosD.push(g.position.clone())}
lotus(140,1.25,1.1);lotus(40,1.25,1.1);lotus(205,1.26,.85);lotus(335,1.26,.85);lotus(250,1.22,.6);lotus(290,1.22,.6);
const bf=new THREE.Group();
const upW=new THREE.Shape();upW.moveTo(0,0);upW.bezierCurveTo(.12,.3,.42,.38,.44,.18);upW.bezierCurveTo(.46,.02,.25,-.04,0,0);
const loW=new THREE.Shape();loW.moveTo(0,0);loW.bezierCurveTo(.25,-.02,.34,-.2,.24,-.3);loW.bezierCurveTo(.14,-.36,.04,-.2,0,0);
const ex={depth:.01,bevelEnabled:true,bevelThickness:.01,bevelSize:.008,bevelSegments:2,curveSegments:20};
const bWings=[];
[-1,1].forEach(side=>{const w=new THREE.Group();w.scale.x=side;
  [upW,loW].forEach(s=>{w.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s,ex),crystal));
    const tr=new THREE.Mesh(new THREE.ExtrudeGeometry(s,ex),gold);tr.scale.setScalar(1.06);tr.position.z=-.012;w.add(tr)});
  [[.26,.18,.035],[.16,-.16,.025]].forEach(([x,y,r])=>{const s=new THREE.Mesh(new THREE.OctahedronGeometry(r,0),gem);s.position.set(x,y,.03);w.add(s)});
  bf.add(w);bWings.push({w,side})});
{const body=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.3,6,14),gold);body.position.z=.03;bf.add(body);}
{const headB=new THREE.Mesh(new THREE.SphereGeometry(.045,18,12),gold);headB.position.set(0,.2,.03);bf.add(headB);}
[-1,1].forEach(sx=>{const ac=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.22,.03),new THREE.Vector3(sx*.06,.34,.03),new THREE.Vector3(sx*.13,.4,.03)]);
  bf.add(new THREE.Mesh(new THREE.TubeGeometry(ac,20,.007,6,false),gold));const tip=new THREE.Mesh(new THREE.SphereGeometry(.018,10,8),gem);tip.position.set(sx*.13,.4,.03);bf.add(tip)});
bf.position.set(0,1.3,.08);bf.scale.setScalar(1.1);D.add(bf);gemPosD.push(new THREE.Vector3(0,1.3,.2));
[60,120,225,315].forEach(d=>gemPosD.push(ringGem(d,D)));

// ================= E: roaring lion + flames =================
const E=new THREE.Group();root.add(E);const gemPosE=[];
function flameTex(){const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');
  x.beginPath();x.moveTo(32,4);x.bezierCurveTo(52,40,60,80,48,104);x.quadraticCurveTo(32,128,16,104);x.bezierCurveTo(4,80,12,40,32,4);x.closePath();
  const g=x.createLinearGradient(0,128,0,0);g.addColorStop(0,'rgba(255,255,230,1)');g.addColorStop(.35,'rgba(255,230,150,.95)');g.addColorStop(.7,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.filter='blur(3px)';x.fill();return new THREE.CanvasTexture(c)}
const fireMat=new THREE.SpriteMaterial({map:flameTex(),color:0xff8a20,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false});
const flames=[];
for(let i=0;i<46;i++){const a=i/46*Math.PI*2;if(Math.abs(a-Math.PI/2)<.45)continue;
  const s=new THREE.Sprite(fireMat.clone());const r=1.27+(i%2)*.05;s.position.set(Math.cos(a)*r,Math.sin(a)*r,-.02);s.material.rotation=a-Math.PI/2;
  s.userData={a,base:i%2?.22:.32,ph:Math.random()*6};E.add(s);flames.push(s)}
const lion=new THREE.Group();
const ivory=new THREE.MeshPhysicalMaterial({color:0xfff6e0,roughness:.3,clearcoat:1});
const darkM=new THREE.MeshPhysicalMaterial({color:0x2a0a04,roughness:.5});
const maneG=new THREE.ConeGeometry(.06,.28,6);maneG.translate(0,.14,0);
const mane=new THREE.Group();
[[18,.2,1],[14,.16,.8]].forEach(([n,r,sc],li)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2+li*.2;const m=new THREE.Mesh(maneG,li?gold:gold2);
  m.position.set(Math.cos(a)*r,Math.sin(a)*r,-.05-li*.02);m.rotation.z=a-Math.PI/2;m.rotation.x=li?.3:.5;m.scale.setScalar(sc*(i%2?.85:1.1));mane.add(m)}});
lion.add(mane);
const maneFire=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const s=new THREE.Sprite(fireMat.clone());s.position.set(Math.cos(a)*.36,Math.sin(a)*.36,-.12);s.material.rotation=a-Math.PI/2;
  s.userData={ph:Math.random()*6};lion.add(s);maneFire.push(s)}
{const face=new THREE.Mesh(new THREE.SphereGeometry(.2,40,30),gold);face.scale.set(1,1.08,.8);lion.add(face);}
[-1,1].forEach(sx=>{const ear=new THREE.Mesh(new THREE.SphereGeometry(.055,20,14),gold);ear.scale.set(1,1,.5);ear.position.set(sx*.15,.17,-.02);lion.add(ear);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,16,12),glowMat);eye.scale.set(1.4,.7,.6);eye.position.set(sx*.075,.05,.15);eye.rotation.z=sx*-.3;lion.add(eye);
  const brow=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.07,4,8),gold2);brow.position.set(sx*.075,.095,.15);brow.rotation.z=sx*1.2;lion.add(brow);
  const muz=new THREE.Mesh(new THREE.SphereGeometry(.065,20,14),gold);muz.position.set(sx*.045,-.07,.13);muz.scale.set(1,.85,.8);lion.add(muz)});
{const nose=new THREE.Mesh(new THREE.SphereGeometry(.035,16,12),darkM);nose.scale.set(1.3,.8,.8);nose.position.set(0,-.02,.18);lion.add(nose);}
const mouth=new THREE.Mesh(new THREE.SphereGeometry(.07,20,14),darkM);mouth.position.set(0,-.14,.1);mouth.scale.set(1,.2,.6);lion.add(mouth);
[-1,1].forEach(sx=>{const f=new THREE.Mesh(new THREE.ConeGeometry(.012,.05,8),ivory);f.rotation.x=Math.PI;f.position.set(sx*.035,-.125,.16);lion.add(f)});
const ljaw=new THREE.Group();ljaw.position.set(0,-.13,.05);
{const jm=new THREE.Mesh(new THREE.SphereGeometry(.07,20,14),gold);jm.scale.set(1,.45,.9);jm.position.set(0,-.03,.06);ljaw.add(jm);}
[-1,1].forEach(sx=>{const f=new THREE.Mesh(new THREE.ConeGeometry(.01,.04,8),ivory);f.position.set(sx*.03,0,.12);ljaw.add(f)});
lion.add(ljaw);
{const tiara=new THREE.Mesh(new THREE.OctahedronGeometry(.045,0),gem);tiara.scale.set(1,1.3,.6);tiara.position.set(0,.2,.12);lion.add(tiara);gemPosE.push(new THREE.Vector3(0,1.55,.25));}
lion.position.set(0,1.33,.12);E.add(lion);
[25,60,120,155,205,240,300,335].forEach(d=>gemPosE.push(ringGem(d,E)));

// ================= F: silver eagles + ice crystals + snowflakes =================
const F=new THREE.Group();root.add(F);const gemPosF=[];
const ice=new THREE.MeshPhysicalMaterial({color:0xcfeeff,metalness:0,roughness:.05,transmission:.75,thickness:.4,ior:1.4,emissive:0x2a6a9a,emissiveIntensity:.35,clearcoat:1,envMapIntensity:2.2});
const eagles=[];
[-1,1].forEach(side=>{const eg=new THREE.Group();eg.position.set(side*1.17,.05,.06);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.26,8,16),gold2);body.rotation.z=side*.12;eg.add(body);
  const chest=new THREE.Mesh(new THREE.SphereGeometry(.085,20,14),gold);chest.scale.set(1,1.3,.8);chest.position.set(0,.05,.04);eg.add(chest);
  const head=new THREE.Group();head.position.set(-side*.02,.28,.04);
  const hs=new THREE.Mesh(new THREE.SphereGeometry(.065,24,16),gold);hs.scale.set(1,.95,1.1);head.add(hs);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(.026,.09,12),gold2);beak.rotation.z=side*Math.PI/2;beak.position.set(-side*.08,-.01,.02);head.add(beak);
  const hook=new THREE.Mesh(new THREE.SphereGeometry(.018,10,8),gold2);hook.position.set(-side*.115,-.025,.02);head.add(hook);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.014,12,10),glowMat);eye.position.set(-side*.035,.02,.055);head.add(eye);
  const brow=new THREE.Mesh(new THREE.CapsuleGeometry(.01,.05,4,8),gold2);brow.position.set(-side*.035,.042,.055);brow.rotation.z=side*-1.2;head.add(brow);
  eg.add(head);
  const wings2=[];
  [[1,9,.4,.9,-10,120,.1],[-1,6,.3,.6,-15,-75,0]].forEach(([dir,n,L0,L1,a0,a1,z])=>{const piv=new THREE.Group();piv.position.set(0,.14,z-.04);const w=new THREE.Group();w.scale.x=side;piv.add(w);
    for(let i=0;i<n;i++){const u=i/(n-1),L=L0+(L1-L0)*Math.sin(u*Math.PI*.85+.25),ang=(a0+(a1-a0)*u)*Math.PI/180;
      const f=new THREE.Mesh(featherGeo(L,.1),i%3===0?gold:gold2);f.rotation.z=-ang;f.rotation.y=.2;f.position.z=-u*.02;w.add(f)}
    eg.add(piv);wings2.push({piv,dir})});
  for(let i=0;i<5;i++){const f=new THREE.Mesh(featherGeo(.22,.06),gold2);f.rotation.z=Math.PI+(i-2)*.22;f.position.set(0,-.17,-.02);eg.add(f)}
  for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.012,.05,6),gold);c.position.set(-side*(.04+i*.018),-.16,.07);c.rotation.z=side*-2.2;eg.add(c)}
  F.add(eg);eagles.push({eg,head,wings2,side})});
function crystalCluster(x,y,s,rot){const g=new THREE.Group();g.position.set(x,y,.05);g.rotation.z=rot;g.scale.setScalar(s);
  [[0,.3,.05,0],[-.08,.22,.04,.35],[.09,.2,.035,-.4],[-.15,.14,.03,.7],[.15,.12,.028,-.75]].forEach(([dx,h,r,a])=>{
    const c=new THREE.Group();c.position.x=dx;c.rotation.z=a;
    const prism=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,6),ice);prism.position.y=h/2;c.add(prism);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(r,r*2.2,6),ice);tip.position.y=h+r*1.1;c.add(tip);g.add(c)});
  F.add(g);gemPosF.push(new THREE.Vector3(x,y+.25*s,.1));return g}
crystalCluster(-.62,-1.02,1,.55);crystalCluster(.62,-1.02,1,-.55);crystalCluster(-.95,-.62,.7,.95);crystalCluster(.95,-.62,.7,-.95);
function snowflake(r,mat){const g=new THREE.Group();for(let i=0;i<6;i++){const arm=new THREE.Group();arm.rotation.z=i/6*Math.PI*2;
    const b=new THREE.Mesh(new THREE.BoxGeometry(r*.12,r,r*.08),mat);b.position.y=r/2;arm.add(b);
    [.45,.7].forEach(p=>[-1,1].forEach(s=>{const br=new THREE.Mesh(new THREE.BoxGeometry(r*.08,r*.32,r*.06),mat);br.position.set(s*r*.1,r*p+r*.08,0);br.rotation.z=s*-.8;arm.add(br)}));
    g.add(arm)}
  return g}
const crestF=new THREE.Group();const bigFlake=snowflake(.3,gold);crestF.add(bigFlake);
const dia=new THREE.Mesh(new THREE.OctahedronGeometry(.08,0),ice);dia.scale.set(1,1.3,.7);dia.position.z=.05;crestF.add(dia);
crestF.position.set(0,1.32,.06);F.add(crestF);gemPosF.push(new THREE.Vector3(0,1.32,.2));
const flakes=[];
[[-.55,1.12,.09],[.55,1.12,.09],[-1.3,.78,.07],[1.3,.78,.07],[-1.42,-.35,.06],[1.42,-.35,.06],[0,-1.48,.07]].forEach(([x,y,r],i)=>{const f=snowflake(r,i%2?ice:gold);f.position.set(x,y,.1);f.userData.ph=i;F.add(f);flakes.push(f)});
[20,160,200,250,290,340].forEach(d=>gemPosF.push(ringGem(d,F)));
const SN=120,snGeo=new THREE.BufferGeometry(),snP=new Float32Array(SN*3);
for(let i=0;i<SN;i++){snP[i*3]=(Math.random()-.5)*3.4;snP[i*3+1]=(Math.random()-.5)*3.4;snP[i*3+2]=(Math.random()-.5)*.8}
snGeo.setAttribute('position',new THREE.BufferAttribute(snP,3));
F.add(new THREE.Points(snGeo,new THREE.PointsMaterial({size:.03,color:0xeaf6ff,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})));

// ================= G: roses + pearls + princess tiara =================
const G=new THREE.Group();root.add(G);const gemPosG=[];
const petalMat=new THREE.MeshPhysicalMaterial({color:0xff7aa8,roughness:.45,sheen:1,sheenColor:new THREE.Color(0xffd0e0),clearcoat:.3,side:THREE.DoubleSide,envMapIntensity:.9});
const pearlMat=new THREE.MeshPhysicalMaterial({color:0xfff8f4,roughness:.12,clearcoat:1,iridescence:1,iridescenceIOR:1.6,envMapIntensity:1.6});
const cupG=new THREE.SphereGeometry(.1,20,12,0,Math.PI*1.1,0,Math.PI/2);
function rose(deg,r,sc){const a=deg*Math.PI/180,g=new THREE.Group();
  const bud=new THREE.Mesh(new THREE.SphereGeometry(.05,16,12),petalMat);bud.scale.set(1,1,1.3);bud.position.z=.05;g.add(bud);
  [[3,.035,.3,.55],[5,.06,.6,.75],[7,.085,1.0,.95],[8,.11,1.35,1.1]].forEach(([n,rad,tilt,s],li)=>{for(let i=0;i<n;i++){const b=i/n*Math.PI*2+li*.5;
    const h=new THREE.Group();h.rotation.z=b;const p=new THREE.Mesh(cupG,petalMat);p.position.y=rad;p.rotation.x=-Math.PI/2+tilt*.6;p.scale.set(s,s*.9,s);h.add(p);g.add(h)}});
  [-1,1].forEach(sx=>{const l=new THREE.Mesh(leafG,gold);l.position.set(sx*.1,-.08,-.03);l.rotation.z=sx*-2.2;l.scale.setScalar(1.1);g.add(l)});
  g.position.set(Math.cos(a)*r,Math.sin(a)*r,.12);g.scale.setScalar(sc);G.add(g);gemPosG.push(g.position.clone());return g}
const roses=[rose(140,1.2,1.15),rose(40,1.2,1.15),rose(205,1.22,.9),rose(335,1.22,.9),rose(250,1.2,.65),rose(290,1.2,.65),rose(168,1.25,.6),rose(12,1.25,.6)];
[-1,1].forEach(side=>{for(let d=-80;d<=60;d+=14){const a=(side>0?d:180-d)*Math.PI/180;const l=new THREE.Mesh(leafG,d%28?gold2:gold);
  l.position.set(Math.cos(a)*1.3,Math.sin(a)*1.3,0);l.rotation.z=a-Math.PI/2+side*.9;G.add(l)}});
{const pearls=new THREE.InstancedMesh(new THREE.SphereGeometry(.03,18,14),pearlMat,64);
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2;M4.makeTranslation(Math.cos(a)*1.075,Math.sin(a)*1.075,.08);pearls.setMatrixAt(i,M4)}G.add(pearls);}
const tiaraG=new THREE.Group();
{const arc=new THREE.CatmullRomCurve3(Array.from({length:21},(_,i)=>{const u=i/20*Math.PI;return new THREE.Vector3(Math.cos(u)*.38,Math.sin(u)*.07,Math.sin(u)*.08)}));
 tiaraG.add(new THREE.Mesh(new THREE.TubeGeometry(arc,60,.018,10,false),gold));
 const tg=new THREE.Group();
 [-3,-2,-1,0,1,2,3].forEach(k=>{const x=k*.11,h=k===0?.34:.3-Math.abs(k)*.06;
   const sp=new THREE.Mesh(new THREE.ConeGeometry(.018,h,8),gold);sp.position.set(x,h/2+.02,.06);tg.add(sp);
   const loop=new THREE.Mesh(new THREE.TorusGeometry(.045,.008,8,24),gold2);loop.position.set(x+.055,.07,.06);if(k<3)tg.add(loop);
   const d=new THREE.Mesh(new THREE.OctahedronGeometry(k===0?.055:.028,0),gem);d.scale.set(1,1.4,.7);d.position.set(x,h+.04,.07);tg.add(d);
   const p=new THREE.Mesh(new THREE.SphereGeometry(.018,14,10),pearlMat);p.position.set(x,.03,.08);tg.add(p)});
 tiaraG.add(tg);}
const drop=new THREE.Mesh(new THREE.SphereGeometry(.06,24,16),gem);drop.scale.set(.8,1.25,.6);drop.position.set(0,.14,.1);tiaraG.add(drop);
tiaraG.position.set(0,1.18,.08);tiaraG.scale.setScalar(1.15);G.add(tiaraG);gemPosG.push(new THREE.Vector3(0,1.6,.2),new THREE.Vector3(0,1.36,.2));
[70,110,230,310].forEach(d=>gemPosG.push(ringGem(d,G)));
const fPet=[];for(let i=0;i<26;i++){const p=new THREE.Mesh(cupG,petalMat);p.scale.setScalar(.35);p.userData={x:(Math.random()-.5)*3,y:Math.random()*3-1.5,s:.15+Math.random()*.2,ph:Math.random()*6};G.add(p);fPet.push(p)}

// ================= H: black panthers + golden thorns + black diamond =================
const H=new THREE.Group();root.add(H);const gemPosH=[];
const onyxM=new THREE.MeshPhysicalMaterial({color:0x0c0c10,metalness:.35,roughness:.22,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.4});
const panthers=[];
[-1,1].forEach(side=>{const pg=new THREE.Group();pg.position.set(side*1.12,.08,.1);pg.scale.x=side;
  const bodyP=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.38,8,18),onyxM);bodyP.position.set(.13,-.02,-.03);bodyP.rotation.z=.55;pg.add(bodyP);
  const chestP=new THREE.Mesh(new THREE.SphereGeometry(.115,24,18),onyxM);chestP.position.set(.01,.17,.03);chestP.scale.set(1,1.1,.95);pg.add(chestP);
  const hip=new THREE.Mesh(new THREE.SphereGeometry(.11,22,16),onyxM);hip.position.set(.24,-.2,-.02);pg.add(hip);
  const headP=new THREE.Group();headP.position.set(-.05,.37,.09);
  const hsP=new THREE.Mesh(new THREE.SphereGeometry(.095,28,20),onyxM);hsP.scale.set(1,.88,1.05);headP.add(hsP);
  [-1,1].forEach(ex2=>{const ear=new THREE.Mesh(new THREE.ConeGeometry(.032,.07,10),onyxM);ear.position.set(ex2*.06,.08,-.01);ear.rotation.z=ex2*-.35;headP.add(ear);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.017,14,10),glowMat);eye.scale.set(1.5,.75,.6);eye.position.set(ex2*.042,.018,.083);eye.rotation.z=ex2*.35;headP.add(eye)});
  const muzP=new THREE.Mesh(new THREE.SphereGeometry(.052,20,14),onyxM);muzP.position.set(0,-.035,.075);muzP.scale.set(1.1,.8,.9);headP.add(muzP);
  const noseP=new THREE.Mesh(new THREE.SphereGeometry(.016,12,8),gold);noseP.position.set(0,-.012,.125);headP.add(noseP);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.085,.012,10,40),gold);collar.position.set(0,-.09,-.01);collar.rotation.x=Math.PI/2.3;headP.add(collar);
  const pend=new THREE.Mesh(new THREE.OctahedronGeometry(.025,0),gem);pend.position.set(0,-.12,.08);headP.add(pend);
  pg.add(headP);
  [[-.07,-.03,.08,.15],[.07,-.05,.1,-.1]].forEach(([x,y,z,r])=>{const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.033,.2,6,10),onyxM);leg.position.set(x,y,z);leg.rotation.z=r;pg.add(leg);
    for(let k=0;k<3;k++){const cl=new THREE.Mesh(new THREE.ConeGeometry(.007,.03,6),gold);cl.position.set(x-.018+k*.018,y-.13,z+.02);cl.rotation.x=Math.PI;pg.add(cl)}});
  const tc=new THREE.CatmullRomCurve3([new THREE.Vector3(.3,-.25,-.06),new THREE.Vector3(.46,-.12,-.06),new THREE.Vector3(.48,.12,-.04),new THREE.Vector3(.38,.28,0)]);
  const tailG=new THREE.Group();tailG.add(new THREE.Mesh(new THREE.TubeGeometry(tc,40,.026,10,false),onyxM));const tip=new THREE.Mesh(new THREE.SphereGeometry(.026,10,8),gold);tip.position.copy(tc.getPointAt(1));tailG.add(tip);pg.add(tailG);
  H.add(pg);panthers.push({pg,headP,tailG,side});gemPosH.push(new THREE.Vector3(side*1.08,.45,.25))});
[-1,1].forEach(side=>{const pts=[];for(let i=0;i<=60;i++){const s=i/60,deg=-100+s*178,a=(side>0?deg:180-deg)*Math.PI/180,r=1.25+Math.sin(s*Math.PI*8)*.04;
  pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,Math.cos(s*Math.PI*8)*.05))}
  const cv=new THREE.CatmullRomCurve3(pts);H.add(new THREE.Mesh(new THREE.TubeGeometry(cv,160,.016,8,false),gold));
  const thG=new THREE.ConeGeometry(.012,.07,6);thG.translate(0,.035,0);const th=new THREE.InstancedMesh(thG,gold,40);
  const up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),S=new THREE.Vector3(1,1,1),c=new THREE.Vector3();
  for(let k=0;k<40;k++){const u=(k+.5)/40;cv.getPointAt(u,c);const tg2=cv.getTangentAt(u);const out=new THREE.Vector3(c.x,c.y,0).normalize();
    const dir=out.clone().multiplyScalar(k%2?1:-1).add(new THREE.Vector3(0,0,k%3?.6:-.4)).add(tg2.clone().multiplyScalar(.5)).normalize();
    q.setFromUnitVectors(up,dir);S.setScalar(.7+(k%3)*.25);M4.compose(c,q,S);th.setMatrixAt(k,M4)}
  H.add(th)});
const crestH=new THREE.Group();
const back8=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(.32,.16,8),{depth:.04,bevelEnabled:true,bevelThickness:.02,bevelSize:.015,bevelSegments:3}),gold);back8.geometry.center();crestH.add(back8);
const bd=new THREE.Mesh(new THREE.OctahedronGeometry(.17,0),gem);bd.scale.set(1,1.25,.6);bd.position.z=.07;crestH.add(bd);
{const bdRing=new THREE.Mesh(new THREE.TorusGeometry(.175,.02,12,48),gold);bdRing.position.z=.05;crestH.add(bdRing);}
[-1,1].forEach(sx=>{const s=new THREE.Mesh(new THREE.OctahedronGeometry(.055,0),gem);s.scale.set(1,1.3,.6);s.position.set(sx*.3,-.05,.06);crestH.add(s);
  const sp=new THREE.Mesh(new THREE.ConeGeometry(.025,.22,6),gold);sp.position.set(sx*.18,.24,0);sp.rotation.z=sx*-.5;crestH.add(sp)});
{const top=new THREE.Mesh(new THREE.ConeGeometry(.03,.3,6),gold);top.position.set(0,.33,0);crestH.add(top);}
crestH.position.set(0,1.3,.08);H.add(crestH);gemPosH.push(new THREE.Vector3(0,1.35,.25),new THREE.Vector3(.3,1.25,.2),new THREE.Vector3(-.3,1.25,.2));
[35,145,215,250,290,325].forEach(d=>gemPosH.push(ringGem(d,H)));

// shared sprite textures
function starTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.15,'rgba(255,255,255,.7)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
  x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=3;x.beginPath();x.moveTo(64,4);x.lineTo(64,124);x.moveTo(4,64);x.lineTo(124,64);x.stroke();return new THREE.CanvasTexture(c)}
const sT=starTex();
function bubbleTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=5;x.beginPath();x.arc(32,32,24,0,7);x.stroke();
  x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(24,24,6,0,7);x.fill();return new THREE.CanvasTexture(c)}

// ================= I: ocean waves + pearls + golden moon =================
const I=new THREE.Group();root.add(I);const gemPosI=[];
const water=new THREE.MeshPhysicalMaterial({color:0x6fe6dc,metalness:0,roughness:.05,transmission:.7,thickness:.3,ior:1.33,emissive:0x0a5a55,emissiveIntensity:.45,clearcoat:1,envMapIntensity:2,side:THREE.DoubleSide});
const waveS=new THREE.Shape();
waveS.moveTo(-.16,0);waveS.quadraticCurveTo(-.1,.1,.02,.16);waveS.quadraticCurveTo(.14,.2,.18,.1);waveS.quadraticCurveTo(.2,.02,.12,.03);
waveS.quadraticCurveTo(.07,.05,.09,.1);waveS.quadraticCurveTo(.02,.08,.03,.02);waveS.quadraticCurveTo(.06,-.02,.16,0);waveS.closePath();
const waveG=new THREE.ExtrudeGeometry(waveS,{depth:.03,bevelEnabled:true,bevelThickness:.012,bevelSize:.01,bevelSegments:3,curveSegments:16});
const waves=[];
for(let d=-170;d<=-10;d+=16){[0,1].forEach(layer=>{const deg=d+layer*8,a=deg*Math.PI/180,r=1.23+layer*.07;
  const w=new THREE.Mesh(waveG,layer?gold:water);w.position.set(Math.cos(a)*r,Math.sin(a)*r,layer?-.02:.06);w.rotation.z=a+Math.PI/2;w.scale.setScalar(layer?.95:1.15);
  w.userData={a,r,ph:deg*.1};I.add(w);waves.push(w)})}
[-1,1].forEach(side=>{for(let d=0;d<=50;d+=17){const deg=side>0?d:180-d,a=deg*Math.PI/180;const w=new THREE.Mesh(waveG,d%34?gold:water);
  w.position.set(Math.cos(a)*1.24,Math.sin(a)*1.24,.03);w.rotation.z=a+Math.PI/2;w.scale.set(side*.8,.8,.8);w.userData={a,r:1.24,ph:deg*.1};I.add(w);waves.push(w)}});
[-150,-120,-90,-60,-30,10,170].forEach(deg=>{const a=deg*Math.PI/180;const p=new THREE.Mesh(new THREE.SphereGeometry(.045,22,16),pearlMat);p.position.set(Math.cos(a)*1.33,Math.sin(a)*1.33,.1);I.add(p);gemPosI.push(p.position.clone())});
{const smallP=new THREE.InstancedMesh(new THREE.SphereGeometry(.022,14,10),pearlMat,48);
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2;M4.makeTranslation(Math.cos(a)*1.075,Math.sin(a)*1.075,.08);smallP.setMatrixAt(i,M4)}I.add(smallP);}
const moonI=new THREE.Mesh(new THREE.ExtrudeGeometry(moonS,{depth:.07,bevelEnabled:true,bevelThickness:.03,bevelSize:.025,bevelSegments:5}),gold);moonI.geometry.center();
moonI.rotation.z=Math.PI/2+.25;moonI.scale.setScalar(1.25);moonI.position.set(0,1.32,.05);I.add(moonI);
const moonGem=new THREE.Mesh(new THREE.OctahedronGeometry(.06,0),gem);moonGem.scale.set(1,1.3,.6);moonGem.position.set(-.16,1.26,.12);I.add(moonGem);
const starsI=[];
[[.16,1.36,.09,.11],[-.34,1.55,.05,.06],[.38,1.56,.05,.05],[.05,1.68,.04,.045],[-.5,1.3,.04,.04],[.52,1.32,.04,.04]].forEach(([x,y,z,r],i)=>{
  const s=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(r,r*.42,5),{depth:.02,bevelEnabled:true,bevelThickness:.012,bevelSize:.008,bevelSegments:2}),i?gold:gem);s.geometry.center();
  s.position.set(x,y,z);I.add(s);starsI.push(s);gemPosI.push(s.position.clone())});
[40,140,200,340].forEach(d=>gemPosI.push(ringGem(d,I)));
const BN=60,bGeo=new THREE.BufferGeometry(),bP=new Float32Array(BN*3);
for(let i=0;i<BN;i++){const a=-Math.PI*(.1+Math.random()*.8);bP[i*3]=Math.cos(a)*(1.25+Math.random()*.2);bP[i*3+1]=Math.sin(a)*(1.25+Math.random()*.2);bP[i*3+2]=.1+Math.random()*.3}
bGeo.setAttribute('position',new THREE.BufferAttribute(bP,3));
I.add(new THREE.Points(bGeo,new THREE.PointsMaterial({size:.035,map:bubbleTex(),color:0xc8fff8,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})));

// ================= J: emperor — huge crown, phoenix + dragon, lightning, cosmic aura =================
const J=new THREE.Group();root.add(J);const gemPosJ=[];
const fixedGem=c=>new THREE.MeshPhysicalMaterial({color:c,metalness:0,roughness:.03,clearcoat:1,ior:2.2,emissive:c,emissiveIntensity:.12,envMapIntensity:2.4,flatShading:true});
const RUBY=fixedGem(0xd0103a),SAPH=fixedGem(0x1f5bff),EMER=fixedGem(0x0c9a52),DIAM=fixedGem(0xe8f4ff);
const MIX=[RUBY,SAPH,EMER,DIAM];
function auraTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const g=x.createRadialGradient(128,128,40,128,128,128);
  g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(.7,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)}
const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:auraTex(),color:0x8a3cff,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
aura.scale.setScalar(3.6);aura.position.z=-.3;J.add(aura);
const CS=220,csGeo=new THREE.BufferGeometry(),csP=new Float32Array(CS*3),csA=[];
for(let i=0;i<CS;i++){const a=Math.random()*Math.PI*2,r=1.3+Math.random()*.5;csA.push([a,r,.1+Math.random()*.3]);csP[i*3+2]=(Math.random()-.5)*.6}
csGeo.setAttribute('position',new THREE.BufferAttribute(csP,3));
const cosmic=new THREE.Points(csGeo,new THREE.PointsMaterial({size:.022,map:sT,color:0xd8b8ff,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));J.add(cosmic);
const ecrown=new THREE.Group();
ecrown.add(new THREE.Mesh(new THREE.CylinderGeometry(.36,.31,.16,64,1,true),gold2));
{const eb2=new THREE.Mesh(new THREE.TorusGeometry(.335,.025,12,64),gold);eb2.rotation.x=Math.PI/2;eb2.position.y=-.08;ecrown.add(eb2);
 const eb3=eb2.clone();eb3.position.y=.08;eb3.scale.setScalar(1.07);ecrown.add(eb3);}
{const cap=new THREE.Mesh(new THREE.SphereGeometry(.3,32,16,0,Math.PI*2,0,Math.PI/2),gemDark);cap.position.y=.05;cap.scale.y=.85;ecrown.add(cap);}
for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const big=i%2===0;
  const sp=new THREE.Mesh(new THREE.ConeGeometry(big?.05:.035,big?.28:.18,4),gold);sp.position.set(Math.cos(a)*.34,big?.22:.17,Math.sin(a)*.34);ecrown.add(sp);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(big?.035:.025,14,10),big?DIAM:gold);ball.position.set(Math.cos(a)*.34,big?.38:.28,Math.sin(a)*.34);ecrown.add(ball);
  const g=new THREE.Mesh(new THREE.OctahedronGeometry(.04,0),MIX[i%4]);g.scale.set(1,1.3,.6);g.position.set(Math.cos(a+.39)*.35,0,Math.sin(a+.39)*.35);g.lookAt(0,0,0);ecrown.add(g)}
[0,Math.PI/2].forEach(r=>{const arch=new THREE.Mesh(new THREE.TorusGeometry(.3,.022,12,48,Math.PI),gold);arch.rotation.y=r;arch.position.y=.06;arch.scale.y=1.15;ecrown.add(arch)});
const orb=new THREE.Mesh(new THREE.SphereGeometry(.07,24,16),gem);orb.position.y=.45;ecrown.add(orb);
{const orbBand=new THREE.Mesh(new THREE.TorusGeometry(.072,.01,8,32),gold);orbBand.position.y=.45;orbBand.rotation.x=Math.PI/2;ecrown.add(orbBand);
 const cr1=new THREE.Mesh(new THREE.BoxGeometry(.03,.16,.03),gold);cr1.position.y=.58;ecrown.add(cr1);
 const cr2=new THREE.Mesh(new THREE.BoxGeometry(.11,.03,.03),gold);cr2.position.y=.6;ecrown.add(cr2);}
ecrown.position.set(0,1.2,0);ecrown.rotation.x=.22;ecrown.scale.setScalar(1.05);J.add(ecrown);gemPosJ.push(new THREE.Vector3(0,1.68,.1),new THREE.Vector3(0,1.85,.1));
const phx=new THREE.Group();phx.position.set(-1.16,.1,.08);phx.scale.x=-1;
const phWings=[];
[[9,.45,1.0,-5,118,0],[6,.3,.6,-12,-70,-.04]].forEach(([n,L0,L1,a0,a1,z])=>{const piv=new THREE.Group();piv.position.set(0,.14,z);
  for(let i=0;i<n;i++){const u=i/(n-1),L=L0+(L1-L0)*Math.sin(u*Math.PI*.85+.25),ang=(a0+(a1-a0)*u)*Math.PI/180;
    const f=new THREE.Mesh(featherGeo(L,.1),i%2?RUBY:gold);f.rotation.z=-ang;f.rotation.y=.2;f.position.z=-u*.02;piv.add(f)}
  phx.add(piv);phWings.push(piv)});
phx.add(new THREE.Mesh(new THREE.CapsuleGeometry(.07,.24,8,14),gold));
const phH=new THREE.Group();phH.position.set(-.02,.27,.04);
phH.add(new THREE.Mesh(new THREE.SphereGeometry(.06,20,14),gold));
{const phBeak=new THREE.Mesh(new THREE.ConeGeometry(.022,.08,10),gold2);phBeak.rotation.z=Math.PI/2;phBeak.position.set(-.075,-.01,.02);phH.add(phBeak);
 const phEye=new THREE.Mesh(new THREE.SphereGeometry(.013,10,8),glowMat);phEye.position.set(-.03,.02,.05);phH.add(phEye);}
for(let k=0;k<4;k++){const f=new THREE.Mesh(featherGeo(.14-k*.02,.03),k%2?RUBY:gold);f.position.set(.02,.04,0);f.rotation.z=-.6+k*.35;phH.add(f)}
phx.add(phH);
for(let i=0;i<5;i++){const f=new THREE.Mesh(featherGeo(.32,.05),i%2?RUBY:gold);f.rotation.z=Math.PI+(i-2)*.2;f.position.set(0,-.16,-.02);phx.add(f)}
const phFire=[];for(let i=0;i<10;i++){const s=new THREE.Sprite(fireMat.clone());s.material.color.set(0xff7a20);s.position.set((Math.random()-.3)*.5,Math.random()*.8-.1,-.08);s.userData.ph=Math.random()*6;phx.add(s);phFire.push(s)}
J.add(phx);gemPosJ.push(new THREE.Vector3(-1.16,.4,.2));
const drJ=new THREE.Group();
{const pts=[];for(let i=0;i<=120;i++){const s=i/120,phi=-1.55+s*2.55,th=s*Math.PI*2*2;const n=new THREE.Vector3(Math.cos(phi),Math.sin(phi),0);
  const p=n.clone().multiplyScalar(1.22+Math.cos(th)*.1);p.z=Math.sin(th)*.14+sstep(.85,1,s)*.15;pts.push(p)}
 const cv=new THREE.CatmullRomCurve3(pts),TS=240,RS=12,geo=new THREE.TubeGeometry(cv,TS,.06,RS,false),pos=geo.attributes.position,c=new THREE.Vector3(),v=new THREE.Vector3();
 for(let i=0;i<=TS;i++){const u=i/TS;cv.getPointAt(u,c);const f=(.15+.85*sstep(0,.4,u))*(1+.3*sstep(.85,1,u));for(let j=0;j<=RS;j++){const k=i*(RS+1)+j;v.fromBufferAttribute(pos,k).sub(c).multiplyScalar(f).add(c);pos.setXYZ(k,v.x,v.y,v.z)}}
 geo.computeVertexNormals();drJ.add(new THREE.Mesh(geo,gold2));
 const spG=new THREE.ConeGeometry(.018,.07,5);spG.translate(0,.035,0);const sp=new THREE.InstancedMesh(spG,EMER,30),up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),S=new THREE.Vector3();
 for(let k=0;k<30;k++){const u=.1+k*.027;cv.getPointAt(u,c);const out=new THREE.Vector3(c.x,c.y,0).normalize().add(new THREE.Vector3(0,0,.5)).normalize();
   q.setFromUnitVectors(up,out);S.setScalar(.6+.8*sstep(0,.4,u));M4.compose(c.clone().add(out.clone().multiplyScalar(.045)),q,S);sp.setMatrixAt(k,M4)}drJ.add(sp);
 const end=cv.getPointAt(1),tan=cv.getTangentAt(1),hd=new THREE.Group();hd.position.copy(end);hd.lookAt(end.clone().add(tan));
 const sk=new THREE.Mesh(new THREE.SphereGeometry(.085,24,16),gold);sk.scale.set(1,.85,1.2);hd.add(sk);
 const sn=new THREE.Mesh(new THREE.CylinderGeometry(.035,.065,.17,16),gold);sn.rotation.x=Math.PI/2;sn.position.set(0,0,.13);hd.add(sn);
 [-1,1].forEach(sx=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.018,12,10),glowMat);e.position.set(sx*.05,.04,.06);hd.add(e);
   const hg=new THREE.ConeGeometry(.02,.22,10);hg.translate(0,.11,0);const h=new THREE.Mesh(hg,gold);h.position.set(sx*.04,.06,-.04);h.rotation.set(-2.1,0,sx*-.45);hd.add(h)});
 drJ.add(hd);drJ.userData.head=hd;gemPosJ.push(end.clone())}
J.add(drJ);
[30,60,120,150,210,240,300,330].forEach((d,i)=>{const p=ringGem(d,J);const g=J.children[J.children.length-1];g.children[0].material=MIX[i%4];gemPosJ.push(p)});
const boltMat=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.6,3.2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
const bolts=[0,1,2].map(()=>{const m=new THREE.Mesh(new THREE.BufferGeometry(),boltMat.clone());J.add(m);return m});
let nextBolt=0;
function strike(m){const a=Math.random()*Math.PI*2,pts=[];let r=1.15;for(let i=0;i<8;i++){r+=.06+Math.random()*.06;const aa=a+(Math.random()-.5)*.25;pts.push(new THREE.Vector3(Math.cos(aa)*r,Math.sin(aa)*r,(Math.random()-.5)*.2))}
  m.geometry.dispose();m.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'catmullrom',.1),24,.008,5,false);m.material.opacity=1}

// ================= K: royal phoenixes (VIP 1) — also the wings-only version =================
const K=new THREE.Group();root.add(K);const gemPosK=[];const KX={phs:[],fires:[],bird:[],root:[]};
{
  const redF=new THREE.MeshPhysicalMaterial({color:0xc8102e,metalness:.6,roughness:.3,clearcoat:.6,emissive:0x5a0010,emissiveIntensity:.5,envMapIntensity:1.2,side:THREE.DoubleSide});
  KX.redF=redF;
  [-1,1].forEach(side=>{const ph=new THREE.Group();ph.position.set(side*1.08,.2,.1);ph.scale.x=side;
    const wingsK=[];
    [[10,.5,1.15,-8,122,0,true],[8,.38,.85,-4,112,.03,false],[6,.22,.45,0,100,.06,true]].forEach(([n,L0,L1,a0,a1,z,red])=>{const piv=new THREE.Group();piv.position.set(.02,.12,z);
      for(let i=0;i<n;i++){const u=i/(n-1),L=L0+(L1-L0)*Math.sin(u*Math.PI*.85+.25),ang=(a0+(a1-a0)*u)*Math.PI/180;
        const g=new THREE.Group();g.rotation.z=-ang;g.rotation.y=.2;g.position.z=-u*.02;
        const tr=new THREE.Mesh(featherGeo(L*1.04,.12),gold);tr.position.z=-.01;g.add(tr);
        if(red){const f=new THREE.Mesh(featherGeo(L*.82,.075),redF);f.position.set(0,L*.12,.004);g.add(f);
          const s=new THREE.Sprite(fireMat.clone());s.material.color.set(0xff5a20);s.position.set(0,L*.85,.03);s.userData={ph:Math.random()*6,L};g.add(s);KX.fires.push(s)}
        piv.add(g)}
      ph.add(piv);wingsK.push(piv)});
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.25,8,14),gold);body.rotation.z=.25;ph.add(body);
    const neck=new THREE.Mesh(new THREE.CapsuleGeometry(.04,.16,6,10),gold);neck.position.set(-.06,.22,.04);neck.rotation.z=.6;ph.add(neck);
    const head=new THREE.Group();head.position.set(-.13,.34,.06);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(.055,20,14),gold));
    const beak=new THREE.Mesh(new THREE.ConeGeometry(.02,.09,10),gold);beak.rotation.z=Math.PI/2+.25;beak.position.set(-.075,-.02,.01);head.add(beak);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.012,10,8),glowMat);eye.position.set(-.025,.015,.05);head.add(eye);
    for(let k=0;k<5;k++){const f=new THREE.Mesh(featherGeo(.16-k*.02,.03),k%2?redF:gold);f.position.set(.02,.03,-.01);f.rotation.z=-.3+k*.32;head.add(f)}
    ph.add(head);KX.bird.push(body,neck,head);
    for(let i=0;i<6;i++){const f=new THREE.Mesh(featherGeo(.38-i*.03,.05),i%2?redF:gold);f.rotation.z=Math.PI+(i-1.5)*.16;f.position.set(.02,-.18,-.02);ph.add(f);KX.bird.push(f)}
    const wr=new THREE.Group();wr.position.set(.02,.12,.12);wr.add(new THREE.Mesh(new THREE.TorusGeometry(.07,.018,12,32),gold));
    const wg=new THREE.Mesh(new THREE.OctahedronGeometry(.065,0),gem);wg.scale.set(.8,1.2,.55);wr.add(wg);ph.add(wr);KX.root.push(wr);
    K.add(ph);KX.phs.push({ph,wings:wingsK,head});gemPosK.push(new THREE.Vector3(side*1.21,.54,.2));
    const md=new THREE.Group();md.position.set(side*.95,-.72,.14);
    md.add(new THREE.Mesh(new THREE.TorusGeometry(.1,.025,14,40),gold));
    const rb2=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),gem);rb2.scale.set(.8,1.15,.55);md.add(rb2);
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2,d=new THREE.Mesh(new THREE.OctahedronGeometry(.016,0),pearlMat);d.position.set(Math.cos(a)*.1,Math.sin(a)*.1,.03);md.add(d)}
    K.add(md);gemPosK.push(md.position.clone())});
  const kc=new THREE.Group();
  kc.add(new THREE.Mesh(new THREE.CylinderGeometry(.3,.26,.14,56,1,true),gold2));
  const vel=new THREE.Mesh(new THREE.SphereGeometry(.27,32,16,0,Math.PI*2,0,Math.PI/2),gemDark);vel.position.y=.03;vel.scale.y=.9;kc.add(vel);
  const rim2=new THREE.Mesh(new THREE.TorusGeometry(.29,.022,12,56),gold);rim2.rotation.x=Math.PI/2;rim2.position.y=-.07;kc.add(rim2);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;
    const fl=new THREE.Group();fl.position.set(Math.cos(a)*.29,.12,Math.sin(a)*.29);fl.lookAt(0,.12,0);fl.rotateY(Math.PI);
    const c=new THREE.Mesh(new THREE.ConeGeometry(.035,.18,4),gold);c.position.y=.04;fl.add(c);
    [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.SphereGeometry(.03,12,8),gold);p.scale.set(1,1.5,.6);p.position.set(s*.045,0,0);p.rotation.z=s*.5;fl.add(p)});
    const g=new THREE.Mesh(new THREE.OctahedronGeometry(.032,0),i%2?pearlMat:gem);g.position.set(0,-.12,.02);fl.add(g);kc.add(fl)}
  const top=new THREE.Mesh(new THREE.OctahedronGeometry(.08,0),gem);top.scale.set(.8,1.3,.6);top.position.y=.34;kc.add(top);KX.top=top;
  const topRing=new THREE.Mesh(new THREE.TorusGeometry(.06,.012,10,32),gold);topRing.position.y=.34;kc.add(topRing);
  kc.position.set(0,1.22,0);kc.rotation.x=.2;kc.scale.setScalar(1.1);K.add(kc);KX.crown=kc;gemPosK.push(new THREE.Vector3(0,1.6,.15),new THREE.Vector3(0,1.25,.3));
  const kGlow=new THREE.PointLight(0xffaa55,1.4,1.4,2);kGlow.position.set(0,1.3,.4);K.add(kGlow);KX.glow=kGlow;
  [-150,-30,0,180,-90].forEach(d=>gemPosK.push(ringGem(d,K)));
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const g=x.createRadialGradient(128,128,50,128,128,128);
  g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.6)');g.addColorStop(.75,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);
  const au=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),color:0xff5a30,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  au.scale.setScalar(3.4);au.position.z=-.3;K.add(au);KX.aura=au;
  const runes=new THREE.Group();for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const s=new THREE.Mesh(new THREE.OctahedronGeometry(.018,0),glowMat);s.position.set(Math.cos(a)*1.5,Math.sin(a)*1.5,-.1);runes.add(s)}
  K.add(runes);KX.runes=runes;
}

// ================= L: emerald dragons (VIP 2) =================
const L=new THREE.Group();root.add(L);const gemPosL=[];const LX={drs:[]};
{
  const c0=document.createElement('canvas');c0.width=256;c0.height=128;const x0=c0.getContext('2d');x0.fillStyle='#808080';x0.fillRect(0,0,256,128);
  for(let row=0;row<8;row++)for(let col=0;col<17;col++){const cx=col*16+(row%2?8:0),cy=row*16+8;const g=x0.createRadialGradient(cx,cy-6,1,cx,cy,11);
    g.addColorStop(0,'#fff');g.addColorStop(.7,'#9a9a9a');g.addColorStop(1,'#202020');x0.fillStyle=g;x0.beginPath();x0.arc(cx,cy,9,0,Math.PI);x0.fill()}
  const sc=new THREE.CanvasTexture(c0);sc.wrapS=sc.wrapT=THREE.RepeatWrapping;sc.repeat.set(34,2);
  const dBody=new THREE.MeshPhysicalMaterial({color:0xe6ab45,metalness:1,roughness:.28,bumpMap:sc,bumpScale:3,envMapIntensity:1.1});LX.body=dBody;
  [1,-1].forEach(side=>{
    const grp=new THREE.Group();const N=220,pts=[],dirs=[];
    const p0=side>0?-1.78:Math.PI+1.78,p1=side>0?1.2:Math.PI-1.2;
    for(let i=0;i<=N;i++){const s=i/N,phi=p0+(p1-p0)*s,th=s*Math.PI*2*2.5+(side>0?0:Math.PI);
      const n=new THREE.Vector3(Math.cos(phi),Math.sin(phi),0),z=new THREE.Vector3(0,0,1);
      const off=n.clone().multiplyScalar(Math.cos(th)).add(z.clone().multiplyScalar(Math.sin(th)));
      const rr=.19*(1-sstep(.86,1,s)*.6);const p=n.clone().multiplyScalar(1+sstep(.86,1,s)*.16).add(off.clone().multiplyScalar(rr));p.z+=sstep(.8,1,s)*.22;pts.push(p);dirs.push(off)}
    const curve=new THREE.CatmullRomCurve3(pts),TS=420,RS=16,geo=new THREE.TubeGeometry(curve,TS,.075,RS,false),pos=geo.attributes.position,c=new THREE.Vector3(),v=new THREE.Vector3();
    for(let i=0;i<=TS;i++){const u=i/TS;curve.getPointAt(u,c);const f=(.15+.85*sstep(0,.35,u))*(1+.25*sstep(.85,1,u));
      for(let j=0;j<=RS;j++){const k=i*(RS+1)+j;v.fromBufferAttribute(pos,k).sub(c).multiplyScalar(f).add(c);pos.setXYZ(k,v.x,v.y,v.z)}}
    geo.computeVertexNormals();grp.add(new THREE.Mesh(geo,dBody));
    const spG=new THREE.ConeGeometry(.024,.1,6);spG.translate(0,.05,0);const cnt=37;const sp=new THREE.InstancedMesh(spG,gem,cnt);
    const up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),S=new THREE.Vector3();
    for(let k=0;k<cnt;k++){const u=.08+k*.022;const d=dirs[Math.round(u*N)].clone();curve.getPointAt(u,c);const f=(.15+.85*sstep(0,.35,u));
      q.setFromUnitVectors(up,d.normalize());S.setScalar(.5+.8*f);M4.compose(c.clone().add(d.clone().multiplyScalar(.075*f*.9)),q,S);sp.setMatrixAt(k,M4)}
    grp.add(sp);
    const head=new THREE.Group(),end=curve.getPointAt(1),tan=curve.getTangentAt(1);head.position.copy(end);head.lookAt(end.clone().add(tan));
    const skull=new THREE.Mesh(new THREE.SphereGeometry(.105,32,24),dBody);skull.scale.set(1,.85,1.25);head.add(skull);
    const snout=new THREE.Mesh(new THREE.CylinderGeometry(.042,.08,.22,20),gold);snout.rotation.x=Math.PI/2;snout.position.set(0,.01,.17);head.add(snout);
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.046,20,14),gold);nose.scale.set(1.15,.8,1);nose.position.set(0,.02,.28);head.add(nose);
    const jaw=new THREE.Group();jaw.position.set(0,-.045,.02);const jm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.06,.22,16),gold);jm.rotation.x=Math.PI/2;jm.position.set(0,-.01,.13);jaw.add(jm);
    [-.025,.025].forEach(xx=>{const f=new THREE.Mesh(new THREE.ConeGeometry(.012,.05,8),ivory);f.position.set(xx,.03,.2);jaw.add(f)});head.add(jaw);
    [-.03,.03].forEach(xx=>{const f=new THREE.Mesh(new THREE.ConeGeometry(.012,.055,8),ivory);f.rotation.x=Math.PI;f.position.set(xx,-.04,.24);head.add(f)});
    [-1,1].forEach(sx=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.024,16,12),glowMat);e.scale.set(1,.7,1.3);e.position.set(sx*.062,.05,.08);head.add(e);
      const hg=new THREE.ConeGeometry(.028,.3,12);hg.translate(0,.15,0);const horn=new THREE.Mesh(hg,gold);horn.position.set(sx*.05,.07,-.05);horn.rotation.set(-2.1,0,sx*-.45);head.add(horn);
      for(let k=0;k<4;k++){const fr=new THREE.Mesh(new THREE.ConeGeometry(.018,.12-k*.015,6),gem);fr.geometry.translate(0,.06,0);fr.position.set(sx*.09,-.02-k*.03,-.04-k*.02);fr.rotation.set(-1.3,0,sx*(-1.4-k*.15));head.add(fr)}});
    const gl2=new THREE.PointLight(0x40ff9a,1,1.2,2);gl2.position.set(0,.06,.14);head.add(gl2);
    grp.add(head);L.add(grp);LX.drs.push({grp,head,jaw,gl:gl2})});
  const cs=new THREE.Shape();cs.moveTo(0,-.3);cs.lineTo(-.16,-.14);cs.lineTo(-.22,.04);cs.lineTo(-.15,.14);cs.quadraticCurveTo(-.3,.32,-.36,.46);cs.quadraticCurveTo(-.18,.36,-.08,.24);
  cs.lineTo(0,.3);cs.lineTo(.08,.24);cs.quadraticCurveTo(.18,.36,.36,.46);cs.quadraticCurveTo(.3,.32,.15,.14);cs.lineTo(.22,.04);cs.lineTo(.16,-.14);cs.closePath();
  const cg=new THREE.ExtrudeGeometry(cs,{depth:.06,bevelEnabled:true,bevelThickness:.03,bevelSize:.025,bevelSegments:5,curveSegments:24});cg.center();
  const crest=new THREE.Group();crest.add(new THREE.Mesh(cg,gold));
  const bg=new THREE.Mesh(new THREE.OctahedronGeometry(.075,0),gem);bg.scale.set(1,1.3,.6);bg.position.set(0,-.07,.1);crest.add(bg);LX.big=bg;
  [-1,1].forEach(sx=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.026,16,12),glowMat);e.scale.set(1.6,.6,.6);e.position.set(sx*.065,.05,.085);e.rotation.z=sx*.4;crest.add(e)});
  crest.position.set(0,1.27,.06);L.add(crest);gemPosL.push(new THREE.Vector3(0,1.2,.2));
  [35,62,118,145,215,242,298,325].forEach(d=>gemPosL.push(ringGem(d,L)));
}

// lights
scene.add(new THREE.AmbientLight(0xffffff,.15));
const key=new THREE.DirectionalLight(0xfff1d0,1.6);key.position.set(2,3,4);scene.add(key);
const rim=new THREE.DirectionalLight(0xffffff,.5);rim.position.set(-3,-1,-2);scene.add(rim);
const sweep=new THREE.PointLight(0xffffff,3.2,3.2,1.6);scene.add(sweep);
const crestLight=new THREE.PointLight(0xffffff,1.2,1.6,2);crestLight.position.set(0,1.3,.4);scene.add(crestLight);

// sparkles + embers
function sparkSet(list,parent){return list.filter(Boolean).map((p,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:sT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));
  s.position.copy(p).add(new THREE.Vector3(.03,.03,.08));s.userData.ph=i*1.37;parent.add(s);return s})}
const sparks=[...sparkSet([...gemPosA,new THREE.Vector3(0,1.47,.1)],A),...sparkSet([...gemPosB,new THREE.Vector3(.1,1.3,.2)],B),...sparkSet([...gemPosC,new THREE.Vector3(0,1.32,.25),new THREE.Vector3(.22,1.5,.15),new THREE.Vector3(-.22,1.5,.15)],C),
  ...sparkSet(gemPosD,D),...sparkSet(gemPosE,E),...sparkSet(gemPosF,F),...sparkSet(gemPosG,G),...sparkSet(gemPosH,H),...sparkSet(gemPosI,I),...sparkSet(gemPosJ,J),...sparkSet(gemPosK,K),...sparkSet(gemPosL,L)];
const EN=130,eGeo=new THREE.BufferGeometry(),eP=new Float32Array(EN*3),eS=[];
for(let i=0;i<EN;i++){const a=Math.random()*Math.PI*2,r=1+Math.random()*.5;eP[i*3]=Math.cos(a)*r;eP[i*3+1]=Math.sin(a)*r;eP[i*3+2]=(Math.random()-.5)*.5;eS.push(.15+Math.random()*.35)}
eGeo.setAttribute('position',new THREE.BufferAttribute(eP,3));
const embers=new THREE.Points(eGeo,new THREE.PointsMaterial({size:.028,map:sT,opacity:.6,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));root.add(embers);

// themes (same order as the approved demo)
const METAL={gold:[0xf2bd55,0xe6ab45],silver:[0xe9eef3,0xc4ccd6],rose:[0xf3b39a,0xd9937a]};
const THEMES=[
 {gem:0x0c9a52,dark:0x08502d,eye:[.5,2.2,1.1],metal:'gold'},
 {gem:0xc8102e,dark:0x5a0612,eye:[2.4,.4,.4],metal:'gold'},
 {gem:0x1f5bff,dark:0x0a1e66,eye:[.5,1.1,2.6],metal:'gold'},
 {gem:0x8a2be2,dark:0x34105a,eye:[1.8,.6,2.6],metal:'gold'},
 {gem:0xff7a10,dark:0x6a2600,eye:[2.6,1.2,.3],metal:'gold'},
 {gem:0x66c8ff,dark:0x12406a,eye:[1,2,2.6],metal:'silver'},
 {gem:0xff4f8b,dark:0x6a1236,eye:[2.6,.8,1.6],metal:'rose'},
 {gem:0x1c1c1c,dark:0x0a0a0a,eye:[2.6,1.8,.4],metal:'gold'},
 {gem:0x14c4b4,dark:0x064a46,eye:[.5,2.4,2.2],metal:'gold'},
 {gem:0x7a2cff,dark:0x22083f,eye:[2,1.1,2.6],metal:'gold'}
];
const LEVEL={image:1,phoenixw:1,phoenix:1,dragon:2,star:3,lotus:4,lion:5,eagle:6,rose:7,panther:8,ocean:9,emperor:10};
let design='dragon',theme=0,GLOW=THEMES[0].eye;
function apply(){const th=THEMES[theme],m=METAL[th.metal];
  A.visible=design==='wings';B.visible=design==='moon';C.visible=design==='star';D.visible=design==='lotus';E.visible=design==='lion';F.visible=design==='eagle';G.visible=design==='rose';
  H.visible=design==='panther';I.visible=design==='ocean';J.visible=design==='emperor';K.visible=design==='phoenix'||design==='phoenixw';L.visible=design==='dragon';
  {const wo=design==='phoenixw';KX.bird.forEach(o=>o.visible=!wo);KX.root.forEach(o=>o.visible=wo);KX.aura.visible=wo;KX.runes.visible=wo;KX.aura.material.color.setHex(th.gem).lerp(new THREE.Color(1,.6,.3),.4)}
  KX.redF.color.setHex(th.gem);KX.redF.emissive.setHex(th.gem).multiplyScalar(.4);
  {const fc=new THREE.Color(th.eye[0]/2.6,th.eye[1]/2.6,th.eye[2]/2.6).lerp(new THREE.Color(1,.6,.2),.35);KX.fires.forEach(s=>s.material.color.copy(fc));KX.glow.color.copy(fc)}
  {const ac=new THREE.Color(th.gem).lerp(new THREE.Color(1,1,1),.15);aura.material.color.copy(ac);cosmic.material.color.copy(ac).lerp(new THREE.Color(1,1,1),.5);
   const e2=th.eye;bolts.forEach(b=>b.material.color.setRGB(e2[0]+.6,e2[1]+.6,e2[2]+.6))}
  water.color.setHex(th.gem).lerp(new THREE.Color(1,1,1),.3);water.emissive.setHex(th.gem).multiplyScalar(.4);
  petalMat.color.setHex(th.gem).lerp(new THREE.Color(1,1,1),.18);
  ice.color.setHex(th.gem).lerp(new THREE.Color(1,1,1),.7);ice.emissive.setHex(th.gem).multiplyScalar(.35);
  {const fc=new THREE.Color(th.eye[0]/2.6,th.eye[1]/2.6,th.eye[2]/2.6).lerp(new THREE.Color(1,.55,.15),.25);[...flames,...maneFire].forEach(s=>s.material.color.copy(fc))}
  crystal.color.setHex(th.gem).lerp(new THREE.Color(1,1,1),.15);crystal.emissive.setHex(th.gem).multiplyScalar(.55);
  rays.children.forEach(r=>r.material.color.setHex(th.gem).lerp(new THREE.Color(1,1,1),.35));
  gold.color.setHex(m[0]);gold2.color.setHex(m[1]);gem.color.setHex(th.gem);gem.emissive.setHex(th.gem).multiplyScalar(.3);gemDark.color.setHex(th.dark);
  LX.body.color.setHex(m[1]);LX.drs.forEach(d=>d.gl.color.setRGB(th.eye[0]/2.6,th.eye[1]/2.6,th.eye[2]/2.6));
  GLOW=th.eye;const ec=new THREE.Color(th.eye[0]/2.6,th.eye[1]/2.6,th.eye[2]/2.6);
  rim.color.copy(ec);crestLight.color.copy(ec);embers.material.color.copy(ec).lerp(new THREE.Color(1,1,1),.3);
  sparks.forEach(s=>s.material.color.copy(ec).lerp(new THREE.Color(1,1,1),.6));
  LABEL='VIP '+(LEVEL[design]||theme+1);drawText();
}
function update(t){
  root.rotation.y=Math.sin(t*1.9)*.12;root.rotation.x=0;
  {const k=1+Math.sin(t*3)*.25;glowMat.color.setRGB(GLOW[0]*k,GLOW[1]*k,GLOW[2]*k)}
  innerRing.material.emissiveIntensity=.3+.15*Math.sin(t*2);
  wings.forEach(w=>{const f=Math.sin(t*1.9);w.pivot.rotation.z=w.side*f*.12;w.pivot.rotation.y=w.side*f*.32});
  {const roar=Math.pow(Math.max(0,Math.sin(t*1.9)),8);
   ljaw.rotation.x=.05+roar*.6;mouth.scale.y=.2+roar*.9;lion.scale.setScalar(1+roar*.06);mane.rotation.z=Math.sin(t*1.9)*.06;
   flames.forEach(s=>{const u=s.userData,k=u.base*(1+.35*Math.sin(t*9.5+u.ph)+.2*Math.sin(t*5.7+u.ph*2))*(1+roar*.6);s.scale.set(k*.55,k,1)});
   maneFire.forEach(s=>{const k=.3*(1+.4*Math.sin(t*7.6+s.userData.ph))*(1+roar*.9);s.scale.set(k*.6,k,1)})}
  eagles.forEach(e=>{const f=Math.sin(t*1.9+(e.side>0?0:.4));e.wings2.forEach(w=>{w.piv.rotation.z=e.side*f*.1*w.dir;w.piv.rotation.y=e.side*f*.3});
    e.head.rotation.y=Math.sin(t*1.9+e.side)*.3;e.eg.position.y=.05+Math.sin(t*1.9)*.015});
  {const auto=Math.pow(Math.max(0,Math.sin(t*1.9)),12);
   LX.drs.forEach((d,i)=>{const ph=i*Math.PI;d.jaw.rotation.x=.08+.5*auto;d.head.rotation.z=Math.sin(t*1.9+ph)*.08;d.grp.scale.setScalar(1+Math.sin(t*1.9+ph)*.012);d.gl.intensity=1+Math.sin(t*3.8+ph)*.5});
   LX.big.rotation.y=t*1.9}
  KX.phs.forEach((p,i)=>{const f=Math.sin(t*1.9+i*.3);p.wings.forEach((w,j)=>{w.rotation.z=-f*(.1-j*.025);w.rotation.y=-f*(.32-j*.08)});p.head.rotation.z=Math.sin(t*1.9+i)*.1;p.ph.position.y=.2+f*.012});
  KX.fires.forEach(s=>{const u=s.userData,k=u.L*.32*(1+.45*Math.sin(t*9.5+u.ph)+.2*Math.sin(t*5.7+u.ph*2));s.scale.set(k*.55,k,1)});
  KX.aura.material.opacity=.24+.1*Math.sin(t*1.9);KX.aura.material.rotation=t*.15;KX.runes.rotation.z=t*.2;
  KX.runes.children.forEach((r,i)=>r.scale.setScalar(.6+.6*Math.max(0,Math.sin(t*3.8+i*.7))));
  KX.top.rotation.y=t*1.9;KX.crown.rotation.y=Math.sin(t*1.9)*.3;KX.glow.intensity=1.1+.5*Math.sin(t*1.9);
  aura.material.opacity=.22+.08*Math.sin(t*1.9);aura.material.rotation=t*.1;
  for(let i=0;i<CS;i++){const c=csA[i],a=c[0]+t*c[2];csP[i*3]=Math.cos(a)*c[1];csP[i*3+1]=Math.sin(a)*c[1]}csGeo.attributes.position.needsUpdate=true;
  ecrown.rotation.y=Math.sin(t*1.9)*.4;orb.rotation.y=t*1.9;
  {const f=Math.sin(t*1.9);phWings[0].rotation.z=-f*.12;phWings[0].rotation.y=-f*.3;phWings[1].rotation.y=-f*.2;phH.rotation.y=Math.sin(t*1.9)*.25;}
  phFire.forEach(s=>{const k=.18*(1+.4*Math.sin(t*7.6+s.userData.ph));s.scale.set(k*.6,k,1)});
  drJ.userData.head.rotation.z=Math.sin(t*1.9)*.1;
  if(J.visible){if(t>nextBolt||t<nextBolt-2){strike(bolts[Math.floor(Math.random()*3)]);nextBolt=t+.25+Math.random()*.6}bolts.forEach(b=>b.material.opacity*=.7)}
  waves.forEach(w=>{const u=w.userData,k=Math.sin(t*1.9+u.ph);const r=u.r+k*.02;w.position.x=Math.cos(u.a)*r;w.position.y=Math.sin(u.a)*r;w.rotation.z=u.a+Math.PI/2+k*.08});
  moonI.position.y=1.32+Math.sin(t*1.9)*.02;moonGem.rotation.y=t*1.9;starsI.forEach((s,i)=>{s.rotation.z=t*1.9;s.rotation.y=Math.sin(t*1.9+i)*.4});
  for(let i=0;i<BN;i++){bP[i*3+1]+=.012+(i%4)*.004;if(bP[i*3+1]>.2){const a=-Math.PI*(.1+Math.random()*.8);bP[i*3]=Math.cos(a)*(1.25+Math.random()*.2);bP[i*3+1]=Math.sin(a)*(1.25+Math.random()*.2)}}
  bGeo.attributes.position.needsUpdate=true;
  panthers.forEach(p=>{const ph=p.side>0?0:1.3;p.headP.rotation.y=-.35+Math.sin(t*1.9+ph)*.35;p.headP.rotation.x=Math.sin(t*1.9+ph)*.08;
    p.tailG.rotation.z=Math.sin(t*1.9+ph)*.12;p.pg.scale.y=1+Math.sin(t*1.9+ph)*.012});
  bd.rotation.y=t*1.9;back8.rotation.z=-t*.15;
  roses.forEach((r,i)=>r.rotation.z=Math.sin(t*1.9+i)*.12);drop.rotation.y=t*1.9;tiaraG.position.y=1.18+Math.sin(t*1.9)*.015;
  fPet.forEach(p=>{const u=p.userData;u.y-=u.s*.024;if(u.y<-1.7){u.y=1.7;u.x=(Math.random()-.5)*3}p.position.set(u.x+Math.sin(t+u.ph)*.15,u.y,.3+Math.sin(t*.5+u.ph)*.2);p.rotation.set(t+u.ph,t*.7,u.ph)});
  bigFlake.rotation.z=t*.3;dia.rotation.y=t*1.9;flakes.forEach(f=>{f.rotation.z=t*.5+f.userData.ph;f.rotation.y=Math.sin(t*1.9+f.userData.ph)*.6});
  for(let i=0;i<SN;i++){snP[i*3+1]-=.016+(i%5)*.004;if(snP[i*3+1]<-1.7){snP[i*3+1]=1.7;snP[i*3]=(Math.random()-.5)*3.4}}
  snGeo.attributes.position.needsUpdate=true;
  bWings.forEach(b=>b.w.rotation.y=b.side*(.15+.55*Math.max(0,Math.sin(t*3.8))));bf.position.y=1.3+Math.sin(t*1.9)*.03;
  lotuses.forEach((l,i)=>{l.rotation.z=Math.sin(t*1.9+i)*.15;const k=1+.04*Math.sin(t*1.9+i);l.scale.setScalar((i<2?1.1:i<4?.85:.6)*k)});
  crystal.emissiveIntensity=.45+.25*Math.sin(t*1.9);
  st4.rotation.z=t*1.9;st8.rotation.z=-t*.2;rays.rotation.z=t*.25;core.scale.setScalar(1+.2*Math.sin(t*3.8));
  rays.children.forEach((r,i)=>r.material.opacity=.18+.22*Math.max(0,Math.sin(t*1.9+i)));
  crown.rotation.y=t*1.9;halo.rotation.z=t*1.9;cross.rotation.y=t*1.9;
  moon.position.y=1.28+Math.sin(t*1.9)*.02;star.rotation.y=Math.sin(t*1.9)*.5;
  orbs.forEach((o,i)=>{const a=t*1.9+i/orbs.length*Math.PI*2;o.position.set(Math.cos(a)*1.42,Math.sin(a)*1.42,0);o.rotation.set(t,t*1.3,0)});
  const sx=((t/LOOP)%1)*3.2-1.6;sweep.position.set(sx*1.5,sx*.6+.3,1.2);crestLight.intensity=1+.5*Math.sin(t*1.9);
  sparks.forEach(s=>{const k=Math.pow(Math.max(0,Math.sin(t*1.9+s.userData.ph)),10);s.scale.setScalar(.02+k*.32);s.material.opacity=k});
  for(let i=0;i<EN;i++){eP[i*3+1]+=eS[i]*.024;if(eP[i*3+1]>1.7){const a=Math.random()*Math.PI*2,r=1+Math.random()*.5;eP[i*3]=Math.cos(a)*r;eP[i*3+1]=-1.1+Math.random()*.4}}
  eGeo.attributes.position.needsUpdate=true;
}

// ---------- the original VIP 1 artwork (2D shader on frames/vip1.jpg) ----------
const IMG = (() => {
  const P=[{h:125,m:0},{h:0,m:0},{h:225,m:0},{h:285,m:0},{h:28,m:0},{h:200,m:1},{h:330,m:2},{h:0,m:0,o:1},{h:165,m:0},{h:270,m:0}];
  const VS='attribute vec2 p;varying vec2 v;void main(){v=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}';
  const FS=`precision highp float;varying vec2 v;uniform sampler2D T;uniform float t,hue,metal,onyx;uniform vec3 fireC;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  vec3 hr(vec3 c,float a){vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}
  void main(){vec2 uv=v;float side=uv.x<.5?-1.:1.;float dx=abs(uv.x-.5);
    float w=smoothstep(.25,.47,dx)*(1.-smoothstep(.6,.78,uv.y))*smoothstep(.0,.12,uv.y);
    vec2 piv=vec2(.5+side*.25,.46);float a=sin(t*1.9)*.085*w*side;vec2 q=uv-piv;q=mat2(cos(a),-sin(a),sin(a),cos(a))*q;uv=q+piv;uv.y+=sin(t*1.9-dx*9.)*.007*w;
    vec4 s0=texture2D(T,uv);
    float fire=smoothstep(.12,.38,s0.r-s0.g)*smoothstep(.22,.3,dx)*smoothstep(.15,.45,s0.r);
    float fn=n(vec2(uv.x*38.,uv.y*22.+t*5.7));uv+=vec2((fn-.5)*.009,-fn*.008)*fire;
    vec3 c=texture2D(T,uv).rgb;float mx=max(c.r,max(c.g,c.b));float al=clamp((mx-.055)/.28,0.,1.);
    float red=smoothstep(.28,.5,c.r-c.g);float gold=smoothstep(.3,.6,c.g)*smoothstep(.02,.16,c.r-c.b)*(1.-red);float lum=dot(c,vec3(.3,.55,.15));
    vec3 rc=hr(c,radians(hue));rc=mix(rc,vec3(lum*.55)*vec3(.95,.95,1.05)+vec3(.02),onyx);c=mix(c,rc,red);
    vec3 sil=vec3(lum*1.08)*vec3(.94,.98,1.06);vec3 ros=c*vec3(1.,.78,.74)+vec3(.04,0.,.02);c=mix(c,metal<.5?c:(metal<1.5?sil:ros),gold);
    vec3 add=fireC*fire*(.12+.35*n(uv*14.+vec2(0.,t*3.8)));
    float band=(uv.x*.8+uv.y)-fract(t/3.3)*2.6+.5;add+=vec3(1.,.95,.82)*exp(-band*band*90.)*gold*.8;
    float cell=h(floor(uv*55.));float tw=pow(.5+.5*sin(t*1.9+cell*6.283),10.);add+=fireC*red*(1.-smoothstep(.2,.3,dx)*.7)*(.12+tw*.7);
    float dia=smoothstep(.7,.92,min(c.r,min(c.g,c.b)));add+=vec3(1.)*dia*tw*1.1;
    float cr=exp(-pow(length((v-vec2(.5,.14))*vec2(1.,1.5))*4.2,2.));add+=vec3(1.,.85,.5)*cr*(.16+.12*sin(t*1.9))*smoothstep(.15,.5,mx);
    al*=smoothstep(.236,.244,length(v-vec2(.5,.478)));gl_FragColor=vec4((c*.85+add)*al,al);}`;
  const cv=document.createElement('canvas');cv.width=cv.height=SIZE;
  const gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,preserveDrawingBuffer:true});
  let u={},ready=null;
  if(gl){const sh=(ty,s)=>{const o=gl.createShader(ty);gl.shaderSource(o,s);gl.compileShader(o);return o};
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const l=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
    ['t','hue','metal','onyx','fireC'].forEach(k=>u[k]=gl.getUniformLocation(pr,k));
    ready=new Promise((res)=>{const img=new Image();img.onload=()=>{const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);res(true)};
      img.onerror=()=>res(false);img.src='vip1-frame.jpg'})}
  return { ready: () => ready || Promise.resolve(false), draw(i,t){const p=P[i],e=THEMES[i].eye;gl.viewport(0,0,SIZE,SIZE);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.t,t);gl.uniform1f(u.hue,p.h);gl.uniform1f(u.metal,p.m);gl.uniform1f(u.onyx,p.o||0);gl.uniform3f(u.fireC,e[0]/2.6,e[1]/2.6,e[2]/2.6);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return cv} };
})();

/* ---------- public: make an animated sprite sheet for "design:colour" ---------- */
const cache = new Map();
let queue = Promise.resolve();
function sheet(code) {
  if (cache.has(code)) return cache.get(code);
  const job = queue.then(async () => {
    const [d, ti] = String(code).split(":"); const tIdx = Math.max(0, Math.min(9, parseInt(ti, 10) || 0));
    if (d !== "image" && !LEVEL[d] && d !== "wings" && d !== "moon") throw new Error("bad frame");
    const out = document.createElement("canvas"); out.width = SIZE * FRAMES; out.height = SIZE; const ox = out.getContext("2d");
    if (d === "image") {
      if (!(await IMG.ready())) throw new Error("no image");
      for (let f = 0; f < FRAMES; f++) ox.drawImage(IMG.draw(tIdx, f / FRAMES * LOOP), f * SIZE, 0);
    } else {
      design = d; theme = tIdx; apply();
      for (let f = 0; f < FRAMES; f++) { update(f / FRAMES * LOOP); renderer.render(scene, camera); ox.drawImage(canvas, f * SIZE, 0); }
    }
    const blob = await new Promise((r) => out.toBlob(r, "image/png"));
    return { url: URL.createObjectURL(blob), n: FRAMES, scale: d === "image" ? 2.05 : 1.79 };
  });
  queue = job.catch(() => {});
  cache.set(code, job);
  job.catch(() => cache.delete(code));
  return job;
}
// let the ribbon text use the nicer font once it has loaded
try { document.fonts?.load('900 60px Cinzel').then(() => { cache.clear(); }).catch(() => {}); } catch {}

window.VipFrames3D = { sheet, LEVEL };
window.dispatchEvent(new Event("vipframes3d-ready"));
