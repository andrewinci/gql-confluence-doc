export type ADFDocument = {
  type: "doc";
  content: Node[];
  version: 1;
};

type Node = Paragraph | Text | Heading;

/*************** Paragraph node ***************/
type Paragraph = {
  type: "paragraph";
  content: Node[];
};

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

/*************** Text node ***************/
type Heading = {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 };
  content: Text[];
};
