/**
 * Wiki Link Extension for TipTap
 * Handles [[wiki-style]] links with auto-completion and link resolution
 */

import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import Suggestion from '@tiptap/suggestion';

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
  linkClass?: string;
  onLinkClick?: (link: string) => void;
  getSuggestions?: (query: string) => Promise<any[]>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (attributes: { href: string; title?: string }) => ReturnType;
      toggleWikiLink: (attributes: { href: string; title?: string }) => ReturnType;
      unsetWikiLink: () => ReturnType;
    };
  }
}

export const WikiLinkExtension = Mark.create<WikiLinkOptions>({
  name: 'wikiLink',

  priority: 1000,

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
      linkClass: 'wiki-link text-cosmic-600 hover:text-cosmic-700 underline decoration-dotted cursor-pointer',
      onLinkClick: undefined,
      getSuggestions: undefined,
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: element => element.getAttribute('data-wiki-link'),
        renderHTML: attributes => {
          if (!attributes.href) {
            return {};
          }
          return {
            'data-wiki-link': attributes.href,
            class: this.options.linkClass,
          };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          if (!attributes.title) {
            return {};
          }
          return {
            title: attributes.title,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wiki-link]',
        getAttrs: element => {
          const href = (element as HTMLElement).getAttribute('data-wiki-link');
          const title = (element as HTMLElement).getAttribute('title');
          return { href, title };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setWikiLink: attributes => ({ chain }) => {
        return chain()
          .setMark(this.name, attributes)
          .run();
      },

      toggleWikiLink: attributes => ({ chain }) => {
        return chain()
          .toggleMark(this.name, attributes)
          .run();
      },

      unsetWikiLink: () => ({ chain }) => {
        return chain()
          .unsetMark(this.name)
          .run();
      },
    };
  },

  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];

    // Wiki link detection plugin
    plugins.push(
      new Plugin({
        key: new PluginKey('wikiLinkDetection'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const regex = /\[\[([^\]]+)\]\]/g;
                let match;

                while ((match = regex.exec(node.text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  const linkText = match[1];

                  // Check if this range already has a wiki link mark
                  const hasWikiLink = state.doc.rangeHasMark(start, end, state.schema.marks.wikiLink);

                  if (!hasWikiLink) {
                    decorations.push(
                      Decoration.inline(start, end, {
                        class: 'wiki-link-pending text-cosmic-400',
                        'data-wiki-text': linkText,
                      })
                    );
                  }
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },

          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('wiki-link') || target.classList.contains('wiki-link-pending')) {
              const wikiText = target.getAttribute('data-wiki-link') || target.getAttribute('data-wiki-text');
              if (wikiText && this.options.onLinkClick) {
                this.options.onLinkClick(wikiText);
                return true;
              }
            }
            return false;
          },
        },
      })
    );

    // Auto-conversion of [[text]] to wiki links
    plugins.push(
      new Plugin({
        key: new PluginKey('wikiLinkAutoConversion'),
        props: {
          handleTextInput: (view, from, to, text) => {
            const state = view.state;
            const $from = state.doc.resolve(from);
            
            // Check if we're completing a wiki link
            if (text === ']') {
              const textBefore = $from.parent.textBetween(
                Math.max(0, $from.parentOffset - 2),
                $from.parentOffset,
                null,
                '\ufffc'
              );
              
              if (textBefore === '[[') {
                // Look ahead to see if there's another ]
                const textAfter = $from.parent.textBetween(
                  $from.parentOffset,
                  Math.min($from.parent.content.size, $from.parentOffset + 1),
                  null,
                  '\ufffc'
                );
                
                if (textAfter === ']') {
                  // We're closing a wiki link
                  const linkStart = from - 2;
                  const linkEnd = to + 1;
                  
                  // Get the link text
                  const linkText = state.doc.textBetween(linkStart + 2, from);
                  
                  if (linkText) {
                    // Convert to wiki link
                    const tr = state.tr
                      .delete(linkStart, linkEnd)
                      .insertText(linkText)
                      .setMark(
                        linkStart,
                        linkStart + linkText.length,
                        state.schema.marks.wikiLink.create({ href: linkText })
                      );
                    
                    view.dispatch(tr);
                    return true;
                  }
                }
              }
            }
            
            return false;
          },
        },
      })
    );

    // Suggestion plugin for auto-completion
    if (this.options.getSuggestions) {
      plugins.push(
        Suggestion({
          editor: this.editor,
          char: '[[',
          startOfLine: false,
          pluginKey: new PluginKey('wikiLinkSuggestion'),
          
          command: ({ editor, range, props }) => {
            // Delete the trigger characters
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({
                type: 'text',
                text: props.label,
                marks: [
                  {
                    type: 'wikiLink',
                    attrs: {
                      href: props.id || props.label,
                      title: props.title,
                    },
                  },
                ],
              })
              .run();
          },

          items: async ({ query }) => {
            if (!this.options.getSuggestions) return [];
            return await this.options.getSuggestions(query);
          },

          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props) => {
                // Create suggestion dropdown
                component = document.createElement('div');
                component.className = 'wiki-link-suggestions bg-background border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto';
                
                popup = document.body.appendChild(component);
                
                // Position the popup
                const coords = props.clientRect();
                if (coords) {
                  popup.style.position = 'fixed';
                  popup.style.left = `${coords.left}px`;
                  popup.style.top = `${coords.bottom + 8}px`;
                  popup.style.zIndex = '1000';
                }
              },

              onUpdate: (props) => {
                if (!component) return;

                // Clear previous items
                component.innerHTML = '';

                // Add suggestion items
                props.items.forEach((item: any, index: number) => {
                  const element = document.createElement('div');
                  element.className = `suggestion-item px-3 py-2 cursor-pointer hover:bg-muted rounded ${
                    index === props.command.index ? 'bg-muted' : ''
                  }`;
                  element.innerHTML = `
                    <div class="font-medium">${item.label}</div>
                    ${item.description ? `<div class="text-xs text-muted-foreground">${item.description}</div>` : ''}
                  `;
                  element.onclick = () => props.command(item);
                  component.appendChild(element);
                });

                // Update position
                const coords = props.clientRect();
                if (coords && popup) {
                  popup.style.left = `${coords.left}px`;
                  popup.style.top = `${coords.bottom + 8}px`;
                }
              },

              onKeyDown: (props) => {
                if (props.event.key === 'Escape') {
                  props.command({ label: '' });
                  return true;
                }
                return false;
              },

              onExit: () => {
                if (popup) {
                  popup.remove();
                }
              },
            };
          },
        })
      );
    }

    return plugins;
  },
});