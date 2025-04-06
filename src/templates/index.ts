import { GraphQLSchema } from "graphql";
import { ADFDocument } from "../confluence/document-model";

export interface GqlConfluenceTemplate {
  name: string;
  parse(schema: GraphQLSchema): ADFDocument 
}
