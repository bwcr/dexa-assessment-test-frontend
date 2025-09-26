'use client';

import { Alert, Box, IconButton, Portal, VStack } from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';

import { useNotifications } from './notification-context';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Box
        position="fixed"
        top={4}
        right={4}
        zIndex={9999}
        maxWidth="400px"
        width="100%"
        pointerEvents="none"
      >
        <VStack gap={2} align="stretch">
          {notifications.map((notification) => (
            <Box
              key={notification.id}
              pointerEvents="auto"
              opacity={1}
              transform="translateX(0)"
              transition="all 0.3s ease-in-out"
            >
              <Alert.Root status={notification.type}>
                <Alert.Indicator />
                <Alert.Title flex={1}>{notification.message}</Alert.Title>
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => removeNotification(notification.id)}
                  aria-label="Close notification"
                >
                  <FiX />
                </IconButton>
              </Alert.Root>
            </Box>
          ))}
        </VStack>
      </Box>
    </Portal>
  );
}
