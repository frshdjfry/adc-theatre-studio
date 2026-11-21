import React, {useRef, useState} from 'react';
import {endpoints} from './model.js';
import {VENUE} from './venue-plan.js';
import './stage-plan.css';

const WIDTH=248, MAX_HEIGHT=310;
export const clamp=(value,[min,max])=>Math.max(min,Math.min(max,value));

export function facingVector(direction,radius) {
  const angle=direction*Math.PI/180;
  return [radius*Math.sin(angle),radius*Math.cos(angle)];
}

export function svgPoint(svg,event) {
  const point=svg.createSVGPoint();
  point.x=event.clientX;
  point.y=event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

export function planProjection(points=[],gutter=14) {
  const bounds = [...VENUE.floorOutline, ...points];
  const left = Math.min(...bounds.map(point => point.x)) - 400;
  const right = Math.max(...bounds.map(point => point.x)) + 400;
  const bottom = Math.min(...bounds.map(point => point.y)) - 650;
  const top = Math.max(...bounds.map(point => point.y)) + 400;
  const scale=Math.min((WIDTH-2*gutter)/(right-left),(MAX_HEIGHT-2*gutter)/(top-bottom));
  const height=Math.ceil((top-bottom)*scale)+2*gutter;
  const cx=(left+right)/2,cy=(top+bottom)/2;
  return {viewBox:`0 0 ${WIDTH} ${height}`,scale,point:({x,y})=>[WIDTH/2+(x-cx)*scale,height/2-(y-cy)*scale]};
}

export function PlanVenue({projection}) {
  const {point} = projection;
  const {arch, safetyCurtain} = VENUE;
  const [lx, ay] = point({x:arch.left,y:arch.y}), [rx] = point({x:arch.right,y:arch.y});
  const [cx1, cy] = point(safetyCurtain.a), [cx2] = point(safetyCurtain.b);
  const [ax, audienceY] = point({x:0,y:-2540});
  return <>
    <polygon className="plan-floor" points={VENUE.floorOutline.map(p=>point(p).join(',')).join(' ')}/>
    {VENUE.wallSegments.map(({a,b},i) => {
      const [x1,y1] = point(a), [x2,y2] = point(b);
      return <line key={i} className="plan-wall" x1={x1} y1={y1} x2={x2} y2={y2}/>;
    })}
    <path className="plan-wall" d={`M${lx-9} ${ay}h9m${rx-lx} 0h9`}><title>Proscenium</title></path>
    <line className="stage-plan-curtain" x1={cx1} y1={cy} x2={cx2} y2={cy}><title>Safety curtain line</title></line>
    <text className="stage-plan-label" x={ax} y={audienceY+11} textAnchor="middle">Auditorium</text>
  </>;
}

export function StagePlan({projection,label,children}) {
  return <svg className="stage-plan" viewBox={projection.viewBox} role="group" aria-label={label}>
    <PlanVenue projection={projection}/>
    {children}
  </svg>;
}

export function MapArea({children,hint}) {
  const [expanded,setExpanded]=useState(false);
  return <div className="map-area" data-expanded={expanded}>
    <div className="map-area-tools"><span>{hint}</span>
      <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Compact map':'Expand map'}</button>
    </div>
    {children}
  </div>;
}

export function MapLabel({name,x=0,y=0}) {
  const label=name.length>20?`${name.slice(0,19)}…`:name;
  return <text className="map-item-label" x={x} y={y-10} textAnchor="middle" aria-hidden="true">{label}</text>;
}

export function SetFootprint({entry,model,projection,selected=false}) {
  const {item,kind}=entry;
  if (kind==='sail') {
    const [[x1,y1],[x2,y2]]=endpoints(model,item).map(projection.point);
    return <line className="set-footprint sail-footprint" data-selected={selected} x1={x1} y1={y1} x2={x2} y2={y2}/>;
  }
  const {width,depth,diameter}=item.dimensions;
  const [x,y]=projection.point(item);
  const w=(width??diameter)*projection.scale,h=(depth??diameter)*projection.scale;
  return item.type==='box'
    ? <rect className="set-footprint" data-selected={selected} x={-w/2} y={-h/2} width={w} height={h}
        transform={`translate(${x} ${y}) rotate(${-item.angle})`}/>
    : <circle className="set-footprint" data-selected={selected} cx={x} cy={y} r={w/2}/>;
}

export function usePlanDrag({onPreview,onCommit,disabled=false}) {
  const drag=useRef(null);
  function finish(event,commit) {
    const current=drag.current;
    if (current?.id!==event.pointerId) return;
    drag.current=null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (commit && !disabled && current.value) onCommit(current.value);
    onPreview(null);
  }
  return (label,project,nudge)=>({
    role:'button', tabIndex:disabled?-1:0, 'aria-label':label, 'aria-disabled':disabled||undefined,
    onPointerDown:event=>{
      if (disabled || event.button!==0 || drag.current) return;
      event.preventDefault();
      const svg=event.currentTarget.ownerSVGElement;
      drag.current={id:event.pointerId,svg,start:svgPoint(svg,event),project,value:null};
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove:event=>{
      const current=drag.current;
      if (disabled || current?.id!==event.pointerId) return;
      const point=svgPoint(current.svg,event);
      const value=current.project(point.x-current.start.x,point.y-current.start.y,event.shiftKey);
      if (value) {current.value=value;onPreview(value);}
    },
    onPointerUp:event=>finish(event,true), onPointerCancel:event=>finish(event,false),
    onLostPointerCapture:event=>finish(event,false),
    onKeyDown:event=>{
      if (disabled) return;
      if (event.key==='Escape' && drag.current) {
        finish({currentTarget:event.currentTarget,pointerId:drag.current.id},false);
        return;
      }
      const dx={ArrowLeft:-1,ArrowRight:1}[event.key]??0;
      const dy={ArrowDown:-1,ArrowUp:1}[event.key]??0;
      if (!dx&&!dy) return;
      event.preventDefault();
      const value=nudge(dx,dy,event.shiftKey);
      if (value) onCommit(value);
    },
  });
}
