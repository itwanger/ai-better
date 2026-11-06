import React from 'react';
import {C} from './index';

/** The approved Hy4 Mac player frame, shared without changing the older video. */
export const MediaWindow: React.FC<{
  left: number;
  top: number;
  width: number;
  contentHeight: number;
  children: React.ReactNode;
}> = ({left, top, width, contentHeight, children}) => (
  <div style={{position: 'absolute', left, top, width, height: contentHeight + 48,
    overflow: 'hidden', borderRadius: 20, boxSizing: 'border-box', background: C.card,
    border: `2px solid ${C.faint}`, boxShadow: `8px 10px 0 ${C.shadow}`}}>
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 44,
      boxSizing: 'border-box', background: C.track, borderBottom: `1px solid ${C.shadow}`,
      display: 'flex', alignItems: 'center', gap: 11, paddingLeft: 20}}>
      {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
        <div key={color} style={{width: 15, height: 15, borderRadius: '50%', background: color}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: 0, top: 44, width: width - 4, height: contentHeight,
      overflow: 'hidden'}}>{children}</div>
  </div>
);
