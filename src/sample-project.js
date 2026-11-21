import {newCharacter} from './characters.js';
import {newFixture} from './lighting.js';
import {emptyModel, newProp} from './model.js';
import {characterChannel, emptyRehearsal, fixtureChannel} from './rehearsal.js';
import {parseScript, scriptClock} from './script.js';

const script = parseScript(`Mara waits beside a small wooden case. Ivo enters from the wing.
MARA: You said we would know it by the sound.
IVO: I thought so. Set it down and listen.
MARA: If we stay here, the station will open around us.
IVO: Or the first train will come and we will still be standing here.
They cross towards each other. The warm light gives way to a blue wash.
MARA: There. Did you hear that one?
IVO: Only the echo.
MARA: Then we have time.
They turn to face the empty track.`);

const model = emptyModel();
const mara = {...newCharacter([]), name:'Mara', x:-1800, y:2800, direction:34};
const ivo = {...newCharacter([mara]), name:'Ivo', x:2500, y:3700, direction:-53, bodyColor:'#b58253'};
model.characters = [mara, ivo];
model.props = [{...newProp(model,'box'), name:'Wooden case', x:-1000, y:3200,
  color:'#936745', dimensions:{width:850,depth:480,height:520}}];

function addLight(type, options) {
  model.lighting.fixtures.push({...newFixture(model,type), ...options});
}
addLight('rj613', {name:'Warm front profile', position:.28, intensity:74, color:'#ffd5ac',
  aim:{x:-950,y:3000,height:900}});
addLight('rama', {name:'Stage fill', bar:'C2', position:.68, intensity:36, color:'#fff0d2',
  aim:{x:1550,y:3500,height:1000}});
addLight('par', {name:'Blue back wash', bar:'C14', position:.52, intensity:12, color:'#789aff',
  aim:{x:450,y:2650,height:800}});
model.lighting.mode = 'theatre';
model.lighting.showCones = false;

const clock = scriptClock(script.lines);
const change = clock.moments[5].start;
const end = clock.snap(change + 3);
const transition = (before, after) => [
  {time:change,value:before,curve:'hold'},
  {time:end,value:after,curve:'linear'},
];
const rehearsal = {
  ...emptyRehearsal(),
  scenes: [
    {moment:script.lines[0].id,title:'The platform'},
    {moment:script.lines[5].id,title:'The echo'},
  ],
  keyframes: {
    [fixtureChannel(1,'level')]: transition(74,22),
    [fixtureChannel(2,'level')]: transition(36,46),
    [fixtureChannel(3,'level')]: transition(12,76),
    [characterChannel(mara.id,'position')]: transition({x:mara.x,y:mara.y},{x:-450,y:2550}),
    [characterChannel(ivo.id,'position')]: transition({x:ivo.x,y:ivo.y},{x:900,y:2900}),
  },
  lightingCues:[{time:change,label:'Blue wash'}],
};

export default {title:'Sample Project · The Waiting Room', model, script, rehearsal, views:[]};
