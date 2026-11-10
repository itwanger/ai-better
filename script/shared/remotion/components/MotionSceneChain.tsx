import React from 'react';
import {Sequence, useCurrentFrame} from 'remotion';
import {SceneChain, SceneEntry} from './Scenes';

const move = (frame: number, start: number, duration: number) => {
  const t = Math.max(0, Math.min(1, (frame - start) / duration));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export type MotionKind = 'rise' | 'turn' | 'push';
const transforms = (kind: MotionKind, p: number, incoming: boolean): string => {
  const distance = incoming ? 1 - p : -p;
  if (kind === 'rise') {
    return `translateY(${distance * 820}px) translateZ(${-Math.abs(distance) * 300}px)
      rotateX(${-distance * 16}deg)`;
  }
  if (kind === 'turn') {
    return `translateX(${distance * 1940}px) translateZ(${-Math.abs(distance) * 260}px)
      rotateY(${distance * 24}deg)`;
  }
  return incoming
    ? `translateX(${-26 * (1 - p)}px) translateY(${18 * (1 - p)}px) scale(${0.38 + p * 0.62})`
    : `scale(${1 + p * 0.12})`;
};

export const MotionPlane: React.FC<{
  frame: number;
  enter?: {at: number; duration: number; kind: MotionKind};
  exit?: {at: number; duration: number; kind: MotionKind};
  children: React.ReactNode;
}> = ({frame, enter, exit, children}) => {
  const entering = enter && frame < enter.at + enter.duration;
  const leaving = exit && frame >= exit.at;
  const motion = leaving ? exit : entering ? enter : undefined;
  const p = motion ? move(frame, motion.at, motion.duration) : 0;
  // Keep the incoming recording opaque; crossfading it would ghost UI text over the bird.
  const opacity = motion?.kind === 'push' && leaving ? 1 - p : 1;
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: '960px 504px'}}>
      <div style={{position: 'absolute', inset: 0, opacity, transformOrigin: '960px 504px',
        transform: motion ? transforms(motion.kind, p, !leaving) : 'none'}}>
        {children}
      </div>
    </div>
  );
};

type Handoff = {at: number; duration: number; kind: MotionKind};

// Hold the outgoing shot on its last frame while the incoming shot follows its own narration.
export function MotionHandoffs({frame, handoffs, draw, clipPath}: {
  frame: number; handoffs: readonly Handoff[]; draw: (frame: number) => React.ReactNode; clipPath: string;
}) {
  const nextIndex=handoffs.findIndex(h=>h.at>frame);
  const currentIndex=(nextIndex<0 ? handoffs.length : nextIndex)-1;
  const current=handoffs[currentIndex];
  const moving=current && frame<current.at+current.duration;
  return <div style={{position:'absolute',inset:0,clipPath:moving ? clipPath : 'none'}}>
    {moving && <MotionPlane key={currentIndex-1} frame={frame} exit={current}>
      {draw(current.at-1)}
    </MotionPlane>}
    <MotionPlane key={currentIndex} frame={frame} enter={current}>{draw(frame)}</MotionPlane>
  </div>;
}

export type SceneTransition = {kind: MotionKind; duration: number};

/** Selected scene boundaries move; scene-local clocks and total duration never change. */
export const MotionSceneChain: React.FC<{
  scenes: SceneEntry[];
  totalFrames: number;
  transitions: Record<number, SceneTransition>;
  enabled?: boolean;
}> = ({scenes, totalFrames, transitions, enabled = true}) => {
  const frame = useCurrentFrame();
  if (!enabled) return <SceneChain scenes={scenes} totalFrames={totalFrames} />;
  return <>
    {scenes.map(([from, Scene], i) => {
      const until = i + 1 < scenes.length ? scenes[i + 1][0] : totalFrames;
      const entry = transitions[from];
      const next = transitions[until];
      const extra = next ? Math.min(next.duration, totalFrames - until) : 0;
      const enter = entry ? {...entry, at: from} : undefined;
      const exit = next ? {...next, at: until} : undefined;
      const moving = (enter && frame < from + enter.duration) || (exit && frame >= until);
      return <Sequence key={from} from={from} durationInFrames={until - from + extra} layout="none">
        <div style={{position: 'absolute', inset: 0,
          clipPath: moving ? 'inset(134px 0 190px 0)' : undefined}}>
          <MotionPlane frame={frame} enter={enter} exit={exit}><Scene /></MotionPlane>
        </div>
      </Sequence>;
    })}
  </>;
};
