import React, {useLayoutEffect,useRef,useState} from 'react';
import {formatTime} from './script.js';
import {writeCueSheet} from './lighting-export.js';
import {isLightingCueNumber} from './rehearsal.js';
import './lighting-export.css';

function describeCue(row, previous) {
  if (!previous) return 'Preset';
  const entries=Object.entries(row.levels);
  const increases=entries.some(([id,level])=>level>previous.levels[id]);
  const decreases=entries.some(([id,level])=>level<previous.levels[id]);
  if (!increases&&!decreases) return 'Hold';
  if (increases&&decreases&&row.up===row.down) return row.up===0?'Instant change':`${row.up} s crossfade`;
  return [increases&&(row.up===0?'Brighten instantly':`Brighten over ${row.up} s`),
    decreases&&(row.down===0?'Dim instantly':`Dim over ${row.down} s`)].filter(Boolean).join(' · ');
}

export function LightingExportDialog({fixtures,cues,omitted,onClose,onReview,onRestoreGo,onDownload}) {
  const dialog = useRef(null);
  const [edits,setEdits] = useState({});
  const rows = cues.map(cue => {
    const edit=edits[cue.id];
    const choices=Object.entries(cue.sharedFadeChoices??{});
    const unresolved=cue.issues.length>0&&(!choices.length||choices.some(([direction,options])=>!options.includes(edit?.[direction])));
    return {...cue,number:String(cue.number),...edit,choices,unresolved};
  });
  const validNumbers = rows.every((row,index) => /^(?:\d{1,4})(?:\.\d{1,2})?$/.test(row.number) &&
    isLightingCueNumber(Number(row.number)) && (index === 0 || Number(row.number)>Number(rows[index-1].number)));
  const conflicts = rows.some(row=>row.unresolved);
  const canExport = fixtures.length > 0 && validNumbers && !conflicts;

  useLayoutEffect(()=>{dialog.current.showModal();},[]);

  function updateCue(id,field,value) {
    setEdits(current=>({...current,[id]:{...current[id],[field]:value}}));
  }
  function download(event) {
    event.preventDefault();
    if (!canExport) return;
    const ready = rows.map(row => ({...row,number:Number(row.number)}));
    const numbers = Object.fromEntries(ready.map(({id,number})=>[id,number]));
    onDownload(writeCueSheet(ready,fixtures),numbers);
  }

  return <dialog className="lighting-export-dialog" ref={dialog} aria-labelledby="lighting-export-title"
    onCancel={event=>{event.preventDefault();onClose();}}>
    <form onSubmit={download}>
      <header><h2 id="lighting-export-title">Export cue sheet</h2><button type="button" onClick={onClose}>Close</button></header>
      <div className="lighting-export-body">
        <p>Each row is a manual GO. Levels are shown as percentages.</p>
        {fixtures.length===0 && <p>Add a fixture to export lighting cues.</p>}
        <h3>Cue preview</h3>
        <div className="lighting-export-table" tabIndex={0} aria-label="Cue preview">
          <table>
            <thead><tr><th>GO time</th><th>Cue</th><th>Label</th><th>Transition</th><th>Intensity</th></tr></thead>
            <tbody>{rows.map((row,index)=><React.Fragment key={row.id}>
              <tr>
                <td>{index===0 ? 'Opening' : formatTime(row.time)}</td>
                <td><input aria-label={`Cue number, row ${index+1}`} inputMode="decimal" value={row.number} required
                  onChange={event=>updateCue(row.id,'number',event.target.value)}/></td>
                <td>{row.label}</td>
                <td>{row.unresolved?'Needs review':describeCue(row,rows[index-1])}</td>
                <td>{fixtures.map(({id,name})=><span key={id}>{name.trim()||`L${id}`} {Math.round(row.levels[id])}%</span>)}</td>
              </tr>
              {row.issues.length>0 && <tr><td colSpan={5}>
                <p className={row.unresolved?'field-error':undefined}>{row.issues.join(' ')}</p>
                {row.choices.map(([direction,options])=><label className="shared-export-fades" key={direction}>
                  <span>{direction==='up'?'Lights getting brighter':'Lights getting dimmer'}</span>
                  <select required aria-label={`${direction==='up'?'Shared brighten time':'Shared dim time'} for cue ${row.number}`}
                    value={edits[row.id]?.[direction]??''} onChange={event=>updateCue(row.id,direction,Number(event.target.value))}>
                    <option value="" disabled>Choose an export time</option>
                    {options.map(value=><option key={value} value={value}>{value===0?'Instant':`${value} seconds`}</option>)}
                  </select>
                </label>)}
                {row.choices.length>0&&<p className="small-note">This choice applies to this export.</p>}
                <button type="button" onClick={()=>onReview(row.time)}>Review in timeline</button>
              </td></tr>}
            </React.Fragment>)}</tbody>
          </table>
        </div>
        {!validNumbers&&<p className="field-error" role="alert">Use ascending cue numbers with up to two decimal places.</p>}
        {conflicts&&<p className="field-error" role="alert">Resolve the flagged cue timings before exporting.</p>}
        {omitted.length>0&&<section>
          <h3>Removed GOs</h3>
          <p>These dimmer changes are omitted from the export.</p>
          {omitted.map(time=><button key={time} type="button" onClick={()=>onRestoreGo(time)}>Restore GO at {formatTime(time)}</button>)}
        </section>}
        <p className="small-note">Downloading saves cue numbers to the project. The sheet covers intensity cues.</p>
      </div>
      <footer><button className="primary" type="submit" disabled={!canExport}>Download CSV</button></footer>
    </form>
  </dialog>;
}
