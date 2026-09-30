import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { fill } from '../utils/layout';

type PortalApi = {
  mount(key: string, node: ReactNode): void;
  unmount(key: string): void;
};

const PortalContext = createContext<PortalApi | null>(null);

const PortalHost = forwardRef<PortalApi>(function PortalHost(_, ref) {
  const [nodes, setNodes] = useState<Map<string, ReactNode>>(() => new Map());

  useImperativeHandle(
    ref,
    () => ({
      mount(key, node) {
        setNodes((prev) => new Map(prev).set(key, node));
      },
      unmount(key) {
        setNodes((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      },
    }),
    [],
  );

  return (
    <View style={styles.host}>
      {Array.from(nodes, ([key, node]) => (
        <View key={key} style={styles.host}>
          {node}
        </View>
      ))}
    </View>
  );
});

/**
 * Hosts overlays (sheets, dialogs, toasts, menus) above the app without a native modal, so
 * gestures and shared values keep working inside them. Mounted by `PenguinProvider`.
 */
export function PortalProvider({ children }: { children: ReactNode }) {
  const host = useRef<PortalApi>(null);
  const api = useMemo<PortalApi>(
    () => ({
      mount: (key, node) => host.current?.mount(key, node),
      unmount: (key) => host.current?.unmount(key),
    }),
    [],
  );

  return (
    <PortalContext.Provider value={api}>
      {children}
      <PortalHost ref={host} />
    </PortalContext.Provider>
  );
}

/**
 * Renders children in the overlay layer. Without a provider it renders in place.
 * Context set between the portal and the provider does not reach the children.
 */
export function Portal({ children }: { children: ReactNode }) {
  const api = useContext(PortalContext);
  const key = useId();

  useEffect(() => {
    api?.mount(key, children);
  });

  useEffect(() => () => api?.unmount(key), [api, key]);

  return api ? null : <>{children}</>;
}

const styles = StyleSheet.create({
  host: {
    ...fill,
    pointerEvents: 'box-none',
  },
});
