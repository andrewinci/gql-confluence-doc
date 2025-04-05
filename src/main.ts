import { ConfluenceClient } from "./confluence/client";
import {
  ADFDocument,
  Heading,
  Paragraph,
  TableOfContent,
  Text,
} from "./confluence/document-model";

const samplePage = ADFDocument([
  TableOfContent(),
  Heading([Text("This is a "), Text("title", { color: "red" })], 1),
  Paragraph([Text("This is a paragraph", {strong: true})]),
  Paragraph([Text("This is a paragraph 2", {italic: true, color: "green"})]),

  Heading([Text("This is an header 2")], 2),
  Paragraph([Text("This is a paragraph 3")]),

  Paragraph([
    Text("This is a paragraph 4 "),
    Text("link", { href: "#This is a title" }),
  ]),
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
