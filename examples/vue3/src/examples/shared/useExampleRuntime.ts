import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  type ComputedRef,
  type Ref,
  type ShallowRef,
} from 'vue';

export interface DisposableExampleSession {
  dispose(): void;
}

interface UseExampleRuntimeOptions<TSession extends DisposableExampleSession> {
  readonly beforeMount?: () => void;
  readonly createSession: (element: HTMLDivElement) => TSession;
  readonly onError?: (error: unknown) => void;
  readonly onSessionMounted?: (session: TSession) => void;
  readonly onSessionReleased?: () => void;
}

export interface ExampleRuntime<TSession extends DisposableExampleSession> {
  readonly isRunning: ComputedRef<boolean>;
  readonly release: () => void;
  readonly rebuild: () => void;
  readonly runCount: Ref<number>;
  readonly session: ShallowRef<TSession | undefined>;
  readonly viewerElement: Ref<HTMLDivElement | null>;
}

export function useExampleRuntime<TSession extends DisposableExampleSession>(
  options: UseExampleRuntimeOptions<TSession>,
): ExampleRuntime<TSession> {
  const viewerElement = ref<HTMLDivElement | null>(null);
  const session = shallowRef<TSession>();
  const runCount = ref(0);
  let removeUnloadListener: (() => void) | undefined;

  const isRunning = computed(() => session.value !== undefined);

  function reportError(error: unknown, suppressErrors: boolean): void {
    if (suppressErrors) {
      console.error(error);
      return;
    }

    options.onError?.(error);
  }

  function releaseSession(suppressErrors = false): void {
    const activeSession = session.value;
    session.value = undefined;

    if (!activeSession) {
      options.onSessionReleased?.();
      return;
    }

    try {
      activeSession.dispose();
    } catch (error) {
      reportError(error, suppressErrors);
    } finally {
      options.onSessionReleased?.();
    }
  }

  function rebuild(): void {
    const element = viewerElement.value;

    if (!element) {
      reportError(new Error('缺少 Cesium Viewer 容器。'), false);
      return;
    }

    releaseSession(true);
    options.beforeMount?.();

    try {
      const nextSession = options.createSession(element);
      session.value = nextSession;
      runCount.value += 1;
      options.onSessionMounted?.(nextSession);
    } catch (error) {
      reportError(error, false);
    }
  }

  function release(): void {
    releaseSession(false);
  }

  onMounted(() => {
    rebuild();

    const handleBeforeUnload = () => {
      releaseSession(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload, {
      once: true,
    });
    removeUnloadListener = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  onBeforeUnmount(() => {
    removeUnloadListener?.();
    releaseSession(true);
  });

  return {
    isRunning,
    release,
    rebuild,
    runCount,
    session,
    viewerElement,
  };
}
