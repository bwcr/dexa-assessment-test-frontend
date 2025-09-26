'use client';

import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { useAuth } from '@/lib/auth/auth-context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { DashboardLayout } from '@/lib/layout/dashboard-layout';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Heading size="lg" mb={2}>
            Welcome, {user?.firstName}!
          </Heading>
          <Text color="gray.600" mb={8}>
            Manage your attendance and profile information
          </Text>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
            <Card.Root>
              <Card.Body>
                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Profile
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : 'Loading...'}
                    </Text>
                  </Box>
                  <Icon color="blue.500" boxSize={8}>
                    <FiUser />
                  </Icon>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Position
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {user?.position || 'Employee'}
                    </Text>
                  </Box>
                  <Icon color="green.500" boxSize={8}>
                    <FiClock />
                  </Icon>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Today
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {new Date().toLocaleDateString()}
                    </Text>
                  </Box>
                  <Icon color="purple.500" boxSize={8}>
                    <FiCalendar />
                  </Icon>
                </HStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <Card.Root>
              <Card.Body textAlign="center">
                <Icon color="blue.500" boxSize={12} mx="auto" mb={4}>
                  <FiUser />
                </Icon>
                <Heading size="md" mb={2}>
                  Profile Management
                </Heading>
                <Text color="gray.600" mb={4}>
                  Update your personal information, photo, and contact details
                </Text>
                <Button asChild colorPalette="blue" width="100%">
                  <Link href="/dashboard/profile">Manage Profile</Link>
                </Button>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body textAlign="center">
                <Icon color="green.500" boxSize={12} mx="auto" mb={4}>
                  <FiClock />
                </Icon>
                <Heading size="md" mb={2}>
                  Attendance
                </Heading>
                <Text color="gray.600" mb={4}>
                  Check-in and check-out for your work from home sessions
                </Text>
                <Button asChild colorPalette="green" width="100%">
                  <Link href="/dashboard/attendance">Manage Attendance</Link>
                </Button>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body textAlign="center">
                <Icon color="purple.500" boxSize={12} mx="auto" mb={4}>
                  <FiCalendar />
                </Icon>
                <Heading size="md" mb={2}>
                  Attendance Summary
                </Heading>
                <Text color="gray.600" mb={4}>
                  View your attendance history and generate reports
                </Text>
                <Button asChild colorPalette="purple" width="100%">
                  <Link href="/dashboard/summary">View Summary</Link>
                </Button>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
