// Jest mock for '@/lib/supabaseClient'
// Provides the minimal surface used by the app during tests.

// Use global jest if available, otherwise fallback to no-op fns for safety when type-checking
const fn = typeof jest !== 'undefined' ? jest.fn : ((() => () => {}) as any);

let mockSession: any = null;
let authCallbacks: Array<(event: any, session: any) => void> = [];

const supabase = {
  auth: {
    signInWithOAuth: fn().mockImplementation(async () => {
      // Simulate a successful OAuth sign-in that yields a provider token
      mockSession = { provider_token: 'token123' };
      authCallbacks.forEach((cb) => cb('SIGNED_IN', mockSession));
      return {
        data: { user: null, session: mockSession, url: null },
        error: null,
      } as any;
    }),
    getSession: fn().mockImplementation(async () => ({
      data: { session: mockSession },
      error: null,
    })),
    onAuthStateChange: fn().mockImplementation((cb: any) => {
      authCallbacks.push(cb);
      // Immediately emit current state for convenience
      cb('INITIAL', mockSession);
      const subscription = {
        unsubscribe: fn().mockImplementation(() => {
          authCallbacks = authCallbacks.filter((c) => c !== cb);
        }),
      };
      return { data: { subscription } } as any;
    }),
    // Testing helpers to manipulate session
    __setSession: (s: any) => {
      mockSession = s;
      // Broadcast to all subscribers
      authCallbacks.forEach((cb) => cb('UPDATED', mockSession));
    },
    signOut: fn().mockResolvedValue({ data: {}, error: null }),
  },
};

export { supabase };
export default supabase;
