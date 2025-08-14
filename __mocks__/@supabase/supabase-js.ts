export const createClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null } }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAuthStateChange: (_cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithOAuth: async () => ({}),
    signOut: async () => ({}),
  },
});
