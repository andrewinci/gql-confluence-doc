import {
  ConstDirectiveNode,
  DirectiveNode,
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputType,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLType,
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
          .sort((a, b) => (deprecationReason(a) ? 1 : 0) - (deprecationReason(b) ? 1 : 0))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const inputs = publicTypes.filter((t) => isInputObjectType(t));
    if (inputs.length > 0) {
      documentBody.push(Heading(1, Text("Inputs")));
      documentBody.push(
        ...inputs
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => (deprecationReason(a) ? 1 : 0) - (deprecationReason(b) ? 1 : 0))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const unions = publicTypes.filter((t) => isUnionType(t));
    if (unions.length > 0) {
      documentBody.push(Heading(1, Text("Unions")));
      documentBody.push(
        ...unions
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => (deprecationReason(a) ? 1 : 0) - (deprecationReason(b) ? 1 : 0))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const enums = publicTypes.filter(isEnumType);
    if (enums.length > 0) {
      documentBody.push(Heading(1, Text("Enums")));
      documentBody.push(
        ...enums
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => (deprecationReason(a) ? 1 : 0) - (deprecationReason(b) ? 1 : 0))
          .flatMap((t) => parseGqlType(t, { withHeader: true })),
      );
    }

    const scalars = publicTypes.filter(isScalarType);
    if (scalars.length > 0) {
      documentBody.push(Heading(1, Text("Scalars")));
      documentBody.push(
        ...scalars
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => (deprecationReason(a) ? 1 : 0) - (deprecationReason(b) ? 1 : 0))
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

    // add deprecation badge
    if (deprecationReason(t))
      res.push(
        Paragraph(
          Text(`⚠️ deprecated: ${deprecationReason(t)}`, {
            strong: true,
            color: "red",
          }),
        ),
      );
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
      .map((t) => getTypeName(t))
      .map(([name, url]) => ListItem(Text(name, { href: `##${url}` })));
    res.push(Paragraph(Text("Union of"), BulletList(...items)));
  }
  return res;
};

const fieldsTable = (fields: GraphQLField<any, any, any>[]): ADFNode => {
  const fieldRows = fields.map((f) => {
    const [name, url] = getTypeName(f.type);
    let fArgs = [] as ADFNode[];
    if ("args" in f) {
      const args = f.args.flatMap((a, i, arr) => {
        const [name, url] = getTypeName(a.type);
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

    return TableRow(
      [
        TableCell([Paragraph(Text(f.name), ...fArgs)]),
        TableCell([
          Paragraph(...parseDescription(f.description, f.deprecationReason)),
        ]),
        TableCell([Paragraph(Text(name, { href: `##${url}` }))]),
      ],
      { background: f.deprecationReason ? "red" : undefined },
    );
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
    return TableRow(
      [
        TableCell([Paragraph(Text(v.name))]),
        TableCell([
          Paragraph(...parseDescription(v.description, v.deprecationReason)),
        ]),
      ],
      { background: v.deprecationReason ? "red" : undefined },
    );
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

const parseDescription = (
  d: string | null | undefined,
  deprecationReason?: string | null | undefined,
): ADFNode[] => {
  // todo: support markdown description
  const res = [] as ADFNode[];
  if (deprecationReason)
    res.push(
      Text(`deprecated - ${deprecationReason}\n`, {
        strong: true,
        color: "red",
      }),
    );
  if (d) res.push(Text(d));
  return res;
};

const deprecationReason = (t: GraphQLType): string | null => {
  const directives = (t["astNode"]?.["directives"] ?? []) as DirectiveNode[];
  const deprecated = directives.filter((d) => d.name.value === "deprecated");
  const deprecationReason =
    deprecated[0]?.arguments?.[0]?.["value"]?.["value"] ??
    "No longer supported";
  return deprecated.length > 0 ? deprecationReason : null;
};

const getTypeName = (
  t: GraphQLOutputType | GraphQLInputType,
): [string, string] => {
  const outType = t.toJSON();
  return [
    outType,
    outType.replaceAll("!", "").replaceAll("[", "").replaceAll("]", ""),
  ];
};
