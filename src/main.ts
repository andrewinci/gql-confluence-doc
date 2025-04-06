import { ConfluenceClient } from "./confluence/client";
import { loadGqlSchema } from "./gql/schema";
import { BasicTemplate } from "./templates/basic";

async function main() {
  // load graphql schema
  const schema = await loadGqlSchema("./test1.gql", "./test.gql");
  // parse schema to ADFDocument
  const content = BasicTemplate.parse(schema);
  // post to confluence
  const confluenceClient = ConfluenceClient({
    domain: process.env.CONFLUENCE_DOMAIN!,
    token: process.env.CONFLUENCE_TOKEN!,
    user: process.env.CONFLUENCE_USER!,
  });
  const page = await confluenceClient.getPageById("294913");
  // NOTE: when updating any comment will be lost
  await confluenceClient.updatePage(page.id, {
    title: "New title",
    body: content,
    version: page.currentVersion + 1,
  });
}

main();
