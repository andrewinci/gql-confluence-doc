#!/usr/bin/env node

import { program } from "commander";
import { ConfluenceClient } from "./confluence/client";
import { loadGqlSchema } from "./gql/schema";
import { BasicTemplate } from "./templates/basic";
import { version } from "../package.json";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";

program
  .name("gql-confluence")
  .description("Tool to generate confluence documentation for graphql")
  .version(version);

program
  .command("check-page")
  .description("retrieve info about the page in confluence")
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
    console.log(chalk.green.bold(`✔ Page ${page.id} found`));
    console.log(` title: ${page.title}`);
    console.log(` version: ${page.currentVersion}`);
    console.log(` spaceId: ${page.spaceId}`);
    if (options.content)
      console.log(`Page content:\n${JSON.stringify(page.body, null, 2)}`);
  });

program
  .command("publish")
  .description("parse gql to confluence format and publish")
  .argument("<gqlFiles...>", "List of gql files to parse")
  .requiredOption("-p,--page-id <pageId>", "The confluence page id")
  .requiredOption("-d,--domain <domain>", "the confluence domain to use")
  .requiredOption(
    "-t,--token <token>",
    "the confluence token to use. Generate one at https://id.atlassian.com/manage-profile/security/api-tokens",
  )
  .requiredOption("-u,--user <user>", "the confluence user email")
  .action(async (files: string[], options) => {
    const confluenceClient = ConfluenceClient({
      domain: options.domain,
      token: options.token,
      user: options.user,
    });

    // check if the page exists in confluence
    const page = await confluenceClient.getPageById(options.pageId);
    console.log(
      chalk.green.bold(
        `✔ Page ${page.id}, version ${page.currentVersion} found`,
      ),
    );

    // load schema
    const schema = await loadGqlSchema(...files);
    console.log(
      chalk.green(
        `✔ GraphQL schema parsed, ${Object.values(schema.getTypeMap() ?? {}).length} types found`,
      ),
    );

    // parse schema to ADFDocument
    const content = BasicTemplate.parse(schema);
    console.log(
      chalk.red(
        "⚠ The confluence page will be updated with the new content.\nAny manual changes or comments to the current version will be lost.",
      ),
    );
    const answer = await confirm({
      message: "Are you sure to continue?",
      default: false,
    });
    if (answer) {
      const newVersion = page.currentVersion + 1;
      await confluenceClient.updatePage(page.id, {
        title: page.title,
        body: content,
        version: newVersion,
      });
      console.log(
        chalk.green(
          `✔ Confluence page "${page.title}" updated, new version ${newVersion}`,
        ),
      );
    } else {
      console.log(`✔ Nothing to do`);
    }
  });

program.parse();
