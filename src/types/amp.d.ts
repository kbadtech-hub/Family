import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'amp-auto-ads': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          type?: string;
          'data-ad-client'?: string;
        },
        HTMLElement
      >;
    }
  }
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    'custom-element'?: string;
  }
}
