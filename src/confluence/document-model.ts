type Color = string;

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

type Node = Paragraph | Text | Heading | TableOfContent | Table | Status;

/*************** Paragraph node ***************/
type Paragraph = {
  type: "paragraph";
  content: Node[];
};

export const Paragraph = (...content: Node[]): Paragraph => ({
  type: "paragraph",
  content,
});

/*************** Text node ***************/
type TextMarkLink = { type: "link"; attrs: { href: string } };
type TextMarkColor = {
  type: "textColor";
  attrs: {
    color: Color;
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
  opts?: { href?: string; color?: Color; strong?: true; italic?: true },
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

/*************** Heading node ***************/
type Heading = {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 };
  content: Text[];
};

export const Heading = (level: 1 | 2 | 3 | 4, ...content: Text[]): Heading => ({
  type: "heading",
  attrs: { level },
  content,
});

/*************** Table node ***************/
type Table = {
  type: "table";
  attrs?: {
    layout?: "default";
    width?: 760;
  };
  content: TableRow[];
};

type TableRow = {
  type: "tableRow";
  content: TableHeader[] | TableCell[];
};

type TableHeader = {
  type: "tableHeader";
  attrs?: {
    background?: Color;
    colspan?: 1;
    rowspan?: 1;
  };
  content: Paragraph[];
};

type TableCell = {
  type: "tableCell";
  attrs?: {
    background?: Color;
    colspan?: 1;
    rowspan?: 1;
  };
  content: Paragraph[];
};

export const Table = (rows: TableRow[]): Table => {
  return {
    type: "table",
    content: rows,
  };
};

export const TableRow = (
  content: TableHeader[] | TableCell[],
  opts?: { background: Color },
): TableRow => ({
  type: "tableRow",
  content: content.map((c) => ({
    ...c,
    attrs: {
      ...(opts?.background ? { background: opts.background } : c.attrs),
    },
  })),
});

export const TableHeader = (
  content: Paragraph[],
  opts?: { background: Color },
): TableHeader => ({
  type: "tableHeader",
  attrs: {
    ...(opts?.background ? { background: opts.background } : {}),
  },
  content,
});
export const TableCell = (
  content: Paragraph[],
  opts?: { background: Color },
): TableCell => ({
  type: "tableCell",
  attrs: {
    ...(opts?.background ? { background: opts.background } : {}),
  },
  content,
});


/*************** Status node ***************/

type Status = {
  type: "status",
  attrs: {
    color: Color,
    style: "bold",
    text: string
  }
}

export const Status = (text: string, color: Color): Status => {
  return ({
    type: "status",
    attrs: {
      color,
      text,
      style: "bold"
    }
  })
}

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
  };
};

export const TableOfContent = (): TableOfContent => ({
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
  },
});
