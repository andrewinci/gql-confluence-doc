import path from "path";

type ConfluenceConfig = {
  domain: string;
  user: string;
  token: string;
};

type ConfluencePage = {
  id: string;
};

interface ConfluenceClient {
  getPageById(id: string): Promise<ConfluencePage>;
}

export function ConfluenceClient(configs: ConfluenceConfig): ConfluenceClient {
  const headers = {
    Authorization: `Basic ${Buffer.from(`${configs.user}:${configs.token}`).toString("base64")}}`,
    Accept: "application/json",
  };

  return {
    async getPageById(id: string): Promise<ConfluencePage> {
      const response = await fetch(
        path.join(configs.domain, "/wiki/api/v2/pages", id),
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
      };
    },
  };
}

async function main() {
  const confluenceClient = ConfluenceClient({
    domain: process.env.CONFLUENCE_DOMAIN!,
    token: process.env.CONFLUENCE_TOKEN!,
    user: process.env.CONFLUENCE_USER!,
  });
  const page = await confluenceClient.getPageById("131257");
  console.log("Page found", page);
}

main();
