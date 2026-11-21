import * as T from 'three';
import {elevations,sailName} from './model.js';
import {RIGGING} from './rigging-plan.js';
import {AUDIENCE_ROWS, STAGE, VENUE, planToWorld} from './venue-plan.js';
const mats={
 wood:new T.MeshStandardMaterial({color:'#ad8050',roughness:.75}),
 rope:new T.MeshStandardMaterial({color:'#736047',roughness:1}),
 sand:new T.MeshStandardMaterial({color:'#bba078',roughness:1}),
 metal:new T.MeshStandardMaterial({color:'#444950',metalness:.6,roughness:.5}),
 fabric:new T.MeshStandardMaterial({color:'#e7dfc9',side:T.DoubleSide,roughness:1,
  transparent:true,opacity:.9,depthWrite:false,forceSinglePass:true}),
 seat:new T.MeshStandardMaterial({color:'#773441',roughness:1}),
 floor:new T.MeshStandardMaterial({color:'#343237',roughness:1}),
 tier:new T.MeshStandardMaterial({color:'#413637',roughness:1}),
 arch:new T.MeshStandardMaterial({color:'#66534b',roughness:1}),
 masking:new T.MeshStandardMaterial({color:'#373239',roughness:1}),
 wall:new T.MeshStandardMaterial({color:'#d3d0c7',side:T.DoubleSide,roughness:1}),
 selected:new T.LineBasicMaterial({color:'#d1aa6a'}),
};
// Transmit diffuse light from the reverse face using the same shadowed light
// contribution as the front face, so a figure between a lamp and the cloth reads as a silhouette.
mats.fabric.onBeforeCompile=shader=>{
 shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',`
  #include <lights_physical_pars_fragment>

  void RE_Direct_Sail( const in IncidentLight light, const in vec3 position, const in vec3 normal,
    const in vec3 viewDir, const in vec3 clearcoatNormal, const in PhysicalMaterial material,
    inout ReflectedLight reflectedLight ) {
    RE_Direct_Physical( light, position, normal, viewDir, clearcoatNormal, material, reflectedLight );
    float backlight = max( 0.0, -dot( normal, light.direction ) );
    reflectedLight.directDiffuse += 0.65 * backlight * light.color * BRDF_Lambert( material.diffuseColor );
  }

  #undef RE_Direct
  #define RE_Direct RE_Direct_Sail
 `);
};
function mesh(g,mat,p=[0,0,0]){const m=new T.Mesh(g,mat);m.position.set(...p);m.castShadow=true;m.receiveShadow=true;return m;}
function box(parent,size,pos,mat){const m=mesh(new T.BoxGeometry(...size),mat,pos);parent.add(m);return m;}
function cord(parent,a,b,r=.003,mat=mats.rope){const v=new T.Vector3(...a),w=new T.Vector3(...b),d=w.clone().sub(v);if(d.length()<.0001)return;
 const m=mesh(new T.CylinderGeometry(r,r,d.length(),7),mat);m.position.copy(v.add(w).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());parent.add(m);return m;}
function path(parent,points,r=.003){const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));parent.add(mesh(new T.TubeGeometry(c,Math.max(10,points.length*3),r,6,false),mats.rope));}
function knot(parent,x,y,z){const k=mesh(new T.TorusGeometry(.009,.0035,5,9),mats.rope,[x,y,z]);k.rotation.z=.5;parent.add(k);}
function bag(parent,x,neck,z,height=.15,width=.105){
 const b=mesh(new T.SphereGeometry(1,12,9),mats.sand,[x,neck-height*.54,z]);b.scale.set(width*.52,height*.46,width*.39);parent.add(b);
 const n=mesh(new T.CylinderGeometry(width*.12,width*.26,height*.2,9),mats.sand,[x,neck-height*.1,z]);parent.add(n);knot(parent,x,neck-height*.12,z);
 for(const dx of [-.014,.014])cord(parent,[x+dx,neck-height*.2,z+width*.33],[x+dx*2,neck-height*.68,z+width*.36],.0014,mats.rope);
}
function label(parent,words,pos,color='#d6d9dc',size=.18){
 const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.font='500 42px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(words,256,48);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false}));s.position.set(...pos);s.scale.set(size*512/96,size,1);parent.add(s);
}
function measure(parent,a,b,words){const mat=new T.LineBasicMaterial({color:'#aeb5bf'});const g=new T.BufferGeometry().setFromPoints([new T.Vector3(...a),new T.Vector3(...b)]);parent.add(new T.Line(g,mat));label(parent,words,a.map((v,i)=>(v+b[i])/2+(i===1?.09:0)),'#c3ccd7',.13);}
export function makeSail(model,s,selected,labels,dimensions){
 const m=s.dimensions ? {...model,...s.dimensions} : model;
 const g=new T.Group();g.name=sailName(s);g.userData.sailId=s.id;g.position.set(...planToWorld(s));g.rotation.y=s.angle*Math.PI/180;
 const e=elevations(m,s.closed),top=e.top/1000,bottom=e.bottom/1000,w=m.fabricWidth/1000,l=m.battenLength/1000;
 const nx=30,ny=72,positions=[],uv=[],indices=[];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,v=j/ny,x=(u-.5)*w,y=bottom+(top-bottom)*v;
  const z=Math.sin(v*Math.PI*12)*(.004+.029*s.closed)*Math.sin(u*Math.PI)+.008*Math.sin(u*Math.PI*7)*Math.sin(v*Math.PI);
  positions.push(x,y,z);uv.push(u,v);
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const fabric=mesh(geo,mats.fabric);
 fabric.castShadow=false;
 g.add(fabric);
 for(const y of [top,bottom])box(g,[l,.024,.026],[0,y,0],mats.wood);
 const ropeXs=[-Math.min(.3,w*.22),Math.min(.3,w*.22)];
 const supportHeight = model.riggingHeight / 1000;
 if (supportHeight > top + .09) {
  for (const x of [-l * .4, l * .4]) {
   const support = cord(g, [x, top + .015, 0], [x, supportHeight, 0], .004);
   support.name = 'Preview sail support';
  }
 }
 const operating = new T.Group();
 operating.name = 'Upstage operating ropes';
 operating.scale.z = Math.cos(g.rotation.y) >= 0 ? -1 : 1;
 g.add(operating);
 for(const x of ropeXs){
  const py=top+.064;
  const pulley=mesh(new T.TorusGeometry(.021,.005,6,14),mats.metal,[x,py,.025]);operating.add(pulley);
  cord(operating,[x,top+.012,.025],[x,py-.02,.025],.004,mats.metal);
  const holes=Array.from({length:6},(_,i)=>top-(top-bottom)*(.10+i*.16));
  const levels=[top+.06,...holes,bottom];
  levels.slice(0,-1).forEach((y,i)=>{const front=i%2===0;cord(operating,[x,y,front?.028:-.03],[x,levels[i+1],front?.028:-.03],.0032);});
  for(const y of holes){const ring=mesh(new T.TorusGeometry(.007,.0018,5,10),mats.rope,[x,y,.016]);operating.add(ring);cord(operating,[x,y+.008,.03],[x,y-.008,-.03],.003);}
  const neck=bottom-m.tieLength/1000;cord(operating,[x,bottom,0],[x,neck,0],.0035);bag(operating,x,neck,0,m.bagHeight/1000);
 }
 // Equal-length return branches: the first joining knot moves down as the sail is raised.
 const half=ropeXs[1],branchOpen=Math.hypot(half,.35),branchLength=branchOpen+(e.bottom-elevations(m).bottom)/1000;
 const joinY=top+.064-Math.sqrt(Math.max(0,branchLength*branchLength-half*half)),handleZ=.10;
 for(const x of ropeXs){path(operating,[[x,top+.06,.03],[x,top+.09,.055],[x,top+.055,.08],[0,joinY,handleZ]],.0035);}
 const tailLength=Math.max(.2,(elevations(m).top/1000-.35)-.08);
 const anchorNeck=.20,handleEnd=joinY-tailLength;
 const visibleEnd=s.closed>.95?Math.max(anchorNeck,handleEnd):Math.max(.07,handleEnd);
 for(const x of [-.006,.006])cord(operating,[x,joinY,handleZ],[x,visibleEnd,handleZ],.0035);
 for(let y=joinY;y>visibleEnd+.02;y-=.19)knot(operating,0,y,handleZ);
 if(s.closed>.95){
  cord(operating,[0,visibleEnd,handleZ],[0,anchorNeck,.22],.005);bag(operating,0,anchorNeck,.22,.2,.32);knot(operating,0,anchorNeck,.22);
  // Excess tail lies beside the ground bag after the tie-off.
  path(operating,[[0,anchorNeck,.22],[.13,.035,.30],[.25,.012,.35],[.36,.012,.27],[.28,.012,.17],[.16,.012,.21]],.005);
 }
 if(selected){const pts=[[-l/2,bottom-.025,.05],[-l/2,top+.025,.05],[l/2,top+.025,.05],[l/2,bottom-.025,.05],[-l/2,bottom-.025,.05]].map(v=>new T.Vector3(...v));g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),mats.selected));}
 if(labels)label(g,s.name || `S${s.id}`,[0,top+.20,0],selected?'#edc78b':'#e0e2e4',.15);
 if(dimensions&&selected){measure(g,[-l/2,top+.32,0],[l/2,top+.32,0],`${m.battenLength} mm`);measure(g,[l/2+.15,bottom,0],[l/2+.15,top,0],`${Math.round(e.drop)} mm`);}
 g.traverse(o=>{if(o.isMesh)o.userData.sailId=s.id;});return g;
}
function addAuditorium(room) {
 const matrix = new T.Matrix4();
 const seatCount = AUDIENCE_ROWS.reduce((sum, row) => sum + row.count, 0) - 1;
 const cushions = new T.InstancedMesh(new T.BoxGeometry(.46, .12, .43), mats.seat, seatCount);
 const backs = new T.InstancedMesh(new T.BoxGeometry(.46, .43, .09), mats.seat, seatCount);
 let seat = 0;
 for (const [index, row] of AUDIENCE_ROWS.entries()) {
  const z = -row.y / 1000;
  const deck = row.deck / 1000;
  const rise = deck + .94;
  box(room, [9.2, rise, row.pitch / 1000], [0, deck - rise / 2, z], mats.tier).name = `Row ${row.name}`;
  for (let col = 0; col < row.count; col++) {
   if (index === 0 && col === 0) continue; // Clear the usual stage access at A1.
   const x = (col - (row.count - 1) / 2) * .49;
   cushions.setMatrixAt(seat, matrix.makeTranslation(x, deck + .43, z));
   backs.setMatrixAt(seat, matrix.makeTranslation(x, deck + .62, z + .19));
   seat++;
  }
 }
 cushions.name = 'ADC auditorium seat cushions';
 backs.name = 'ADC auditorium seat backs';
 const forestage = -STAGE.front / 1000;
 const firstTread = -(AUDIENCE_ROWS[0].y + AUDIENCE_ROWS[0].pitch / 2) / 1000;
 box(room,[9.2,.16,firstTread-forestage],[0,-.86,(firstTread+forestage)/2],mats.tier);
 room.add(cushions, backs);
}

export function makeRoom({walls,seats,grid,labels,dimensions,riggingLabels=false}) {
 const room = new T.Group();
 const outline = new T.Shape();
 VENUE.floorOutline.forEach((point, index) => {
  const [x, , z] = planToWorld(point);
  if (index === 0) outline.moveTo(x, -z);
  else outline.lineTo(x, -z);
 });
 outline.closePath();
 const floor = mesh(new T.ExtrudeGeometry(outline, {depth:.12, bevelEnabled:false}), mats.floor, [0,-.12,0]);
 floor.name = 'ADC stage and flat forestage';
 floor.rotation.x = -Math.PI / 2;
 room.add(floor);

 const {arch, safetyCurtain} = VENUE;
 const archY = -arch.y / 1000;
 const openingHeight = STAGE.openingHeight / 1000;
 if (walls) {
  for (const {a, b} of VENUE.wallSegments) {
   const [ax, , az] = planToWorld(a), [bx, , bz] = planToWorld(b);
   const wall = box(room, [Math.hypot(bx-ax,bz-az), 5.4, .09], [(ax+bx)/2, 2.7, (az+bz)/2], mats.wall);
   wall.rotation.y = Math.atan2(az-bz, bx-ax);
  }
  const opening = STAGE.openingWidth / 1000;
  for (const side of [-1,1]) {
   box(room,[.72,openingHeight+.65,.28],[side*(opening/2+.36),(openingHeight+.65)/2,archY],mats.arch);
  }
  box(room,[opening, .65, .28],[0,openingHeight+.325,archY],mats.arch).name = 'Proscenium';
  const sides = [-6.25, 7.75];
  for (const outer of sides) {
   const inner = Math.sign(outer)*(opening/2+.72);
   box(room,[Math.abs(outer-inner),openingHeight+.65,.20],[(outer+inner)/2,(openingHeight+.65)/2,archY],mats.masking);
  }
 }

 const curtainLine = new T.BufferGeometry().setFromPoints([safetyCurtain.a,safetyCurtain.b]
  .map(point => new T.Vector3(...planToWorld({...point,height:6}))));
 const curtain = new T.Line(curtainLine, mats.selected);
 curtain.name = 'Safety curtain line';
 room.add(curtain);
 if (grid) {
  const helper = new T.GridHelper(15, 30, '#737a82', '#535a62');
  helper.position.set(0,.003,-3);
  room.add(helper);
 }
 for (const bar of RIGGING.bars) {
  const a = planToWorld({...bar.a, height:bar.height});
  const b = planToWorld({...bar.b, height:bar.height});
  const tube = cord(room, a, b, .024, mats.metal);
  tube.name = bar.label;
  tube.userData.riggingBar = bar.id;
  tube.castShadow = false;
  if (riggingLabels) label(room, bar.label, a.map((value,index) => (value+b[index])/2+(index===1?.17:0)), '#dfc48b', .18);
 }
 if (seats) addAuditorium(room);
 if (labels && walls) label(room, 'ADC STAGE', [0,.12,-8.12], '#c7b8a5', .18);
 if (dimensions) {
  measure(room, [arch.left/1000,.09,archY], [arch.right/1000,.09,archY], '6,550 mm clear opening');
  measure(room, [2.7,.11,0], [2.7,.11,-STAGE.depth/1000], '8,400 mm to back wall');
 }
 return room;
}
export function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();if(o.isSprite){o.material.map?.dispose();o.material.dispose();}});}
