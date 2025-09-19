/**
 * TipTap Starter Kit Mock
 * Mock for @tiptap/starter-kit extension bundle
 */

const createMockExtension = (name: string) => ({
  name,
  type: 'extension',
  configure: vi.fn().mockReturnThis(),
  extend: vi.fn().mockReturnThis(),
});

const StarterKit = {
  configure: vi.fn().mockReturnValue(createMockExtension('StarterKit')),
};

export default StarterKit;