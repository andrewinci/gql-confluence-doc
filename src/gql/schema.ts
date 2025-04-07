import { buildSchema, GraphQLSchema } from "graphql";
import { readFile } from "fs/promises";

export async function loadGqlSchema(
  ...filePath: string[]
): Promise<GraphQLSchema> {
  // combine all gql files
  const schemas = await Promise.all(filePath.map((fp) => readFile(fp, "utf8")));
  return buildSchema(schemas.join("\n"));
}
