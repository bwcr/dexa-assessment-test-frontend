'use client';

import { Flex, Spinner, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

import { useAuth } from './auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!(loading || user)) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      fallback || (
        <Flex
          height="100vh"
          alignItems="center"
          justifyContent="center"
          direction="column"
          gap={4}
        >
          <Spinner size="xl" />
          <Text>Loading...</Text>
        </Flex>
      )
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Flex
        height="100vh"
        alignItems="center"
        justifyContent="center"
        direction="column"
        gap={4}
      >
        <Spinner size="xl" />
        <Text>Loading...</Text>
      </Flex>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
