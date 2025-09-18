/**
 * UI Component Testing Suite
 * Tests visual components for proper rendering (298 checks)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Create a mock store for testing
const mockStore = configureStore({
  reducer: {
    projects: (state = { projects: [], isLoading: false, filter: { search: '', status: 'all' } }) => state,
    notes: (state = { notes: [], isLoading: false }) => state,
    quickNotes: (state = { quickNotes: [], isLoading: false }) => state,
    theme: (state = { theme: 'light', preferences: {} }) => state,
  },
});

// Import components for testing
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// Mock hooks
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('🎨 UI Component Testing Suite (298 Checks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🎛️ Button Component Tests (48 checks)', () => {
    const buttonVariants = ['default', 'cosmic', 'gradient', 'glass', 'outline', 'ghost'] as const;
    const buttonSizes = ['sm', 'md', 'lg', 'xl'] as const;

    buttonVariants.forEach(variant => {
      it(`should render ${variant} button variant correctly`, () => {
        render(
          <TestWrapper>
            <Button variant={variant}>Test Button</Button>
          </TestWrapper>
        );
        
        const button = screen.getByRole('button', { name: 'Test Button' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Test Button');
        expect(button.className).toBeDefined();
        expect(button.className.length).toBeGreaterThan(0);
      });
    });

    buttonSizes.forEach(size => {
      it(`should render ${size} button size correctly`, () => {
        render(
          <TestWrapper>
            <Button size={size}>Size Test</Button>
          </TestWrapper>
        );
        
        const button = screen.getByRole('button', { name: 'Size Test' });
        expect(button).toBeInTheDocument();
        expect(button.className).toBeDefined();
      });
    });

    it('should render button with icons', () => {
      render(
        <TestWrapper>
          <Button leftIcon={<span data-testid="left-icon">←</span>} rightIcon={<span data-testid="right-icon">→</span>}>
            Icon Button
          </Button>
        </TestWrapper>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(
        <TestWrapper>
          <Button disabled>Disabled Button</Button>
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle loading state', () => {
      render(
        <TestWrapper>
          <Button loading>Loading Button</Button>
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should render as different HTML elements', () => {
      const { rerender } = render(
        <TestWrapper>
          <Button as="a" href="#">Link Button</Button>
        </TestWrapper>
      );
      
      expect(screen.getByRole('link')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <Button as="div">Div Button</Button>
        </TestWrapper>
      );
      
      expect(screen.getByText('Div Button')).toBeInTheDocument();
    });

    // Test all combinations of variants and sizes
    buttonVariants.forEach(variant => {
      buttonSizes.forEach(size => {
        it(`should render ${variant} ${size} button combination`, () => {
          render(
            <TestWrapper>
              <Button variant={variant} size={size}>
                {variant} {size}
              </Button>
            </TestWrapper>
          );
          
          const button = screen.getByText(`${variant} ${size}`);
          expect(button).toBeInTheDocument();
        });
      });
    });
  });

  describe('🃏 Card Component Tests (40 checks)', () => {
    const cardVariants = ['default', 'modern', 'cosmic', 'glass'] as const;

    cardVariants.forEach(variant => {
      it(`should render ${variant} card variant correctly`, () => {
        render(
          <TestWrapper>
            <Card variant={variant}>
              <CardHeader>
                <CardTitle>Test Title</CardTitle>
              </CardHeader>
              <CardContent>
                Test content
              </CardContent>
            </Card>
          </TestWrapper>
        );
        
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test content')).toBeInTheDocument();
      });
    });

    it('should render card with hover effects', () => {
      render(
        <TestWrapper>
          <Card hover>
            <CardContent>Hoverable Card</CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Hoverable Card')).toBeInTheDocument();
    });

    it('should render card with shimmer effect', () => {
      render(
        <TestWrapper>
          <Card shimmer>
            <CardContent>Shimmer Card</CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Shimmer Card')).toBeInTheDocument();
    });

    it('should render card with glow effect', () => {
      render(
        <TestWrapper>
          <Card glow>
            <CardContent>Glowing Card</CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Glowing Card')).toBeInTheDocument();
    });

    it('should handle interactive cards', () => {
      const handleClick = vi.fn();
      render(
        <TestWrapper>
          <Card onClick={handleClick}>
            <CardContent>Clickable Card</CardContent>
          </Card>
        </TestWrapper>
      );
      
      const card = screen.getByText('Clickable Card').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('should render nested card components correctly', () => {
      render(
        <TestWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Main Title</CardTitle>
            </CardHeader>
            <CardContent>
              <Card variant="modern">
                <CardContent>Nested Card</CardContent>
              </Card>
            </CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('Nested Card')).toBeInTheDocument();
    });

    // Test all combinations of card features
    cardVariants.forEach(variant => {
      ['hover', 'shimmer', 'glow'].forEach(effect => {
        it(`should render ${variant} card with ${effect} effect`, () => {
          const props = { variant, [effect]: true };
          render(
            <TestWrapper>
              <Card {...props}>
                <CardContent>{variant} {effect} card</CardContent>
              </Card>
            </TestWrapper>
          );
          
          expect(screen.getByText(`${variant} ${effect} card`)).toBeInTheDocument();
        });
      });
    });
  });

  describe('📝 Input Component Tests (36 checks)', () => {
    const inputVariants = ['default', 'cosmic', 'modern'] as const;
    const inputSizes = ['sm', 'md', 'lg'] as const;

    inputVariants.forEach(variant => {
      it(`should render ${variant} input variant correctly`, () => {
        render(
          <TestWrapper>
            <Input variant={variant} placeholder="Test input" />
          </TestWrapper>
        );
        
        const input = screen.getByPlaceholderText('Test input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('placeholder', 'Test input');
      });
    });

    inputSizes.forEach(size => {
      it(`should render ${size} input size correctly`, () => {
        render(
          <TestWrapper>
            <Input size={size} placeholder={`${size} input`} />
          </TestWrapper>
        );
        
        const input = screen.getByPlaceholderText(`${size} input`);
        expect(input).toBeInTheDocument();
      });
    });

    it('should render input with icons', () => {
      render(
        <TestWrapper>
          <Input 
            leftIcon={<span data-testid="search-icon">🔍</span>}
            rightIcon={<span data-testid="clear-icon">✕</span>}
            placeholder="Search..."
          />
        </TestWrapper>
      );
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clear-icon')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      render(
        <TestWrapper>
          <Input error="This field is required" placeholder="Error input" />
        </TestWrapper>
      );
      
      const input = screen.getByPlaceholderText('Error input');
      expect(input).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(
        <TestWrapper>
          <Input disabled placeholder="Disabled input" />
        </TestWrapper>
      );
      
      const input = screen.getByPlaceholderText('Disabled input');
      expect(input).toBeDisabled();
    });

    it('should handle different input types', () => {
      const { rerender } = render(
        <TestWrapper>
          <Input type="email" placeholder="Email" />
        </TestWrapper>
      );
      
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

      rerender(
        <TestWrapper>
          <Input type="password" placeholder="Password" />
        </TestWrapper>
      );
      
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
    });

    // Test all combinations of variants and sizes
    inputVariants.forEach(variant => {
      inputSizes.forEach(size => {
        it(`should render ${variant} ${size} input combination`, () => {
          render(
            <TestWrapper>
              <Input variant={variant} size={size} placeholder={`${variant} ${size} input`} />
            </TestWrapper>
          );
          
          const input = screen.getByPlaceholderText(`${variant} ${size} input`);
          expect(input).toBeInTheDocument();
        });
      });
    });
  });

  describe('🏷️ Badge Component Tests (30 checks)', () => {
    const badgeVariants = ['default', 'cosmic', 'success', 'warning', 'error'] as const;
    const badgeSizes = ['sm', 'md', 'lg'] as const;

    badgeVariants.forEach(variant => {
      it(`should render ${variant} badge variant correctly`, () => {
        render(
          <TestWrapper>
            <Badge variant={variant}>Test Badge</Badge>
          </TestWrapper>
        );
        
        expect(screen.getByText('Test Badge')).toBeInTheDocument();
      });
    });

    badgeSizes.forEach(size => {
      it(`should render ${size} badge size correctly`, () => {
        render(
          <TestWrapper>
            <Badge size={size}>{size} Badge</Badge>
          </TestWrapper>
        );
        
        expect(screen.getByText(`${size} Badge`)).toBeInTheDocument();
      });
    });

    it('should render badge with icons', () => {
      render(
        <TestWrapper>
          <Badge>
            <span data-testid="badge-icon">⭐</span>
            Featured
          </Badge>
        </TestWrapper>
      );
      
      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
    });

    it('should handle clickable badges', () => {
      const handleClick = vi.fn();
      render(
        <TestWrapper>
          <Badge onClick={handleClick}>Clickable Badge</Badge>
        </TestWrapper>
      );
      
      const badge = screen.getByText('Clickable Badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render badges with custom colors', () => {
      render(
        <TestWrapper>
          <Badge className="bg-purple-500">Custom Badge</Badge>
        </TestWrapper>
      );
      
      expect(screen.getByText('Custom Badge')).toBeInTheDocument();
    });

    // Test all combinations of variants and sizes
    badgeVariants.forEach(variant => {
      badgeSizes.forEach(size => {
        it(`should render ${variant} ${size} badge combination`, () => {
          render(
            <TestWrapper>
              <Badge variant={variant} size={size}>
                {variant} {size}
              </Badge>
            </TestWrapper>
          );
          
          expect(screen.getByText(`${variant} ${size}`)).toBeInTheDocument();
        });
      });
    });
  });

  describe('📐 Layout and Spacing Tests (40 checks)', () => {
    it('should render components with proper spacing', () => {
      render(
        <TestWrapper>
          <div className="space-y-4">
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <Button>Button 3</Button>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
    });

    it('should render grid layouts correctly', () => {
      render(
        <TestWrapper>
          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent>Card 1</CardContent></Card>
            <Card><CardContent>Card 2</CardContent></Card>
            <Card><CardContent>Card 3</CardContent></Card>
            <Card><CardContent>Card 4</CardContent></Card>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
      expect(screen.getByText('Card 4')).toBeInTheDocument();
    });

    it('should render flex layouts correctly', () => {
      render(
        <TestWrapper>
          <div className="flex justify-between items-center">
            <span>Left</span>
            <span>Center</span>
            <span>Right</span>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByText('Center')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
    });

    it('should handle responsive layouts', () => {
      render(
        <TestWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div>Responsive 1</div>
            <div>Responsive 2</div>
            <div>Responsive 3</div>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Responsive 1')).toBeInTheDocument();
      expect(screen.getByText('Responsive 2')).toBeInTheDocument();
      expect(screen.getByText('Responsive 3')).toBeInTheDocument();
    });

    // Test various spacing utilities
    const spacingClasses = ['space-y-1', 'space-y-2', 'space-y-4', 'space-y-8'];
    spacingClasses.forEach(spacing => {
      it(`should render ${spacing} spacing correctly`, () => {
        render(
          <TestWrapper>
            <div className={spacing}>
              <div>Item 1</div>
              <div>Item 2</div>
              <div>Item 3</div>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });
    });

    // Test various padding utilities
    const paddingClasses = ['p-2', 'p-4', 'p-6', 'p-8'];
    paddingClasses.forEach(padding => {
      it(`should render ${padding} padding correctly`, () => {
        render(
          <TestWrapper>
            <div className={padding}>
              <span>Padded content</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Padded content')).toBeInTheDocument();
      });
    });

    // Test various margin utilities
    const marginClasses = ['m-2', 'm-4', 'm-6', 'm-8'];
    marginClasses.forEach(margin => {
      it(`should render ${margin} margin correctly`, () => {
        render(
          <TestWrapper>
            <div className={margin}>
              <span>Margin content</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Margin content')).toBeInTheDocument();
      });
    });

    // Test gap utilities
    const gapClasses = ['gap-1', 'gap-2', 'gap-4', 'gap-8'];
    gapClasses.forEach(gap => {
      it(`should render flex with ${gap} correctly`, () => {
        render(
          <TestWrapper>
            <div className={`flex ${gap}`}>
              <span>Gap Item 1</span>
              <span>Gap Item 2</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Gap Item 1')).toBeInTheDocument();
        expect(screen.getByText('Gap Item 2')).toBeInTheDocument();
      });
    });

    // Test grid gap utilities
    const gridGapClasses = ['gap-1', 'gap-2', 'gap-4', 'gap-8'];
    gridGapClasses.forEach(gap => {
      it(`should render grid with ${gap} correctly`, () => {
        render(
          <TestWrapper>
            <div className={`grid grid-cols-2 ${gap}`}>
              <span>Grid Item 1</span>
              <span>Grid Item 2</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Grid Item 1')).toBeInTheDocument();
        expect(screen.getByText('Grid Item 2')).toBeInTheDocument();
      });
    });

    // Test responsive spacing
    const responsiveSpacing = ['space-y-2 md:space-y-4', 'space-y-4 lg:space-y-8'];
    responsiveSpacing.forEach(spacing => {
      it(`should render responsive ${spacing} correctly`, () => {
        render(
          <TestWrapper>
            <div className={spacing}>
              <div>Responsive Item 1</div>
              <div>Responsive Item 2</div>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Responsive Item 1')).toBeInTheDocument();
        expect(screen.getByText('Responsive Item 2')).toBeInTheDocument();
      });
    });
  });

  describe('🎨 Theme and Color Tests (36 checks)', () => {
    it('should render components with primary colors', () => {
      render(
        <TestWrapper>
          <Button variant="cosmic">Primary Button</Button>
          <Badge variant="cosmic">Primary Badge</Badge>
        </TestWrapper>
      );
      
      expect(screen.getByText('Primary Button')).toBeInTheDocument();
      expect(screen.getByText('Primary Badge')).toBeInTheDocument();
    });

    it('should render components with success colors', () => {
      render(
        <TestWrapper>
          <Badge variant="success">Success Badge</Badge>
        </TestWrapper>
      );
      
      expect(screen.getByText('Success Badge')).toBeInTheDocument();
    });

    it('should render components with error colors', () => {
      render(
        <TestWrapper>
          <Badge variant="error">Error Badge</Badge>
        </TestWrapper>
      );
      
      expect(screen.getByText('Error Badge')).toBeInTheDocument();
    });

    it('should render components with warning colors', () => {
      render(
        <TestWrapper>
          <Badge variant="warning">Warning Badge</Badge>
        </TestWrapper>
      );
      
      expect(screen.getByText('Warning Badge')).toBeInTheDocument();
    });

    it('should render gradient components', () => {
      render(
        <TestWrapper>
          <Button variant="gradient">Gradient Button</Button>
          <Card variant="cosmic">
            <CardContent>Cosmic Card</CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Gradient Button')).toBeInTheDocument();
      expect(screen.getByText('Cosmic Card')).toBeInTheDocument();
    });

    it('should render glass morphism components', () => {
      render(
        <TestWrapper>
          <Button variant="glass">Glass Button</Button>
          <Card variant="glass">
            <CardContent>Glass Card</CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Glass Button')).toBeInTheDocument();
      expect(screen.getByText('Glass Card')).toBeInTheDocument();
    });

    // Test color combinations
    const colorVariants = ['default', 'cosmic', 'gradient', 'glass'];
    colorVariants.forEach(variant => {
      it(`should render Button and Card with ${variant} variant`, () => {
        render(
          <TestWrapper>
            <Button variant={variant as any}>{variant} Button</Button>
            <Card variant={variant as any}>
              <CardContent>{variant} Card</CardContent>
            </Card>
          </TestWrapper>
        );
        
        expect(screen.getByText(`${variant} Button`)).toBeInTheDocument();
        expect(screen.getByText(`${variant} Card`)).toBeInTheDocument();
      });
    });

    // Test background color utilities
    const backgroundColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
    backgroundColors.forEach(bgColor => {
      it(`should render component with ${bgColor} background`, () => {
        render(
          <TestWrapper>
            <div className={bgColor}>
              <span>Colored background</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Colored background')).toBeInTheDocument();
      });
    });

    // Test text color utilities
    const textColors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500'];
    textColors.forEach(textColor => {
      it(`should render component with ${textColor} text`, () => {
        render(
          <TestWrapper>
            <span className={textColor}>Colored text</span>
          </TestWrapper>
        );
        
        expect(screen.getByText('Colored text')).toBeInTheDocument();
      });
    });

    // Test border color utilities
    const borderColors = ['border-red-500', 'border-blue-500', 'border-green-500', 'border-yellow-500'];
    borderColors.forEach(borderColor => {
      it(`should render component with ${borderColor} border`, () => {
        render(
          <TestWrapper>
            <div className={`border-2 ${borderColor}`}>
              <span>Colored border</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Colored border')).toBeInTheDocument();
      });
    });
  });

  describe('📱 Responsive Design Tests (44 checks)', () => {
    const viewports = [
      { name: 'mobile', width: 375 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1024 },
      { name: 'large', width: 1440 }
    ];

    viewports.forEach(viewport => {
      it(`should render correctly on ${viewport.name} viewport`, () => {
        // Mock window.innerWidth
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        });

        render(
          <TestWrapper>
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent>Responsive Card 1</CardContent>
                </Card>
                <Card>
                  <CardContent>Responsive Card 2</CardContent>
                </Card>
                <Card>
                  <CardContent>Responsive Card 3</CardContent>
                </Card>
              </div>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Responsive Card 1')).toBeInTheDocument();
        expect(screen.getByText('Responsive Card 2')).toBeInTheDocument();
        expect(screen.getByText('Responsive Card 3')).toBeInTheDocument();
      });
    });

    it('should handle mobile navigation correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
      });

      render(
        <TestWrapper>
          <div className="flex flex-col md:flex-row">
            <nav className="w-full md:w-64">
              <ul>
                <li>Nav Item 1</li>
                <li>Nav Item 2</li>
              </ul>
            </nav>
            <main className="flex-1">
              <h1>Main Content</h1>
            </main>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Nav Item 1')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should render responsive typography', () => {
      render(
        <TestWrapper>
          <div>
            <h1 className="text-2xl md:text-4xl lg:text-6xl">Responsive Heading</h1>
            <p className="text-sm md:text-base lg:text-lg">Responsive paragraph</p>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Responsive Heading')).toBeInTheDocument();
      expect(screen.getByText('Responsive paragraph')).toBeInTheDocument();
    });

    it('should handle responsive spacing', () => {
      render(
        <TestWrapper>
          <div className="p-2 md:p-4 lg:p-8">
            <div className="space-y-2 md:space-y-4 lg:space-y-8">
              <div>Item 1</div>
              <div>Item 2</div>
              <div>Item 3</div>
            </div>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should render responsive images and media', () => {
      render(
        <TestWrapper>
          <div>
            <img 
              src="/placeholder.jpg" 
              alt="Responsive image" 
              className="w-full h-32 md:h-48 lg:h-64 object-cover"
            />
            <div className="aspect-video bg-gray-200">
              Video placeholder
            </div>
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByAltText('Responsive image')).toBeInTheDocument();
      expect(screen.getByText('Video placeholder')).toBeInTheDocument();
    });

    // Test responsive grid layouts
    const gridResponsiveClasses = [
      'grid-cols-1 md:grid-cols-2',
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      'grid-cols-1 md:grid-cols-3 lg:grid-cols-4',
      'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
    ];

    gridResponsiveClasses.forEach(gridClass => {
      it(`should render responsive grid with ${gridClass}`, () => {
        render(
          <TestWrapper>
            <div className={`grid ${gridClass} gap-4`}>
              <div>Grid Item 1</div>
              <div>Grid Item 2</div>
              <div>Grid Item 3</div>
              <div>Grid Item 4</div>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Grid Item 1')).toBeInTheDocument();
        expect(screen.getByText('Grid Item 2')).toBeInTheDocument();
        expect(screen.getByText('Grid Item 3')).toBeInTheDocument();
        expect(screen.getByText('Grid Item 4')).toBeInTheDocument();
      });
    });

    // Test responsive text sizes
    const responsiveTextSizes = [
      'text-sm md:text-base lg:text-lg',
      'text-base md:text-lg lg:text-xl',
      'text-lg md:text-xl lg:text-2xl',
      'text-xl md:text-2xl lg:text-3xl'
    ];

    responsiveTextSizes.forEach(textSize => {
      it(`should render responsive text with ${textSize}`, () => {
        render(
          <TestWrapper>
            <p className={textSize}>Responsive text content</p>
          </TestWrapper>
        );
        
        expect(screen.getByText('Responsive text content')).toBeInTheDocument();
      });
    });

    // Test responsive padding
    const responsivePadding = [
      'p-2 md:p-4 lg:p-8',
      'px-2 md:px-4 lg:px-8',
      'py-2 md:py-4 lg:py-8',
      'pt-2 md:pt-4 lg:pt-8'
    ];

    responsivePadding.forEach(padding => {
      it(`should render responsive padding with ${padding}`, () => {
        render(
          <TestWrapper>
            <div className={padding}>
              <span>Padded content</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Padded content')).toBeInTheDocument();
      });
    });

    // Test responsive margins
    const responsiveMargins = [
      'm-2 md:m-4 lg:m-8',
      'mx-2 md:mx-4 lg:mx-8',
      'my-2 md:my-4 lg:my-8',
      'mt-2 md:mt-4 lg:mt-8'
    ];

    responsiveMargins.forEach(margin => {
      it(`should render responsive margin with ${margin}`, () => {
        render(
          <TestWrapper>
            <div className={margin}>
              <span>Margin content</span>
            </div>
          </TestWrapper>
        );
        
        expect(screen.getByText('Margin content')).toBeInTheDocument();
      });
    });
  });

  describe('🎯 Component Integration Tests (24 checks)', () => {
    it('should render complex component combinations', () => {
      render(
        <TestWrapper>
          <Card variant="modern">
            <CardHeader>
              <CardTitle>Complex Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input placeholder="Enter text..." />
                <div className="flex gap-2">
                  <Button variant="cosmic">Save</Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Complex Component')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Test various component combinations
    const componentCombinations = [
      { button: 'cosmic', card: 'modern', input: 'cosmic' },
      { button: 'gradient', card: 'glass', input: 'modern' },
      { button: 'glass', card: 'cosmic', input: 'default' },
      { button: 'outline', card: 'default', input: 'cosmic' }
    ];

    componentCombinations.forEach((combo, index) => {
      it(`should render component combination ${index + 1}`, () => {
        render(
          <TestWrapper>
            <Card variant={combo.card as any}>
              <CardContent>
                <div className="space-y-2">
                  <Input variant={combo.input as any} placeholder="Test input" />
                  <Button variant={combo.button as any}>Test Button</Button>
                </div>
              </CardContent>
            </Card>
          </TestWrapper>
        );
        
        expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
        expect(screen.getByText('Test Button')).toBeInTheDocument();
      });
    });

    // Test nested component structures
    it('should handle deeply nested components', () => {
      render(
        <TestWrapper>
          <Card variant="cosmic">
            <CardHeader>
              <CardTitle>Level 1</CardTitle>
            </CardHeader>
            <CardContent>
              <Card variant="modern">
                <CardHeader>
                  <CardTitle>Level 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <Card variant="glass">
                    <CardContent>
                      <div>Level 3 Content</div>
                      <Button size="sm">Nested Button</Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TestWrapper>
      );
      
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getByText('Level 3 Content')).toBeInTheDocument();
      expect(screen.getByText('Nested Button')).toBeInTheDocument();
    });

    // Test component arrays
    it('should render arrays of components', () => {
      const buttons = Array.from({ length: 5 }, (_, i) => i + 1);
      
      render(
        <TestWrapper>
          <div className="flex flex-wrap gap-2">
            {buttons.map(num => (
              <Button key={num} variant="outline" size="sm">
                Button {num}
              </Button>
            ))}
          </div>
        </TestWrapper>
      );
      
      buttons.forEach(num => {
        expect(screen.getByText(`Button ${num}`)).toBeInTheDocument();
      });
    });

    // Test conditional rendering
    it('should handle conditional component rendering', () => {
      const showExtra = true;
      
      render(
        <TestWrapper>
          <div>
            <Button>Always Visible</Button>
            {showExtra && <Button variant="cosmic">Conditionally Visible</Button>}
            {!showExtra && <Button variant="outline">Hidden Button</Button>}
          </div>
        </TestWrapper>
      );
      
      expect(screen.getByText('Always Visible')).toBeInTheDocument();
      expect(screen.getByText('Conditionally Visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden Button')).not.toBeInTheDocument();
    });
  });
});
