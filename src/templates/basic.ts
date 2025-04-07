import {
  DirectiveNode,
  GraphQLEnumType,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
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
  Panel,
} from "../confluence/document-model";
import { IncomingMessage } from "http";

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

    // parse objects
    documentBody.push(
      ...parseGqlTypes(
        "Objects",
        publicTypes
          .filter((t) => isObjectType(t) && !isEnumType(t) && !isScalarType(t))
          .filter((t) => !["Mutation", "Query"].includes(t.name)),
      ),
    );
    // parse interfaces
    documentBody.push(
      ...parseGqlTypes(
        "Interfaces",
        publicTypes
          .filter((t) => isInterfaceType(t))
          .map((intf) => {
            const implementingTypes = Object.values(schema.getTypeMap()).filter(
              (t) => t["getInterfaces"]?.().includes(intf),
            );
            intf["implementingTypes"] = implementingTypes;
            return intf;
          }),
      ),
    );
    //parse inputs
    documentBody.push(
      ...parseGqlTypes("Inputs", publicTypes.filter(isInputObjectType)),
    );
    //parse unions
    documentBody.push(
      ...parseGqlTypes("Unions", publicTypes.filter(isUnionType)),
    );
    //parse enums
    documentBody.push(
      ...parseGqlTypes("Enums", publicTypes.filter(isEnumType)),
    );
    // parse scalars
    documentBody.push(
      ...parseGqlTypes("Scalars", publicTypes.filter(isScalarType)),
    );

    return ADFDocument([TableOfContent(), ...documentBody]);
  },
};

const parseGqlTypes = (name: string, types: GraphQLNamedType[]): ADFNode[] => {
  const documentBody = [] as ADFNode[];
  if (types.length > 0) {
    documentBody.push(Heading(1, Text(name)));
    documentBody.push(
      ...types
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort(
          (a, b) =>
            (deprecationReason(b) ? 1 : 0) - (deprecationReason(a) ? 1 : 0),
        )
        .sort((a, b) => (isNew(b) ? 1 : 0) - (isNew(a) ? 1 : 0))
        .flatMap((t) => parseGqlType(t, { withHeader: true })),
    );
  }
  return documentBody;
};

const parseGqlType = (
  t: GraphQLNamedType,
  opts?: { withHeader: boolean },
): ADFNode[] => {
  const res = [] as ADFNode[];
  const deprecated = deprecationReason(t);
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
    } else if (isInterfaceType(t)) {
      res.push(Paragraph(Status("interface", "blue")));
    }

    // add deprecation panel
    if (deprecated)
      res.push(
        Panel(
          [
            Paragraph(
              Text(`(deprecated) ${deprecated}`, {
                strong: true,
              }),
            ),
          ],
          "error",
        ),
      );

    if (isNew(t))
      res.push(
        Panel(
          [
            Paragraph(
              Text(`New entity`, {
                strong: true,
              }),
            ),
          ],
          "success",
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

  if (isInterfaceType(t)) {
    const items = t["implementingTypes"]
      .map((t) => getTypeName(t))
      .map(([name, url]) => ListItem(Text(name, { href: `##${url}` })));
    res.push(Paragraph(Text("Implemented by"), BulletList(...items)));
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
          Paragraph(
            ...parseDescription(f.description, f.deprecationReason, isNew(f)),
          ),
        ]),
        TableCell([Paragraph(Text(name, { href: `##${url}` }))]),
      ],
      {
        background: f.deprecationReason
          ? "red"
          : isNew(f)
            ? "green"
            : undefined,
      },
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
          Paragraph(
            ...parseDescription(v.description, v.deprecationReason, isNew(v)),
          ),
        ]),
      ],
      {
        background: v.deprecationReason
          ? "red"
          : isNew(v)
            ? "green"
            : undefined,
      },
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
  isNew?: boolean,
): ADFNode[] => {
  // todo: support markdown description
  const res = [] as ADFNode[];
  if (deprecationReason)
    res.push(
      Text(`(deprecated) ${deprecationReason}\n`, {
        strong: true,
        color: "red",
      }),
    );
  if (isNew)
    res.push(
      Text(`new item\n`, {
        strong: true,
        color: "green",
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

const isNew = (
  t: GraphQLType | GraphQLField<any, any, any> | GraphQLEnumValue,
): boolean => {
  const directives = (t["astNode"]?.["directives"] ?? []) as DirectiveNode[];
  const deprecated = directives.filter((d) => d.name.value === "new");
  return deprecated.length > 0;
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
