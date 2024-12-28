export const res = (message, status, headers) => {
  return {
    statusCode: status,
    headers: headers,
    body: JSON.stringify(message),
  };
};
