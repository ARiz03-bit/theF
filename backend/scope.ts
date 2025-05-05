// scope.ts
export function requireScope(user: { scopes: string[] }, scope: string) {
    if (!user?.scopes || !user.scopes.includes(scope)) {
      throw new Error("Forbidden: missing required scope " + scope);
    }
  }