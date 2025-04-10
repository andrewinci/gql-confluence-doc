import { buildSchema, GraphQLSchema } from "graphql";
import { readFile } from "fs/promises";

const customDirectives = `
directive @deprecated(
  reason: String
) on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | ENUM | ENUM_VALUE | OBJECT | UNION | INTERFACE

directive @new on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | ENUM | ENUM_VALUE | OBJECT | UNION | INTERFACE
`;

export async function loadGqlSchema(
  ...filePath: string[]
): Promise<GraphQLSchema> {
  // combine all gql files
  const schemas = await Promise.all(filePath.map((fp) => readFile(fp, "utf8")));
  return buildSchema(schemas.join("\n") + customDirectives);
}
