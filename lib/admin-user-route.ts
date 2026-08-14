const userIdPattern = /^[1-9]\d*$/;

export function parseAdminUserId(searchParams: Pick<URLSearchParams, "get">): number | null {
  const value = searchParams.get("id");
  if (!value || !userIdPattern.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function adminUserDetailHref(id: number): string {
  return `/admin/users/detail?id=${id}`;
}

export function adminUserEditHref(id: number): string {
  return `/admin/users/edit?id=${id}`;
}
