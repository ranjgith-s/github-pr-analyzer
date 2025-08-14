// Jest mock for '@/lib/supabaseClient'
// Provides the minimal surface used by the app during tests.

// Use global jest if available, otherwise fallback to no-op fns for safety when type-checking
const fn = typeof jest !== 'undefined' ? jest.fn : ((() => () => {}) as any);

const mockSubscription = {
  unsubscribe: fn(),
};

const supabase = {
  auth: {
    signInWithOAuth: fn().mockResolvedValue({
      data: { user: null, session: null, url: null },
      error: null,
    }),
    getSession: fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    onAuthStateChange: fn().mockReturnValue({
      data: { subscription: mockSubscription },
    }),
  },
};

export { supabase };
export default supabase;
