export type SessionRole = "admin" | "staff" | "customer";
export type SessionTokenType = "access" | "refresh";

export type BaseSessionToken = {
  sub: string;
  role: SessionRole;
  type: SessionTokenType;
};

export type AdminSession = {
  id: "admin";
  email: string;
  name: string;
  mobile: string;
  role: "admin";
};

export type StaffSession = {
  id: string;
  name: string;
  username: string;
  mobile: string;
  email: string;
  designation: string;
  role: "staff";
  status: "active" | "inactive";
};

export type AdminAccessTokenPayload = BaseSessionToken & AdminSession;
export type StaffAccessTokenPayload = BaseSessionToken & StaffSession;
