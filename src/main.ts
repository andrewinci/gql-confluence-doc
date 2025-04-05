import { ConfluenceClient } from "./confluence";

async function main() {
  const confluenceClient = ConfluenceClient({
    domain: process.env.CONFLUENCE_DOMAIN!,
    token: process.env.CONFLUENCE_TOKEN!,
    user: process.env.CONFLUENCE_USER!,
  });
  const page = await confluenceClient.getPageById("294913");
  console.log("Page found", JSON.stringify(page, null, 2));
  await confluenceClient.updatePage(
    page.id, {
      title: "New title",
      body: page.body,
      version: page.currentVersion + 1,
    }
  )
}

main();
