export function normalizeMongoUri(uri) {
  const schemeEnd = uri.indexOf('://');
  if (schemeEnd === -1 || !/^mongodb(?:\+srv)?$/i.test(uri.slice(0, schemeEnd))) {
    return uri;
  }

  const address = uri.slice(schemeEnd + 3);
  const atIndex = address.lastIndexOf('@');
  if (atIndex <= 0) {
    return uri;
  }

  const credentials = address.slice(0, atIndex);
  const separator = credentials.indexOf(':');
  if (separator === -1) {
    return uri;
  }

  const username = decodeURIComponent(credentials.slice(0, separator));
  const password = decodeURIComponent(credentials.slice(separator + 1));
  const encodedCredentials = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;

  return `${uri.slice(0, schemeEnd + 3)}${encodedCredentials}@${address.slice(atIndex + 1)}`;
}
