import { createHighlighter, type Highlighter, type ThemeRegistration } from 'shiki';

/**
 * A code theme built from the site's own palette, so code reads as part of the page: cold
 * whites for text, sky and Pip blue for structure, aurora green for strings and the beak's
 * orange reserved for the few things worth spotting, numbers and constants.
 */
const polar: ThemeRegistration = {
  name: 'polar-night',
  type: 'dark',
  colors: { 'editor.background': '#00000000', 'editor.foreground': '#d6e0f2' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#55648a', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.new'], settings: { foreground: '#7fa6ff' } },
    { scope: ['keyword.operator', 'punctuation'], settings: { foreground: '#7d8cab' } },
    { scope: ['string', 'string.template', 'punctuation.definition.string'], settings: { foreground: '#5fe0c0' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#ffad5c' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'], settings: { foreground: '#eaf1ff' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class', 'support.class'], settings: { foreground: '#9cc2ff' } },
    { scope: ['entity.name.tag', 'support.class.component'], settings: { foreground: '#9cc2ff' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#c3cff0', fontStyle: 'italic' } },
    { scope: ['variable', 'variable.other', 'meta.object-literal.key'], settings: { foreground: '#d6e0f2' } },
    { scope: ['variable.parameter'], settings: { foreground: '#ffd7e1' } },
  ],
};

let highlighter: Promise<Highlighter> | null = null;

function get() {
  return (highlighter ??= createHighlighter({ themes: [polar], langs: ['tsx', 'bash'] }));
}

export async function highlight(code: string, lang: 'tsx' | 'bash' = 'tsx'): Promise<string> {
  const h = await get();
  return h.codeToHtml(code.trimEnd(), { lang, theme: 'polar-night' });
}
