export type ADFDocument = {
  type: "doc";
  content: Node[];
  version: 1;
};

export const ADFDocument = (content: Node[]): ADFDocument => ({
  type: "doc",
  content,
  version: 1,
});

type Node = Paragraph | Text | Heading;

/*************** Paragraph node ***************/
type Paragraph = {
  type: "paragraph";
  content: Node[];
};

export const Paragraph = (content: Node[]): Paragraph => ({
  type: "paragraph",
  content,
});

/*************** Text node ***************/
type TextMarkLink = { type: "link"; attrs: { href: string } };
type TextMarkColor = {
  type: "textColor";
  attrs: {
    color: string;
  };
};
type TextMarkStrong = { type: "strong" };
type TextMarkItalic = { type: "em" };

type TextMark = TextMarkLink | TextMarkColor | TextMarkStrong | TextMarkItalic;
type Text = {
  type: "text";
  text: string;
  marks?: TextMark[];
};

export const Text = (
  text: string,
  opts?: { href?: string; color?: string; strong?: true; italic?: true },
): Text => {
  const marks: TextMark[] = [];
  if (opts?.href) marks.push({ type: "link", attrs: { href: opts.href } });
  if (opts?.color)
    marks.push({ type: "textColor", attrs: { color: opts.color } });
  if (opts?.strong) marks.push({ type: "strong" });
  if (opts?.italic) marks.push({ type: "em" });
  return {
    type: "text",
    text,
    ...(marks.length > 0 ? { marks } : {}),
  };
};

/*************** Text node ***************/
type Heading = {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 };
  content: Text[];
};

export const Heading = (content: Text[], level: 1 | 2 | 3 | 4): Heading => ({
  type: "heading",
  attrs: { level },
  content,
});
