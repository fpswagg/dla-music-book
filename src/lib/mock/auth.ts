const MOCK_USER = {
  id: "user-mock-admin",
  email: "admin@douala-hymn.local",
  displayName: "Admin",
  role: "ADMIN" as const,
};

export const mockAuth = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signInWithEmail(email: string, password: string) {
    console.log(`[Mock Auth] Sign in with email: ${email}`);
    return { user: MOCK_USER, error: null };
  },

  async signUp(email: string, _password: string, displayName: string) {
    console.log(`[Mock Auth] Sign up: ${email} (${displayName})`);
    return { user: { ...MOCK_USER, email, displayName }, error: null };
  },

  async signInWithOAuth(provider: string) {
    console.log(`[Mock Auth] OAuth sign in with: ${provider}`);
    return { user: MOCK_USER, error: null };
  },

  async signInWithPhone(phone: string) {
    console.log(`[Mock Auth] Phone OTP sent to: ${phone}`);
    return { error: null };
  },

  async verifyOtp(phone: string, token: string) {
    console.log(`[Mock Auth] Verify OTP for ${phone}: ${token}`);
    return { user: MOCK_USER, error: null };
  },

  async signOut() {
    console.log("[Mock Auth] Sign out");
    return { error: null };
  },

  async getUser() {
    return { user: MOCK_USER, error: null };
  },

  async getSession() {
    return {
      session: {
        user: MOCK_USER,
        access_token: "mock-token",
        refresh_token: "mock-refresh",
      },
      error: null,
    };
  },
};
