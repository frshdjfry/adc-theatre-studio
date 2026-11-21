# ADC Theatre Studio

An independent rehearsal and stage design editor for the ADC Theatre auditorium in Cambridge. [Open ADC Theatre Studio](https://frshdjfry.github.io/adc-theatre-studio/).

Open the project selector to create a blank project, or explore *The Waiting Room*, the built-in demo. Set, Lighting, and Blocking each have a timeline and a matching editor. Use the front, middle, and rear audience views to check sightlines. Space plays or pauses the timeline.

Projects save in the current browser. Use the project menu to export a JSON backup or import an ADC project. The Lighting panel exports a cue sheet CSV with GO times, fade times, and intensity values.

## Venue model

The [ADC stage technical specification](https://www.adctheatre.com/media/7259/stage-tech-spec.pdf) supplies the clear 6,550 × 3,810 mm proscenium opening and the 8,400 mm depth from safety curtain to back wall. The [stage plan and section](https://www.adctheatre.com/media/5027/adc-a1.pdf), maintained by Eddy Langley, supply the simplified wings, flat forestage, auditorium rake, and plan positions of Bridges 1 and 2 and counterweight lines C2, C8, C14, and C20. The wider structural opening shown on the plan differs from the clear opening in the technical specification.

Plan coordinates are in millimetres. The origin is the stage centreline at the safety curtain. Positive X points towards prompt side and positive Y points upstage. Seats are a simplified model for sightlines, with the default rear viewpoint anchored to the published 13.25 m distance from flat forestage and +2.9 m eye height. The theatre's [lantern list](https://www.adctheatre.com/media/7544/lantern-list.pdf) and [standard frontwash](https://www.adctheatre.com/media/4743/standard-frontwash.pdf) supply the fixture choices. Bridge heights and overstage flying trims are preview estimates, as are sail suspension points and beam rendering. The model uses the flat forestage configuration.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
```

The GitHub Pages workflow tests and builds with the configured repository base path on pushes to `main`.
