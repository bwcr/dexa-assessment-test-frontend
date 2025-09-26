'use client';

import { ChakraProvider } from '@chakra-ui/react';

import {customTheme} from '@/lib/styles/theme';
import { AuthProvider } from '@/lib/auth/auth-context';
import { NotificationProvider } from '@/lib/notifications/notification-context';
import { NotificationContainer } from '@/lib/notifications/notification-container';

import { ColorModeProvider } from './color-mode';

export function Provider(props: React.PropsWithChildren) {
  return (
    <ChakraProvider value={customTheme}>
      <ColorModeProvider>
        <AuthProvider>
          <NotificationProvider>
            {props.children}
            <NotificationContainer />
          </NotificationProvider>
        </AuthProvider>
      </ColorModeProvider>
    </ChakraProvider>
  );
}
