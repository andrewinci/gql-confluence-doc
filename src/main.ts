#!/usr/bin/env node

import { program } from "commander";
import { ConfluenceClient } from "./confluence/client";
import { loadGqlSchema } from "./gql/schema";
import { BasicTemplate } from "./templates/basic";
import { version } from "../package.json";

async function test() {
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

program
  .name("gql-confluence")
  .description("Tool to generate confluence documentation for graphql")
  .version(version);

program
  .command("check-page")
  .description("Retrieve info about the page in confluence")
  .argument("<page-id>", "The confluence page id")
  .option(
    "-c,--content",
    "If provided, dump the content of the page in ADF format to the stdout",
  )
  .requiredOption("-d,--domain <domain>", "the confluence domain to use")
  .requiredOption(
    "-t,--token <token>",
    "the confluence token to use. Generate one at https://id.atlassian.com/manage-profile/security/api-tokens",
  )
  .requiredOption("-u,--user <user>", "the confluence user email")
  .action(async (pageId, options) => {
    const confluenceClient = ConfluenceClient({
      domain: options.domain,
      token: options.token,
      user: options.user,
    });
    const page = await confluenceClient.getPageById(pageId);
    console.log(`Page ${page.id} found`);
    console.log(`Page title: ${page.title}`);
    console.log(`Page version: ${page.currentVersion}`);
    console.log(`Page spaceId: ${page.spaceId}`);
    if (options.content)
      console.log(`Page content:\n${JSON.stringify(page.body, null, 2)}`);
  });

program.parse();
