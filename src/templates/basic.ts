import {
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputType,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInputType,
  isObjectType,
  isScalarType,
  isUnionType,
} from "graphql";
import { GqlConfluenceTemplate } from ".";
import {
  ADFDocument,
  Heading,
  Text,
  ADFNode,
  Status,
  Paragraph,
  Table,
  TableRow,
  TableHeader,
  TableCell,
  TableOfContent,
  BulletList,
  ListItem,
  HardBreak,
} from "../confluence/document-model";

const TABLE_HEADER_BACKGROUND = "#b3d4ff";

export const BasicTemplate: GqlConfluenceTemplate = {
  name: "basic",
  parse(schema: GraphQLSchema): ADFDocument {
    const documentBody = [] as ADFNode[];
    const publicTypes = Object.values(schema.getTypeMap()).filter(
      (t) => !t.name.startsWith("_"),
    );

    const query = schema.getQueryType();
    if (query) {
      documentBody.push(Heading(1, Text("Query")));
      documentBody.push(...parseGqlType(query));
    }

    const mutation = schema.getMutationType();
    if (mutation) {
      documentBody.push(Heading(1, Text("Mutation")));
      documentBody.push(...parseGqlType(mutation));
    }

    const objects = publicTypes
      .filter((t) => isObjectType(t) && !isEnumType(t) && !isScalarType(t))
      .filter((t) => !["Mutation", "Query"].includes(t.name));
    if (objects.length > 0) {
      documentBody.push(Heading(1, Text("Objects")));
      documentBody.push(
        ...objects
          .sort((a, b) => a.name.localeCompare(b.name))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const inputs = publicTypes.filter((t) => isInputObjectType(t));
    if (inputs.length > 0) {
      documentBody.push(Heading(1, Text("Inputs")));
      documentBody.push(
        ...inputs
          .sort((a, b) => a.name.localeCompare(b.name))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const unions = publicTypes.filter((t) => isUnionType(t));
    if (unions.length > 0) {
      documentBody.push(Heading(1, Text("Unions")));
      documentBody.push(
        ...unions
          .sort((a, b) => a.name.localeCompare(b.name))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const enums = publicTypes.filter(isEnumType);
    if (enums.length > 0) {
      documentBody.push(Heading(1, Text("Enums")));
      documentBody.push(
        ...enums
          .sort((a, b) => a.name.localeCompare(b.name))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const scalars = publicTypes.filter(isScalarType);
    if (scalars.length > 0) {
      documentBody.push(Heading(1, Text("Scalars")));
      documentBody.push(
        ...scalars
          .sort((a, b) => a.name.localeCompare(b.name))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    return ADFDocument([TableOfContent(), ...documentBody]);
  },
};

const parseGqlType = (
  t: GraphQLNamedType,
  opts?: { withHeader: boolean },
): ADFNode[] => {
  const res = [] as ADFNode[];

  if (opts?.withHeader) {
    // type name as header
    res.push(Heading(2, Text(t.name)));

    // add badge with entity type
    if (isObjectType(t)) {
      res.push(Paragraph(Status("object", "green")));
    } else if (isScalarType(t)) {
      res.push(Paragraph(Status("scalar", "orange")));
    } else if (isEnumType(t)) {
      res.push(Paragraph(Status("enum", "red")));
    } else if (isUnionType(t)) {
      res.push(Paragraph(Status("union", "yellow")));
    } else if (isInputObjectType(t)) {
      res.push(Paragraph(Status("input", "purple")));
    }
  }

  // add description if available
  const description = parseDescription(t.description);
  if (description.length > 0) {
    res.push(...description);
  }

  // add fields table
  if (isObjectType(t) || isInputObjectType(t)) {
    res.push(
      fieldsTable(
        Object.values(t.getFields()).filter((f) => !f.name.startsWith("_")),
      ),
    );
  }

  if (isEnumType(t)) {
    res.push(enumOptionsTable(t));
  }

  if (isUnionType(t)) {
    const items = t
      .getTypes()
      .map((t) => getOutputTypeName(t))
      .map(([name, url]) => ListItem(Text(name, { href: `##${url}` })));
    res.push(Paragraph(Text("Union of"), BulletList(...items)));
  }
  return res;
};

const getOutputTypeName = (
  t: GraphQLOutputType | GraphQLInputType,
): [string, string] => {
  const outType = t.toJSON();
  return [
    outType,
    outType.replaceAll("!", "").replaceAll("[", "").replaceAll("]", ""),
  ];
};

const fieldsTable = (fields: GraphQLField<any, any, any>[]): ADFNode => {
  const fieldRows = fields.map((f) => {
    const [name, url] = getOutputTypeName(f.type);
    let fArgs = [] as ADFNode[];
    if ("args" in f) {
      const args = f.args.flatMap((a, i, arr) => {
        const [name, url] = getOutputTypeName(a.type);
        return [
          Text(`\t${a.name}:`, { italic: true }),
          Text(name, { href: `##${url}` }),
          ...(i === arr.length - 1 ? [] : [Text(","), HardBreak()]),
        ];
      });

      fArgs =
        args.length > 0
          ? [Text("("), HardBreak(), ...args, HardBreak(), Text(")")]
          : [];
    }

    return TableRow([
      TableCell([Paragraph(Text(f.name), ...fArgs)]),
      TableCell([Paragraph(...parseDescription(f.description))]),
      TableCell([Paragraph(Text(name, { href: `##${url}` }))]),
    ]);
  });
  return Table([
    TableRow(
      [
        TableHeader([Paragraph(Text("Name", { strong: true }))]),
        TableHeader([Paragraph(Text("Description", { strong: true }))]),
        TableHeader([Paragraph(Text("Type", { strong: true }))]),
      ],
      { background: TABLE_HEADER_BACKGROUND },
    ),
    ...fieldRows,
  ]);
};

const enumOptionsTable = (t: GraphQLEnumType): ADFNode => {
  const fieldRows = t.getValues().map((v) => {
    return TableRow([
      TableCell([Paragraph(Text(v.name))]),
      TableCell([Paragraph(...parseDescription(v.description))]),
    ]);
  });
  return Table([
    TableRow(
      [
        TableHeader([Paragraph(Text("Name", { strong: true }))]),
        TableHeader([Paragraph(Text("Description", { strong: true }))]),
      ],
      { background: TABLE_HEADER_BACKGROUND },
    ),
    ...fieldRows,
  ]);
};

const parseDescription = (d: string | null | undefined): ADFNode[] => {
  // todo: support markdown description
  if (!d) return [];
  else return [Text(d)];
};
