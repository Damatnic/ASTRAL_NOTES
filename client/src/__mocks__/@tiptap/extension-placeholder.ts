/**
 * TipTap Placeholder Extension Mock
 */

const Placeholder = {
  configure: vi.fn().mockReturnValue({
    name: 'placeholder',
    type: 'extension',
  }),
};

export default Placeholder;