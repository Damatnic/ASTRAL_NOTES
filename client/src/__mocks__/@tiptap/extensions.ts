/**
 * TipTap Extensions Mock
 * Generic mock factory for all TipTap extensions
 */

const createMockExtension = (name: string) => ({
  name,
  type: 'extension',
  configure: vi.fn().mockReturnThis(),
  extend: vi.fn().mockReturnThis(),
});

// Export individual extension mocks
export const Placeholder = {
  configure: vi.fn().mockReturnValue(createMockExtension('Placeholder')),
};

export const CharacterCount = createMockExtension('CharacterCount');
export const Focus = createMockExtension('Focus');
export const Typography = createMockExtension('Typography');
export const Link = {
  configure: vi.fn().mockReturnValue(createMockExtension('Link')),
};
export const Image = createMockExtension('Image');
export const Table = createMockExtension('Table');
export const TableRow = createMockExtension('TableRow');
export const TableHeader = createMockExtension('TableHeader');
export const TableCell = createMockExtension('TableCell');
export const Highlight = createMockExtension('Highlight');
export const CodeBlockLowlight = createMockExtension('CodeBlockLowlight');
export const TextStyle = createMockExtension('TextStyle');
export const Color = createMockExtension('Color');
export const TextAlign = {
  configure: vi.fn().mockReturnValue(createMockExtension('TextAlign')),
};
export const ListItem = createMockExtension('ListItem');
export const TaskList = createMockExtension('TaskList');
export const TaskItem = createMockExtension('TaskItem');
export const Underline = createMockExtension('Underline');
export const Subscript = createMockExtension('Subscript');
export const Superscript = createMockExtension('Superscript');
export const FontFamily = createMockExtension('FontFamily');