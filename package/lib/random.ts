import * as random from "@pulumi/random";

interface GetRandomIdArgs {
  name: string;
  length?: number;
  forceRegeneration?: boolean;
}

export const getRandomId = ({
  name,
  length,
  forceRegeneration,
}: GetRandomIdArgs) =>
  new random.RandomId(name, {
    byteLength: length ?? 4,
    keepers: {
      randomNumber: forceRegeneration ? Math.random() : 1, // force recreation of this string, in order to always change revision name suffix, to prevent conflicts
    },
  }).b64Url;
