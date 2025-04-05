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

type Node = Paragraph | Text | Heading | TableOfContent;

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

/*************** Table of content node ***************/
type TableOfContent = {
  type: "extension";
  attrs: {
    layout: "default";
    extensionType: "com.atlassian.confluence.macro.core";
    extensionKey: "toc";
    parameters: {
      macroParams: {
        style: {
          value: "none";
        };
      };
      macroMetadata: {
        macroId: {
          value: "6310d33d-eb5a-4c12-a479-a1ff44ff9d9f";
        };
        schemaVersion: {
          value: "1";
        };
        title: "Table of Contents";
      };
    };
    localId: "9374c8ac-9ac7-4194-9b3f-0b67ab4cfd6b";
  };
};

export const TableOfContent = ():TableOfContent => ({
  type: "extension",
  attrs: {
    layout: "default",
    extensionType: "com.atlassian.confluence.macro.core",
    extensionKey: "toc",
    parameters: {
      macroParams: {
        style: {
          value: "none",
        },
      },
      macroMetadata: {
        macroId: {
          value: "6310d33d-eb5a-4c12-a479-a1ff44ff9d9f",
        },
        schemaVersion: {
          value: "1",
        },
        title: "Table of Contents",
      },
    },
    localId: "9374c8ac-9ac7-4194-9b3f-0b67ab4cfd6b",
  },
});
