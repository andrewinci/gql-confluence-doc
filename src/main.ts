import { ConfluenceClient } from "./confluence/client";
import { ADFDocument } from "./confluence/document-model";

const samplePage: ADFDocument = {
  type: "doc",
  version: 1,
  content: [
    {
      type: "heading",
      content: [
        { type: "text", text: "This is a " },
        {
          type: "text",
          text: "title",
          marks: [{ type: "textColor", attrs: { color: "red" } }],
        },
      ],
      attrs: { level: 1 },
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is a paragraph" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is a paragraph 2" }],
    },
    {
      type: "heading",
      content: [{ type: "text", text: "This an header 2" }],
      attrs: { level: 2 },
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is a paragraph 3" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a paragraph 4" },
        {
          type: "text",
          text: "Title",
          marks: [{ type: "link", attrs: { href: "#This is a title" } }],
        },
      ],
    },
  ],
};

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
