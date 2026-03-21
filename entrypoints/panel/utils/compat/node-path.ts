const basename = (input: string) => {
  if (!input) return '';
  const sanitized = input.split('#')[0]?.split('?')[0] || input;
  const parts = sanitized.split(/[/\\]+/);
  return parts[parts.length - 1] || sanitized;
};

const path = { basename };

export { basename };
export default path;
