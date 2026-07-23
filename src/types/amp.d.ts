import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'amp-auto-ads': any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'amp-auto-ads': any;
    }
  }
}
