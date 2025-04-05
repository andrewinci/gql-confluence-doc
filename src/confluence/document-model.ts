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

type TextMark = TextMarkLink | TextMarkColor;
type Text = {
  type: "text";
  text: string;
  marks?: TextMark[];
};

export const Text = (
  text: string,
  opts?: { href?: string; color?: string },
): Text => {
  const marks: TextMark[] = [];
  if (opts?.href) marks.push({ type: "link", attrs: { href: opts.href } });
  if (opts?.color)
    marks.push({ type: "textColor", attrs: { color: opts.color } });
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
