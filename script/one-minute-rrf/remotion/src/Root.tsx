import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Chapter1} from './Chapter1';
import {CHAPTERS} from '../../build/cues';
import project from '../../project.json';

const TOTAL = CHAPTERS[0].endFrame;

const Root: React.FC = () => (
  <>
    <Composition id={project.compositionId} component={Chapter1} durationInFrames={TOTAL} {...project.config.video} />
    <Composition id="Chapter1Preview" component={Chapter1} durationInFrames={TOTAL} {...project.config.video} />
  </>
);

registerRoot(Root);
