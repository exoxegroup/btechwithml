import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock D3.js transitions for testing
vi.mock('d3-transition', () => ({
  transition: () => ({
    duration: () => ({ 
      attr: () => ({ 
        style: () => ({ 
          text: () => ({ 
            end: () => {} 
          }) 
        }) 
      }) 
    }),
    attr: () => ({ 
      style: () => ({ 
        text: () => ({ 
          end: () => {} 
        }) 
      }) 
    }),
    style: () => ({ 
      text: () => ({ 
        end: () => {} 
      }) 
    }),
    text: () => ({ 
      end: () => {} 
    })
  })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};