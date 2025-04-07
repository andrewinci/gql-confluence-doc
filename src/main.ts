#!/usr/bin/env node

import { program } from "commander";
import { ConfluenceClient, ConfluenceConfig } from "./confluence/client";
import { loadGqlSchema } from "./gql/schema";
import { BasicTemplate } from "./templates/basic";
import { version } from "../package.json";
import chalk from "chalk";
import { confirm, input } from "@inquirer/prompts";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import os from "os";
import { exit } from "process";

const CONFIG_PATH = path.join(os.homedir(), ".gqlconfluence.config");

const loadConfig = async (): Promise<ConfluenceConfig> => {
  const content = await readFile(CONFIG_PATH, "utf8");
  return JSON.parse(content);
};

const buildConfluenceClient = async (): Promise<ConfluenceClient> => {
  try {
    const config = await loadConfig();
    return ConfluenceClient(config);
  } catch {
    console.log(
      chalk.red(
        "Unable to retrieve the credentials. Make sure to run the `setup` command before using the tool.",
      ),
    );
    exit(-1);
  }
};

program
  .name("gql-confluence")
  .description("Tool to generate confluence documentation for graphql")
  .version(version);

// setup credentials command
program
  .command("setup")
  .description("Setup confluence credentials")
  .action(async () => {
    console.log("Setup confluence credentials");
    const email = await input({ message: "Confluence email" });
    const domain = await input({
      message: "Confluence domain (e.g. https://myspace.atlassian.net/)",
    });
    const token = await input({
      message:
        "Confluence token. Generate one at https://id.atlassian.com/manage-profile/security/api-tokens}",
    });
    const res = await confirm({
      message: `Config will be written to ${CONFIG_PATH}, any previous configuration will be overwritten.\nContinue?`,
    });
    if (res) {
      await writeFile(
        CONFIG_PATH,
        JSON.stringify({
          user: email,
          domain,
          token,
        }),
        { flag: "w+" },
      );
    }
  });

// check page command (more for testing)
program
  .command("check-page")
  .description("retrieve info about the page in confluence")
  .argument("<page-id>", "The confluence page id")
  .option(
    "-c,--content",
    "If provided, dump the content of the page in ADF format to the stdout",
  )
  .action(async (pageId, options) => {
    const client = await buildConfluenceClient();
    const page = await client.getPageById(pageId);
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
  .action(async (files: string[], options) => {
    const confluenceClient = await buildConfluenceClient();

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

program
  .command("push")
  .description("Push an ADF document to a confluence page")
  .argument("<file>", "The path to the file containing the json to upload")
  .requiredOption("-p,--page-id <pageId>", "The confluence page id")
  .action(async (file: string, options) => {
    const confluenceClient = await buildConfluenceClient();

    // check if the page exists in confluence
    const page = await confluenceClient.getPageById(options.pageId);
    console.log(
      chalk.green.bold(
        `✔ Page ${page.id}, version ${page.currentVersion} found`,
      ),
    );
    const content = JSON.parse(await readFile(file, "utf8"));
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
