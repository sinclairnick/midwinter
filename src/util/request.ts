// Duck-type check for response just in case
export function isResponse(value: unknown): value is Response {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Check for typical Response methods and properties
  return (
    typeof (value as Response).status === "number" &&
    typeof (value as Response).ok === "boolean" &&
    typeof (value as Response).json === "function" &&
    typeof (value as Response).headers === "object"
  );
}
