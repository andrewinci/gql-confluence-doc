import { ConfluenceClient } from "./confluence/client";
import {
  ADFDocument,
  BulletList,
  HardBreak,
  Heading,
  ListItem,
  Paragraph,
  Status,
  Table,
  TableCell,
  TableHeader,
  TableOfContent,
  TableRow,
  Text,
} from "./confluence/document-model";

const samplePage = ADFDocument([
  TableOfContent(),
  Heading(1, Text("This is a "), Text("title", { color: "red" })),
  Paragraph(Text("This is a paragraph", { strong: true })),
  Paragraph(Text("This is a paragraph 2", { italic: true, color: "green" })),

  Heading(2, Text("This is an header 2")),
  Paragraph(Text("This is a paragraph 3 "), Status("deprecated", "red")),

  Paragraph(
    Text("This is a paragraph 4 "),
    Text("link", { href: "#This is a title" }),
  ),

  Paragraph(
    Table([
      TableRow(
        [
          TableHeader([Paragraph(Text("Header Col 1", { strong: true }))]),
          TableHeader([Paragraph(Text("Header Col 2", { strong: true }))]),
        ],
        { background: "#3e3ec2" },
      ),
      TableRow(
        [
          TableCell([
            Paragraph(Text("Col 1, Row 1")),
            Paragraph(Text("Col 1, Row 1")),
          ]),
          TableCell([
            Paragraph(Text("Col 2, Row 1")),
            Paragraph(Text("Col 2, Row 1", { color: "red" })),
          ]),
        ],
        { background: "red" },
      ),
      TableRow([
        TableCell(
          [Paragraph(Text("Col 1, Row 2")), Paragraph(Text("Col 1, Row 2"))],
          { background: "blue" },
        ),
        TableCell([
          Paragraph(Text("Col 2, Row 2")),
          Paragraph(Text("Col 2, Row 2", { color: "green" })),
        ]),
      ]),
    ]),
  ),

  Paragraph(
    BulletList(
      ListItem(
        Text("item 1"),
        BulletList(
          ListItem(Text("Item 2"), BulletList(ListItem(Text("Item 3")))),
          ListItem(
            Text("Item 4"),
            HardBreak(),
            Text("This is another sub text"),
          ),
        ),
      ),
      ListItem(Text("item 5"), HardBreak(), Text("This is sub text 2")),
    ),
  ),
]);

async function main() {
  const confluenceClient = ConfluenceClient({
    domain: process.env.CONFLUENCE_DOMAIN!,
    token: process.env.CONFLUENCE_TOKEN!,
    user: process.env.CONFLUENCE_USER!,
  });
  const page = await confluenceClient.getPageById("294913");
  console.log("Page found", JSON.stringify(page, null, 2));
  // NOTE: when updating any comment will be lost
  await confluenceClient.updatePage(page.id, {
    title: "New title",
    body: samplePage,
    version: page.currentVersion + 1,
  });
}

main();
