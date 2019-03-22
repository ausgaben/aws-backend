export const encodeStartKey = (key?: any) =>
    key
        ? encodeURIComponent(
              Buffer.from(JSON.stringify(key)).toString('base64'),
          )
        : undefined;
export const decodeStartKey = (key?: string) =>
    key
        ? JSON.parse(
              Buffer.from(decodeURIComponent(key), 'base64').toString('ascii'),
          )
        : undefined;
