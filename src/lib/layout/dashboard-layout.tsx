'use client';

import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiBarChart, FiClock, FiLogOut, FiMenu, FiUser } from 'react-icons/fi';

import { useAuth } from '@/lib/auth/auth-context';

interface NavigationProps {
  children: React.ReactNode;
}

const menuItems = [
  { label: 'Profile', icon: FiUser, href: '/dashboard/profile' },
  { label: 'Absen', icon: FiClock, href: '/dashboard/attendance' },
  { label: 'Summary', icon: FiBarChart, href: '/dashboard/summary' },
];

const NavigationItems = ({
  onItemClick,
  pathname,
}: {
  onItemClick?: () => void;
  pathname: string;
}) => (
  <VStack align="stretch" gap={2}>
    {menuItems.map((item) => {
      const isActive = pathname === item.href;
      const Icon = item.icon;
      return (
        <Button
          key={item.href}
          asChild
          variant={isActive ? 'solid' : 'ghost'}
          colorPalette={isActive ? 'blue' : 'gray'}
          justifyContent="flex-start"
          onClick={onItemClick}
        >
          <Link
            href={item.href}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Icon />
            {item.label}
          </Link>
        </Button>
      );
    })}
  </VStack>
);

export function DashboardLayout({ children }: NavigationProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Flex height="100vh" overflow="hidden">
      {/* Sidebar for desktop */}
      <Box
        width="250px"
        bg="white"
        borderRightWidth="1px"
        borderColor="gray.200"
        p={4}
        display={{ base: 'none', md: 'block' }}
      >
        <VStack align="stretch" height="100%">
          <Box mb={6}>
            <Heading size="md" color="blue.600" mb={1}>
              WFH Attendance
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Employee Portal
            </Text>
          </Box>

          <NavigationItems
            onItemClick={() => setIsDrawerOpen(false)}
            pathname={pathname}
          />

          <Box mt="auto">
            <Button
              variant="ghost"
              colorPalette="red"
              width="100%"
              onClick={handleLogout}
            >
              <FiLogOut />
              Logout
            </Button>
          </Box>
        </VStack>
      </Box>

      {/* Main content area */}
      <Flex direction="column" flex={1} overflow="hidden">
        {/* Header */}
        <Box
          bg="white"
          borderBottomWidth="1px"
          borderColor="gray.200"
          px={4}
          py={3}
        >
          <Flex justify="space-between" align="center">
            {/* Mobile menu button */}
            <HStack>
              <Drawer.Root
                open={isDrawerOpen}
                onOpenChange={(e) => setIsDrawerOpen(e.open)}
                placement="start"
              >
                <DrawerTrigger asChild>
                  <IconButton
                    aria-label="Open menu"
                    display={{ base: 'flex', md: 'none' }}
                  >
                    <FiMenu />
                  </IconButton>
                </DrawerTrigger>

                <Portal>
                  <DrawerContent>
                    <DrawerHeader>
                      <Heading size="md" color="blue.600">
                        WFH Attendance
                      </Heading>
                      <Text fontSize="sm" color="gray.600">
                        Employee Portal
                      </Text>
                    </DrawerHeader>
                    <DrawerBody>
                      <VStack align="stretch" height="100%">
                        <NavigationItems
                          onItemClick={() => setIsDrawerOpen(false)}
                          pathname={pathname}
                        />

                        <Box mt="auto">
                          <Button
                            variant="ghost"
                            colorPalette="red"
                            width="100%"
                            onClick={() => {
                              handleLogout();
                              setIsDrawerOpen(false);
                            }}
                          >
                            <FiLogOut />
                            Logout
                          </Button>
                        </Box>
                      </VStack>
                    </DrawerBody>
                  </DrawerContent>
                </Portal>
              </Drawer.Root>

              <Heading size="md" display={{ base: 'none', md: 'block' }}>
                Dashboard
              </Heading>
            </HStack>

            {/* User menu */}
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button variant="ghost" size="sm">
                  <HStack>
                    <Avatar.Root size="sm">
                      <Avatar.Image src={user?.photo?.path} />
                      <Avatar.Fallback>
                        {user
                          ? `${user.firstName?.[0]}${user.lastName?.[0]}`
                          : 'U'}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <Box display={{ base: 'none', sm: 'block' }}>
                      <Text fontSize="sm" fontWeight="medium">
                        {user
                          ? `${user.firstName} ${user.lastName}`
                          : 'Loading...'}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {user?.position || 'Employee'}
                      </Text>
                    </Box>
                  </HStack>
                </Button>
              </Menu.Trigger>

              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="profile" asChild>
                      <Link href="/dashboard/profile">
                        <FiUser style={{ marginRight: '8px' }} />
                        Profile
                      </Link>
                    </Menu.Item>
                    <Menu.Item value="logout" onSelect={handleLogout}>
                      <FiLogOut style={{ marginRight: '8px' }} />
                      Logout
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Flex>
        </Box>

        {/* Main content */}
        <Box flex={1} overflow="auto" p={6}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
