export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateHouseholdInput {
  name: string;
}

export interface AddMemberInput {
  email: string;
  role?: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface UpdateMemberRoleInput {
  role: 'EDITOR' | 'VIEWER';
}
