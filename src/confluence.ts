import path from "path";

type ConfluenceConfig = {
  domain: string;
  user: string;
  token: string;
};

type ConfluencePage = {
  id: string;
  title: string;
  spaceId: string;
  body: Document;
  currentVersion: number;
};

type UpdatePageRequest = {
  id: string;
  status: "current" | "draft";
  title: string;
  body: {
    representation: "atlas_doc_format";
    value: string;
  };
  version: {
    number: number;
    message: string;
  };
};

interface ConfluenceClient {
  getPageById(id: string): Promise<ConfluencePage>;
  updatePage(
    id: string,
    opts: {
      title: string;
      body: Document;
      version: number;
    },
  ): Promise<void>;
}

export function ConfluenceClient(configs: ConfluenceConfig): ConfluenceClient {
  const headers = {
    Authorization: `Basic ${Buffer.from(`${configs.user}:${configs.token}`).toString("base64")}}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  return {
    async getPageById(id: string): Promise<ConfluencePage> {
      const response = await fetch(
        path.join(
          configs.domain,
          "/wiki/api/v2/pages",
          id,
          "?body-format=atlas_doc_format",
        ),
        {
          method: "GET",
          headers,
        },
      ).then(async (r) => {
        if (r.status === 200) return r.json();
        else
          throw new Error(
            `Unable to retrieve page ${id}. Error ${r.status}: ${await r.text()} `,
          );
      });

      return {
        id: response.id,
        title: response.title,
        spaceId: response.spaceId,
        body: JSON.parse(response.body.atlas_doc_format.value),
        currentVersion: response.version.number,
      };
    },

    async updatePage(
      id: string,
      opts: {
        title: string;
        body: Document;
        version: number;
      },
    ): Promise<void> {
      const body: UpdatePageRequest = {
        id,
        status: "current",
        version: {
          number: opts.version,
          message: "Update from tool",
        },
        title: opts.title,
        body: {
          value: JSON.stringify(opts.body),
          representation: "atlas_doc_format",
        },
      };
      await fetch(path.join(configs.domain, "/wiki/api/v2/pages", id), {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (r.status === 200) return r.json();
        else
          throw new Error(
            `Unable to update the page ${id}. Error ${r.status}: ${await r.text()} `,
          );
      });
    },
  };
}

type Document = {
  type: "doc";
  content: unknown;
  version: 1;
};
