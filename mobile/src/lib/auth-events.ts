type AuthEventListener = () => void;

const listeners: Set<AuthEventListener> = new Set();

export const authEvents = {
  onForceLogout(listener: AuthEventListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  emitForceLogout() {
    listeners.forEach((listener) => listener());
  },
};
